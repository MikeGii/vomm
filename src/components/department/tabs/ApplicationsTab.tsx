// src/components/department/tabs/ApplicationsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerStats } from '../../../types';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { getPositionById } from '../../../data/policePositions';
import { getPositionDepartmentUnit, getGroupLeaderPositionForUnit } from '../../../utils/playerStatus';
import { useToast } from '../../../contexts/ToastContext';
import '../../../styles/components/department/tabs/ApplicationsTab.css';

interface ApplicationsTabProps {
    playerStats: PlayerStats;
}

interface ApplicationData {
    id: string;
    applicantId: string;
    applicantUserId: string;
    positionId: string;
    positionName: string;
    appliedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
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

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ playerStats }) => {
    const [applications, setApplications] = useState<ApplicationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedApprovalApplication, setSelectedApprovalApplication] = useState<{id: string, applicantId: string} | null>(null);

    const { showToast } = useToast();

    const loadApplications = useCallback(async () => {
        // Only group leaders can see applications
        if (!playerStats.policePosition?.startsWith('grupijuht_')) {
            setLoading(false);
            return;
        }

        const currentUnit = getPositionDepartmentUnit(playerStats.policePosition);
        if (!currentUnit) {
            setLoading(false);
            return;
        }

        const myGroupLeaderPosition = getGroupLeaderPositionForUnit(currentUnit);
        if (!myGroupLeaderPosition) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            // Get all pending applications for the group leader position in my unit
            const applicationsQuery = query(
                collection(firestore, 'applications'),
                where('positionId', '==', myGroupLeaderPosition),
                where('status', '==', 'pending')
            );

            const querySnapshot = await getDocs(applicationsQuery);
            const loadedApplications: ApplicationData[] = [];

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
                    status: data.status || 'pending',
                    applicantData: data.applicantData || {}
                });
            });

            // Sort by application date (newest first)
            loadedApplications.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());

            setApplications(loadedApplications);
        } catch (error) {
            console.error('Error loading applications:', error);
            showToast('Viga avalduste laadimisel', 'error');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, [playerStats, showToast]);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const openApprovalModal = (applicationId: string, applicantId: string) => {
        setSelectedApprovalApplication({ id: applicationId, applicantId });
        setShowApprovalModal(true);
    };

    const handleApprove = async () => {
        if (!selectedApprovalApplication) return;

        setProcessing(selectedApprovalApplication.id);

        try {
            // Update application status
            const applicationRef = doc(firestore, 'applications', selectedApprovalApplication.id);
            await updateDoc(applicationRef, {
                status: 'approved',
                reviewedAt: new Date(),
                reviewedBy: playerStats.username
            });

            // Update player's position
            const playerRef = doc(firestore, 'playerStats', selectedApprovalApplication.applicantId);
            const currentUnit = getPositionDepartmentUnit(playerStats.policePosition);
            const groupLeaderPosition = getGroupLeaderPositionForUnit(currentUnit || '');

            if (groupLeaderPosition) {
                await updateDoc(playerRef, {
                    policePosition: groupLeaderPosition
                });
            }

            showToast('Avaldus heaks kiidetud ja mängija ametisse määratud', 'success');

            // Reset modal state and refresh
            setShowApprovalModal(false);
            setSelectedApprovalApplication(null);
            loadApplications();

        } catch (error) {
            console.error('Error approving application:', error);
            showToast('Viga avalduse heakskiitmisel', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!selectedApplication || !rejectionReason.trim()) {
            showToast('Palun sisesta tagasilükkamise põhjus', 'warning');
            return;
        }

        setProcessing(selectedApplication.id);

        try {
            // Update application status
            const applicationRef = doc(firestore, 'applications', selectedApplication.id);
            await updateDoc(applicationRef, {
                status: 'rejected',
                reviewedAt: new Date(),
                reviewedBy: playerStats.username,
                rejectionReason: rejectionReason.trim()
            });

            showToast('Avaldus tagasi lükatud', 'success');

            // Reset modal state
            setShowRejectModal(false);
            setSelectedApplication(null);
            setRejectionReason('');

            // Refresh applications list
            loadApplications();

        } catch (error) {
            console.error('Error rejecting application:', error);
            showToast('Viga avalduse tagasilükkamisel', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const openRejectModal = (application: ApplicationData) => {
        setSelectedApplication(application);
        setShowRejectModal(true);
        setRejectionReason('');
    };

    const closeRejectModal = () => {
        setShowRejectModal(false);
        setSelectedApplication(null);
        setRejectionReason('');
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

    const getAttributeDisplayName = (attrName: string): string => {
        const attrNames: Record<string, string> = {
            'strength': 'Jõud',
            'agility': 'Kiirus',
            'dexterity': 'Osavus',
            'intelligence': 'Intelligentsus',
            'endurance': 'Vastupidavus'
        };
        return attrNames[attrName] || attrName;
    };

    // Only show for group leaders
    if (!playerStats.policePosition?.startsWith('grupijuht_')) {
        return (
            <div className="applications-tab">
                <div className="no-access">
                    <div className="no-access-icon">🚫</div>
                    <div className="no-access-text">
                        Ainult grupijuhid saavad vaadata avaldusi
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="applications-tab">
                <div className="loading">Laadin avalduste andmeid...</div>
            </div>
        );
    }

    return (
        <div className="applications-tab">
            <div className="tab-header">
                <h3>Avaldused minu üksusesse</h3>
                <div className="applications-summary">
                    <span className="summary-item">
                        Ootel avaldused: {applications.length}
                    </span>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="no-applications">
                    <div className="no-applications-icon">📄</div>
                    <div className="no-applications-text">
                        Praegu pole ootel olevaid avaldusi
                    </div>
                    <div className="no-applications-hint">
                        Avaldused ilmuvad siia, kui keegi kandideerib grupijuhi positsioonile sinu üksuses.
                    </div>
                </div>
            ) : (
                <div className="applications-list">
                    {applications.map(application => (
                        <div key={application.id} className="application-card">
                            <div className="application-header">
                                <div className="applicant-info">
                                    <h4 className="applicant-name">{application.applicantId}</h4>
                                    <div className="application-position">
                                        Kandideerib: {application.positionName}
                                    </div>
                                    <div className="application-date">
                                        Avaldus esitatud: {formatDate(application.appliedAt)}
                                    </div>
                                </div>
                                <div className="application-actions">
                                    <button
                                        className="btn-approve"
                                        onClick={() => openApprovalModal(application.id, application.applicantId)}
                                        disabled={processing === application.id}
                                    >
                                        {processing === application.id ? 'Töötleb...' : 'Kiida heaks'}
                                    </button>
                                    <button
                                        className="btn-reject"
                                        onClick={() => openRejectModal(application)}
                                        disabled={processing === application.id}
                                    >
                                        Lükka tagasi
                                    </button>
                                </div>
                            </div>

                            <div className="applicant-details">
                                <div className="details-section">
                                    <h5>Kandidaadi andmed</h5>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Tase:</span>
                                            <span className="detail-value">{application.applicantData.level}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Töötunnid:</span>
                                            <span className="detail-value">{application.applicantData.totalWorkedHours} tundi</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Maine:</span>
                                            <span className="detail-value">{application.applicantData.reputation}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Praegune positsioon:</span>
                                            <span className="detail-value">
                                                {getPositionById(application.applicantData.currentPosition)?.name || 'Tundmatu'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {application.applicantData.attributes && (
                                    <div className="details-section">
                                        <h5>Atribuudid</h5>
                                        <div className="attributes-grid">
                                            {Object.entries(application.applicantData.attributes).map(([attr, value]) => (
                                                <div key={attr} className="attribute-item">
                                                    <span className="attribute-label">
                                                        {getAttributeDisplayName(attr)}:
                                                    </span>
                                                    <span className="attribute-value">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {application.applicantData.completedCourses && application.applicantData.completedCourses.length > 0 && (
                                    <div className="details-section">
                                        <h5>Lõpetatud koolitused ({application.applicantData.completedCourses.length})</h5>
                                        <div className="courses-list">
                                            {application.applicantData.completedCourses.slice(0, 5).map((courseId, index) => (
                                                <span key={index} className="course-badge">
                                                    {courseId}
                                                </span>
                                            ))}
                                            {application.applicantData.completedCourses.length > 5 && (
                                                <span className="course-badge more">
                                                    +{application.applicantData.completedCourses.length - 5} veel
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedApplication && (
                <div className="modal-overlay" onClick={closeRejectModal}>
                    <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Avalduse tagasilükkamine</h3>
                            <button className="modal-close" onClick={closeRejectModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="applicant-summary">
                                <strong>Kandidaat:</strong> {selectedApplication.applicantId}
                            </div>
                            <div className="applicant-summary">
                                <strong>Positsioon:</strong> {selectedApplication.positionName}
                            </div>

                            <div className="rejection-form">
                                <label htmlFor="rejection-reason">
                                    <strong>Tagasilükkamise põhjus:</strong>
                                </label>
                                <textarea
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Kirjuta põhjus, miks avaldus tagasi lükatakse..."
                                    rows={4}
                                    maxLength={500}
                                />
                                <div className="character-count">
                                    {rejectionReason.length}/500
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={closeRejectModal}
                                disabled={processing === selectedApplication.id}
                            >
                                Tühista
                            </button>
                            <button
                                className="btn-confirm-reject"
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || processing === selectedApplication.id}
                            >
                                {processing === selectedApplication.id ? 'Töötleb...' : 'Lükka tagasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedApprovalApplication && (
                <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
                    <div className="modal-content approval-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Avalduse heakskiitmine</h3>
                            <button className="modal-close" onClick={() => setShowApprovalModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <p>Kas oled kindel, et tahad selle avalduse heaks kiita?</p>
                            <p>Kandidaat määratakse automaatselt grupijuhi positsioonile.</p>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowApprovalModal(false)}
                                disabled={selectedApprovalApplication && processing === selectedApprovalApplication.id}
                            >
                                Tühista
                            </button>
                            <button
                                className="btn-confirm-approve"
                                onClick={handleApprove}
                                disabled={selectedApprovalApplication && processing === selectedApprovalApplication.id}
                            >
                                {selectedApprovalApplication && processing === selectedApprovalApplication.id ? 'Töötleb...' : 'Kiida heaks'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};