// src/components/admin/AdminApplicationsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { getPositionById } from '../../data/policePositions';
import {
    getPositionDepartmentUnit,
    canUnitAcceptMoreGroupLeaders,
    getGroupLeaderCountInUnit,
    hasUnitLeader, getCurrentUnitLeader
} from '../../utils/playerStatus';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/admin/AdminApplicationsTab.css';

interface ApplicationVote {
    voterId: string;
    voterName: string;
    vote: 'approve' | 'reject';
    votedAt: Date;
}

interface AdminApplicationData {
    id: string;
    applicantId: string;
    applicantUserId: string;
    positionId: string;
    positionName: string;
    appliedAt: Date;
    expiresAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    department: string;
    prefecture: string;
    votes: ApplicationVote[];
    applicantData: {
        level: number;
        totalWorkedHours: number;
        reputation: number;
        completedCourses: string[];
        currentPosition: string;
        currentUnit: string;
        attributes?: {
            strength: number;
            agility: number;
            dexterity: number;
            intelligence: number;
            endurance: number;
        };
    };
}

export const AdminApplicationsTab: React.FC = () => {
    const [applications, setApplications] = useState<AdminApplicationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<AdminApplicationData | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [rejectionReason, setRejectionReason] = useState('');

    const { showToast } = useToast();

    const loadApplications = useCallback(async () => {
        setLoading(true);

        try {
            // Get all pending applications
            const applicationsQuery = query(
                collection(firestore, 'applications'),
                where('status', '==', 'pending')
            );

            const querySnapshot = await getDocs(applicationsQuery);
            const loadedApplications: AdminApplicationData[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const position = getPositionById(data.positionId);

                loadedApplications.push({
                    id: doc.id,
                    applicantId: data.applicantId,
                    applicantUserId: data.applicantUserId,
                    positionId: data.positionId,
                    positionName: position?.name || 'Tundmatu positsioon',
                    appliedAt: data.appliedAt?.toDate() || new Date(),
                    expiresAt: data.expiresAt?.toDate() || new Date(),
                    status: data.status || 'pending',
                    department: data.department || 'Tundmatu',
                    prefecture: data.prefecture || 'Tundmatu',
                    votes: data.votes || [],
                    applicantData: data.applicantData || {}
                });
            });

            // Sort by expiration date - closest expiration first
            loadedApplications.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

            setApplications(loadedApplications);
        } catch (error) {
            console.error('Error loading applications:', error);
            showToast('Viga avalduste laadimisel', 'error');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const cleanupExpiredApplications = async () => {
        const now = new Date();
        const expiredApps = applications.filter(app => app.expiresAt <= now);

        if (expiredApps.length === 0) {
            showToast('Aegunud avaldusi pole', 'info');
            return;
        }

        try {
            const deletePromises = expiredApps.map(app =>
                deleteDoc(doc(firestore, 'applications', app.id))
            );

            await Promise.all(deletePromises);
            showToast(`${expiredApps.length} aegunud avaldust eemaldatud`, 'success');
            loadApplications();
        } catch (error) {
            console.error('Error cleaning up expired applications:', error);
            showToast('Viga aegunud avalduste eemaldamisel', 'error');
        }
    };

    const openActionModal = (application: AdminApplicationData, action: 'approve' | 'reject') => {
        setSelectedApplication(application);
        setActionType(action);
        setShowActionModal(true);
        setRejectionReason('');
    };

    const closeActionModal = () => {
        setShowActionModal(false);
        setSelectedApplication(null);
        setRejectionReason('');
    };

    const handleAdminAction = async () => {
        if (!selectedApplication) return;

        if (actionType === 'reject' && !rejectionReason.trim()) {
            showToast('Palun sisesta tagasilükkamise põhjus', 'warning');
            return;
        }

        setProcessing(selectedApplication.id);

        try {
            if (actionType === 'approve') {
                const targetUnit = getPositionDepartmentUnit(selectedApplication.positionId);

                // Check if this is a unit leader position
                if (selectedApplication.positionId.startsWith('talituse_juht_')) {
                    const hasLeader = await hasUnitLeader(
                        targetUnit || '',
                        selectedApplication.department,
                        selectedApplication.prefecture
                    );
                    if (hasLeader) {
                        const currentLeader = await getCurrentUnitLeader(
                            targetUnit || '',
                            selectedApplication.department,
                            selectedApplication.prefecture
                        );
                        showToast(`Viga: Üksuses on juba talituse juht: ${currentLeader || 'Keegi'}`, 'error');
                        return;
                    }
                }

                // Approve application
                const applicationRef = doc(firestore, 'applications', selectedApplication.id);
                await updateDoc(applicationRef, {
                    status: 'approved',
                    reviewedAt: new Date(),
                    reviewedBy: 'admin',
                    adminDecision: 'approved'
                });

                // FIXED: Use applicantUserId instead of applicantId
                const playerRef = doc(firestore, 'playerStats', selectedApplication.applicantUserId);
                await updateDoc(playerRef, {
                    policePosition: selectedApplication.positionId,
                    departmentUnit: targetUnit
                });

                showToast('Avaldus heaks kiidetud ja mängija ametisse määratud', 'success');
            } else {
                // Reject application
                const applicationRef = doc(firestore, 'applications', selectedApplication.id);
                await updateDoc(applicationRef, {
                    status: 'rejected',
                    reviewedAt: new Date(),
                    reviewedBy: 'admin',
                    adminDecision: 'rejected',
                    rejectionReason: rejectionReason.trim()
                });

                showToast('Avaldus tagasi lükatud', 'success');
            }

            closeActionModal();
            loadApplications();

        } catch (error) {
            console.error('Error processing application:', error);
            showToast('Viga avalduse töötlemisel', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('et-EE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTimeRemaining = (expiresAt: Date): string => {
        const now = new Date();
        const timeLeft = expiresAt.getTime() - now.getTime();

        if (timeLeft <= 0) {
            return 'Aegunud';
        }

        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        if (hoursLeft > 0) {
            return `${hoursLeft}h ${minutesLeft}m`;
        }
        return `${minutesLeft}m`;
    };

    if (loading) {
        return (
            <div className="admin-applications-tab">
                <div className="loading">Laadin avalduste andmeid...</div>
            </div>
        );
    }

    return (
        <div className="admin-applications-tab">
            <div className="tab-header">
                <h3>Kandideerimised</h3>
                <div className="header-actions">
                    <div className="summary-stats">
                        <span className="stat-item">
                            Kokku: {applications.length}
                        </span>
                        <span className="stat-item expired">
                            Aegunud: {applications.filter(app => new Date() > app.expiresAt).length}
                        </span>
                    </div>
                    <button
                        className="cleanup-btn"
                        onClick={cleanupExpiredApplications}
                        disabled={processing !== null}
                    >
                        Eemalda aegunud
                    </button>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="no-applications">
                    <div className="no-applications-icon">📄</div>
                    <div className="no-applications-text">
                        Ootel avaldusi pole
                    </div>
                </div>
            ) : (
                <div className="applications-list">
                    {applications.map(application => {
                        const approveVotes = application.votes.filter(vote => vote.vote === 'approve').length;
                        const rejectVotes = application.votes.filter(vote => vote.vote === 'reject').length;
                        const timeRemaining = formatTimeRemaining(application.expiresAt);
                        const isExpired = new Date() > application.expiresAt;

                        return (
                            <div key={application.id} className="admin-application-card">
                                <div className="application-summary">
                                    <div className="applicant-info">
                                        <h4>{application.applicantId}</h4>
                                        <div className="application-details">
                                            <span>Kandideerib: {application.positionName}</span>
                                            <span className={`position-type-badge ${application.positionId.startsWith('talituse_juht_') ? 'unit-leader' : 'group-leader'}`}>
                                                {application.positionId.startsWith('talituse_juht_') ? 'Talituse juht' : 'Grupijuht'}
                                            </span>
                                            <span>Osakond: {application.department}</span>
                                            <span>Prefektuur: {application.prefecture}</span>
                                        </div>
                                        <div className="application-timing">
                                            <span>Esitatud: {formatDate(application.appliedAt)}</span>
                                            <span className={`expires ${isExpired ? 'expired' : timeRemaining.includes('h') ? 'normal' : 'urgent'}`}>
                                                {isExpired ? 'Aegunud' : `Aegub: ${timeRemaining}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="vote-summary">
                                        <div className="vote-counts">
                                            <span className="vote-count approve">👍 {approveVotes}</span>
                                            <span className="vote-count reject">👎 {rejectVotes}</span>
                                        </div>
                                        <div className="vote-trend">
                                            {approveVotes > rejectVotes ? 'Positiivne' :
                                                rejectVotes > approveVotes ? 'Negatiivne' : 'Neutraalne'}
                                        </div>
                                    </div>

                                    <div className="admin-actions">
                                        <button
                                            className="btn-admin-approve"
                                            onClick={() => openActionModal(application, 'approve')}
                                            disabled={processing === application.id || isExpired}
                                        >
                                            Kiida heaks
                                        </button>
                                        <button
                                            className="btn-admin-reject"
                                            onClick={() => openActionModal(application, 'reject')}
                                            disabled={processing === application.id || isExpired}
                                        >
                                            Lükka tagasi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action Modal */}
            {showActionModal && selectedApplication && (
                <div className="modal-overlay" onClick={closeActionModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {actionType === 'approve' ? 'Avalduse heakskiitmine' : 'Avalduse tagasilükkamine'}
                            </h3>
                            <button className="modal-close" onClick={closeActionModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="application-summary-modal">
                                <p><strong>Kandidaat:</strong> {selectedApplication.applicantId}</p>
                                <p><strong>Positsioon:</strong> {selectedApplication.positionName}</p>
                                <p><strong>Osakond:</strong> {selectedApplication.department}</p>
                            </div>

                            {actionType === 'reject' && (
                                <div className="rejection-form">
                                    <label htmlFor="rejection-reason">
                                        <strong>Tagasilükkamise põhjus:</strong>
                                    </label>
                                    <textarea
                                        id="rejection-reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Kirjuta põhjus..."
                                        rows={4}
                                        maxLength={500}
                                    />
                                    <div className="character-count">
                                        {rejectionReason.length}/500
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={closeActionModal}
                                disabled={processing === selectedApplication?.id}
                            >
                                Tühista
                            </button>
                            <button
                                className={`btn-confirm ${actionType === 'approve' ? 'approve' : 'reject'}`}
                                onClick={handleAdminAction}
                                disabled={
                                    processing === selectedApplication?.id ||
                                    (actionType === 'reject' && !rejectionReason.trim())
                                }
                            >
                                {processing === selectedApplication?.id ? 'Töötleb...' :
                                    actionType === 'approve' ? 'Kiida heaks' : 'Lükka tagasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};