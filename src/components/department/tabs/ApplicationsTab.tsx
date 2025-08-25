// src/components/department/tabs/ApplicationsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerStats } from '../../../types';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { getPositionById } from '../../../data/policePositions';
import {
    getPositionDepartmentUnit,
    getGroupLeaderPositionForUnit,
} from '../../../utils/playerStatus';
import { useToast } from '../../../contexts/ToastContext';
import '../../../styles/components/department/tabs/ApplicationsTab.css';

interface ApplicationVote {
    voterId: string;
    voterName: string;
    vote: 'approve' | 'reject';
    votedAt: Date;
}

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
    expiresAt: Date;
    status: 'pending' | 'approved' | 'rejected';
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

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ playerStats }) => {
    const [applications, setApplications] = useState<ApplicationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

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
                    expiresAt: data.expiresAt?.toDate() || new Date(),
                    status: data.status || 'pending',
                    votes: data.votes || [],
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

    const handleVote = async (applicationId: string, vote: 'approve' | 'reject') => {
        if (!applicationId || processing) return;

        setProcessing(applicationId);

        try {
            // Get current application data directly
            const applicationRef = doc(firestore, 'applications', applicationId);
            const applicationDoc = await getDoc(applicationRef);

            if (!applicationDoc.exists()) {
                showToast('Avaldust ei leitud', 'error');
                return;
            }

            const currentApp = applicationDoc.data();
            const existingVotes = currentApp.votes || [];

            // Check if user already voted
            const userAlreadyVoted = existingVotes.some((v: any) => v.voterId === playerStats.username);
            if (userAlreadyVoted) {
                showToast('Sa oled juba hääletanud', 'warning');
                return;
            }

            // Add new vote
            const newVote = {
                voterId: playerStats.username,
                voterName: playerStats.username,
                vote: vote,
                votedAt: new Date()
            };

            const updatedVotes = [...existingVotes, newVote];

            await updateDoc(applicationRef, {
                votes: updatedVotes
            });

            showToast(`Hääl edukalt esitatud: ${vote === 'approve' ? 'Toetatakse' : 'Ei toetata'}`, 'success');

            // Refresh applications list
            loadApplications();

        } catch (error) {
            console.error('Error submitting vote:', error);
            showToast('Viga hääletamisel', 'error');
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
                    {applications.map(application => {
                        const userVote = application.votes?.find(vote => vote.voterId === playerStats.username);
                        const approveVotes = application.votes?.filter(vote => vote.vote === 'approve').length || 0;
                        const rejectVotes = application.votes?.filter(vote => vote.vote === 'reject').length || 0;
                        const timeRemaining = formatTimeRemaining(application.expiresAt);
                        const isExpired = new Date() > application.expiresAt;

                        return (
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
                                        <div className={`application-expires ${isExpired ? 'expired' : timeRemaining.includes('h') ? 'normal' : 'urgent'}`}>
                                            {isExpired ? 'Aegunud' : `Aegub: ${timeRemaining}`}
                                        </div>
                                    </div>

                                    <div className="application-actions">
                                        <div className="vote-summary">
                                            <span className="vote-count approve">
                                                👍 {approveVotes}
                                            </span>
                                            <span className="vote-count reject">
                                                👎 {rejectVotes}
                                            </span>
                                        </div>

                                        <div className="voting-buttons">
                                            <button
                                                className={`btn-vote btn-vote-approve ${userVote?.vote === 'approve' ? 'voted' : ''}`}
                                                onClick={() => handleVote(application.id, 'approve')}
                                                disabled={processing === application.id || !!userVote || isExpired}
                                            >
                                                {userVote?.vote === 'approve' ? 'Toetad' : 'Toetan'}
                                            </button>
                                            <button
                                                className={`btn-vote btn-vote-reject ${userVote?.vote === 'reject' ? 'voted' : ''}`}
                                                onClick={() => handleVote(application.id, 'reject')}
                                                disabled={processing === application.id || !!userVote || isExpired}
                                            >
                                                {userVote?.vote === 'reject' ? 'Ei toeta' : 'Ei toeta'}
                                            </button>
                                        </div>

                                        {userVote && (
                                            <div className="user-vote-status">
                                                Sinu hääl: {userVote.vote === 'approve' ? 'Toetad' : 'Ei toeta'}
                                            </div>
                                        )}
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

                                    {application.votes && application.votes.length > 0 && (
                                        <div className="details-section">
                                            <h5>Hääled ({application.votes.length})</h5>
                                            <div className="votes-list">
                                                {application.votes.map((vote, index) => (
                                                    <div key={index} className={`vote-item ${vote.vote}`}>
                                                        <span className="vote-user">{vote.voterName}</span>
                                                        <span className="vote-decision">
                                                            {vote.vote === 'approve' ? '👍 Toetab' : '👎 Ei toeta'}
                                                        </span>
                                                        <span className="vote-time">
                                                            {formatDate(vote.votedAt)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};