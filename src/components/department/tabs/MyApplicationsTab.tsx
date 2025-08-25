// src/components/department/tabs/MyApplicationsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerStats } from '../../../types';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { getPositionById } from '../../../data/policePositions';
import { getUnitById } from '../../../data/departmentUnits';
import { useToast } from '../../../contexts/ToastContext';
import '../../../styles/components/department/tabs/MyApplicationsTab.css';

interface MyApplicationsTabProps {
    playerStats: PlayerStats;
}

interface Application {
    id: string;
    positionId: string;
    positionName: string;
    unitName: string;
    appliedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
}

export const MyApplicationsTab: React.FC<MyApplicationsTabProps> = ({ playerStats }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedCancelApplication, setSelectedCancelApplication] = useState<{id: string, positionName: string} | null>(null);
    const { showToast } = useToast();

    const loadMyApplications = useCallback(async () => {
        if (!playerStats.username) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const applicationsQuery = query(
                collection(firestore, 'applications'),
                where('applicantId', '==', playerStats.username)
            );

            const querySnapshot = await getDocs(applicationsQuery);
            const loadedApplications: Application[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const position = getPositionById(data.positionId);
                const unit = getUnitById(position?.departmentUnit || '');

                loadedApplications.push({
                    id: doc.id,
                    positionId: data.positionId,
                    positionName: position?.name || 'Tundmatu positsioon',
                    unitName: unit?.name || 'Tundmatu üksus',
                    appliedAt: data.appliedAt?.toDate() || new Date(),
                    status: data.status || 'pending',
                    reviewedAt: data.reviewedAt?.toDate(),
                    reviewedBy: data.reviewedBy,
                    rejectionReason: data.rejectionReason
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
    }, [playerStats.username, showToast]);

// Update the useEffect:
    useEffect(() => {
        loadMyApplications();
    }, [loadMyApplications]);

    const openCancelModal = (applicationId: string, positionName: string) => {
        setSelectedCancelApplication({ id: applicationId, positionName });
        setShowCancelModal(true);
    };

    const handleCancelApplication = async () => {
        if (!selectedCancelApplication) return;

        try {
            await deleteDoc(doc(firestore, 'applications', selectedCancelApplication.id));
            showToast('Avaldus edukalt tühistatud', 'success');

            // Remove from local state
            setApplications(prev => prev.filter(app => app.id !== selectedCancelApplication.id));

            // Reset modal state
            setShowCancelModal(false);
            setSelectedCancelApplication(null);
        } catch (error) {
            console.error('Error canceling application:', error);
            showToast('Viga avalduse tühistamisel', 'error');
        }
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'pending':
                return { text: 'Ootel', className: 'status-pending' };
            case 'approved':
                return { text: 'Heaks kiidetud', className: 'status-approved' };
            case 'rejected':
                return { text: 'Tagasi lükatud', className: 'status-rejected' };
            default:
                return { text: 'Tundmatu', className: 'status-unknown' };
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

    const pendingApplications = applications.filter(app => app.status === 'pending');
    const processedApplications = applications.filter(app => app.status !== 'pending');

    if (loading) {
        return (
            <div className="my-applications-tab">
                <div className="loading">Laadin avalduste andmeid...</div>
            </div>
        );
    }

    return (
        <div className="my-applications-tab">
            <div className="tab-header">
                <h3>Minu avaldused</h3>
                <div className="applications-summary">
                    <span className="summary-item">
                        Kokku: {applications.length}
                    </span>
                    <span className="summary-item pending">
                        Ootel: {pendingApplications.length}
                    </span>
                    <span className="summary-item processed">
                        Läbi vaadatud: {processedApplications.length}
                    </span>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="no-applications">
                    <div className="no-applications-icon">📄</div>
                    <div className="no-applications-text">
                        Sa pole veel ühtegi avaldust esitanud.
                    </div>
                    <div className="no-applications-hint">
                        Vaata "Vabad ametikohad" sakki, et näha võimalikke positsioone.
                    </div>
                </div>
            ) : (
                <div className="applications-list">
                    {/* Pending Applications */}
                    {pendingApplications.length > 0 && (
                        <div className="applications-section">
                            <h4 className="section-title">Ootel olevad avaldused</h4>
                            {pendingApplications.map(application => (
                                <div key={application.id} className="application-card pending-card">
                                    <div className="application-header">
                                        <div className="application-info">
                                            <h5 className="application-position">
                                                {application.positionName}
                                            </h5>
                                            <div className="application-unit">
                                                {application.unitName}
                                            </div>
                                        </div>
                                        <div className="application-status-badge">
                                            <span className={`status-badge ${getStatusDisplay(application.status).className}`}>
                                                {getStatusDisplay(application.status).text}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="application-details">
                                        <div className="application-date">
                                            <strong>Kandideerimise aeg:</strong> {formatDate(application.appliedAt)}
                                        </div>
                                    </div>

                                    <div className="application-actions">
                                        <button
                                            className="btn-cancel-application"
                                            onClick={() => openCancelModal(application.id, application.positionName)}
                                        >
                                            Tühista avaldus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Processed Applications */}
                    {processedApplications.length > 0 && (
                        <div className="applications-section">
                            <h4 className="section-title">Läbi vaadatud avaldused</h4>
                            {processedApplications.map(application => (
                                <div key={application.id} className={`application-card processed-card ${application.status}`}>
                                    <div className="application-header">
                                        <div className="application-info">
                                            <h5 className="application-position">
                                                {application.positionName}
                                            </h5>
                                            <div className="application-unit">
                                                {application.unitName}
                                            </div>
                                        </div>
                                        <div className="application-status-badge">
                                            <span className={`status-badge ${getStatusDisplay(application.status).className}`}>
                                                {getStatusDisplay(application.status).text}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="application-details">
                                        <div className="application-timeline">
                                            <div className="timeline-item">
                                                <strong>Kandideerimise aeg:</strong> {formatDate(application.appliedAt)}
                                            </div>
                                            {application.reviewedAt && (
                                                <div className="timeline-item">
                                                    <strong>Läbivaatamise aeg:</strong> {formatDate(application.reviewedAt)}
                                                </div>
                                            )}
                                            {application.reviewedBy && (
                                                <div className="timeline-item">
                                                    <strong>Läbi vaadanud:</strong> {application.reviewedBy}
                                                </div>
                                            )}
                                        </div>

                                        {application.rejectionReason && (
                                            <div className="rejection-reason">
                                                <strong>Tagasilükkamise põhjus:</strong>
                                                <div className="reason-text">{application.rejectionReason}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && selectedCancelApplication && (
                <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Avalduse tühistamine</h3>
                            <button className="modal-close" onClick={() => setShowCancelModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Kas oled kindel, et tahad tühistada avalduse positsioonile "{selectedCancelApplication.positionName}"?</p>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowCancelModal(false)}>Tühista</button>
                            <button onClick={handleCancelApplication}>Kinnita</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};