// src/components/department/tabs/ApplicationsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerStats } from '../../../types';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { getPositionById } from '../../../data/policePositions';
import {
    getPositionDepartmentUnit,
    getGroupLeaderPositionForUnit,
    getUnitLeaderPositionForUnit,
    isGroupLeader
} from '../../../utils/playerStatus';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
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
    applicationType: 'group_leader' | 'unit_leader';
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
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'group_leader' | 'unit_leader'>('all');
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();
    const { currentUser } = useAuth();

    // Safe date processing function
    const safeToDate = (firebaseDate: any): Date => {
        try {
            if (firebaseDate && typeof firebaseDate.toDate === 'function') {
                return firebaseDate.toDate();
            } else if (firebaseDate instanceof Date) {
                return firebaseDate;
            } else if (firebaseDate && firebaseDate.seconds) {
                return new Date(firebaseDate.seconds * 1000);
            } else {
                return new Date();
            }
        } catch (error) {
            console.warn('Error processing date:', error);
            return new Date();
        }
    };

    const loadApplications = useCallback(async () => {
        // Process votes function moved inside to fix dependency issue
        const processVotes = (votes: any[]): ApplicationVote[] => {
            if (!Array.isArray(votes)) {
                return [];
            }

            return votes
                .filter(vote => vote && vote.voterId)
                .map(vote => ({
                    voterId: vote.voterId || '',
                    voterName: vote.voterName || vote.voterId || 'Tundmatu',
                    vote: vote.vote === 'approve' || vote.vote === 'reject' ? vote.vote : 'approve',
                    votedAt: safeToDate(vote.votedAt)
                }));
        };

        try {
            setError(null);

            if (!isGroupLeader(playerStats)) {
                setLoading(false);
                return;
            }

            const currentUnit = getPositionDepartmentUnit(playerStats.policePosition);
            if (!currentUnit) {
                setLoading(false);
                return;
            }

            const myGroupLeaderPosition = getGroupLeaderPositionForUnit(currentUnit);
            const unitLeaderPosition = getUnitLeaderPositionForUnit(currentUnit);

            if (!myGroupLeaderPosition) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const queries = [];

            queries.push(
                getDocs(query(
                    collection(firestore, 'applications'),
                    where('positionId', '==', myGroupLeaderPosition),
                    where('status', '==', 'pending')
                ))
            );

            if (unitLeaderPosition) {
                queries.push(
                    getDocs(query(
                        collection(firestore, 'applications'),
                        where('positionId', '==', unitLeaderPosition),
                        where('status', '==', 'pending')
                    ))
                );
            }

            const queryResults = await Promise.all(queries);
            const loadedApplications: ApplicationData[] = [];

            queryResults[0].forEach((doc) => {
                try {
                    const data = doc.data();
                    const position = getPositionById(data.positionId);

                    if (data && doc.id) {
                        loadedApplications.push({
                            id: doc.id,
                            applicantId: data.applicantId || '',
                            applicantUserId: data.applicantUserId || '',
                            positionId: data.positionId || '',
                            positionName: position?.name || 'Tundmatu positsioon',
                            appliedAt: safeToDate(data.appliedAt),
                            expiresAt: safeToDate(data.expiresAt),
                            status: data.status || 'pending',
                            votes: processVotes(data.votes),
                            applicationType: 'group_leader',
                            applicantData: data.applicantData || {
                                level: 0,
                                totalWorkedHours: 0,
                                reputation: 0,
                                completedCourses: [],
                                currentPosition: '',
                                currentUnit: ''
                            }
                        });
                    }
                } catch (docError) {
                    console.error('Error processing group leader application doc:', docError);
                }
            });

            if (queryResults[1]) {
                queryResults[1].forEach((doc) => {
                    try {
                        const data = doc.data();
                        const position = getPositionById(data.positionId);

                        if (data && doc.id) {
                            loadedApplications.push({
                                id: doc.id,
                                applicantId: data.applicantId || '',
                                applicantUserId: data.applicantUserId || '',
                                positionId: data.positionId || '',
                                positionName: position?.name || 'Tundmatu positsioon',
                                appliedAt: safeToDate(data.appliedAt),
                                expiresAt: safeToDate(data.expiresAt),
                                status: data.status || 'pending',
                                votes: processVotes(data.votes),
                                applicationType: 'unit_leader',
                                applicantData: data.applicantData || {
                                    level: 0,
                                    totalWorkedHours: 0,
                                    reputation: 0,
                                    completedCourses: [],
                                    currentPosition: '',
                                    currentUnit: ''
                                }
                            });
                        }
                    } catch (docError) {
                        console.error('Error processing unit leader application doc:', docError);
                    }
                });
            }

            loadedApplications.sort((a, b) => {
                try {
                    return b.appliedAt.getTime() - a.appliedAt.getTime();
                } catch (sortError) {
                    console.warn('Error sorting applications:', sortError);
                    return 0;
                }
            });

            setApplications(loadedApplications);
        } catch (error) {
            console.error('Error loading applications:', error);
            setError('Viga avalduste laadimisel');
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
        if (!applicationId || processing || !playerStats?.username) {
            return;
        }

        setProcessing(applicationId);

        try {
            const applicationRef = doc(firestore, 'applications', applicationId);
            const applicationDoc = await getDoc(applicationRef);

            if (!applicationDoc.exists()) {
                showToast('Avaldust ei leitud', 'error');
                return;
            }

            const currentApp = applicationDoc.data();
            if (!currentApp) {
                showToast('Avalduse andmed on vigased', 'error');
                return;
            }

            const existingVotes = Array.isArray(currentApp.votes) ? currentApp.votes : [];

            // Check if user already voted
            const userAlreadyVoted = existingVotes.some((v: any) =>
                v && v.voterId === playerStats.username
            );

            if (userAlreadyVoted) {
                showToast('Sa oled juba hääletanud', 'warning');
                return;
            }

            // Prevent self-voting
            if (currentApp.applicantUserId === currentUser?.uid) {
                showToast('Sa ei saa enda avaldusele hääletada', 'warning');
                return;
            }

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

            setTimeout(async () => {
                try {
                    await loadApplications();
                } catch (reloadError) {
                    console.error('Error reloading applications:', reloadError);
                }
            }, 300);

        } catch (error) {
            console.error('Error submitting vote:', error);
            showToast('Viga hääletamisel', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const getFilteredApplications = () => {
        try {
            return applications.filter(app => {
                if (!app || !app.id) return false;

                switch (selectedCategory) {
                    case 'group_leader':
                        return app.applicationType === 'group_leader';
                    case 'unit_leader':
                        return app.applicationType === 'unit_leader';
                    default:
                        return true;
                }
            });
        } catch (error) {
            console.error('Error filtering applications:', error);
            return [];
        }
    };

    const getCategoryCount = (category: string): number => {
        try {
            switch (category) {
                case 'group_leader':
                    return applications.filter(app => app?.applicationType === 'group_leader').length;
                case 'unit_leader':
                    return applications.filter(app => app?.applicationType === 'unit_leader').length;
                default:
                    return applications.length;
            }
        } catch (error) {
            console.error('Error counting applications:', error);
            return 0;
        }
    };

    const formatDate = (date: Date): string => {
        try {
            if (!date || isNaN(date.getTime())) {
                return 'Tundmatu kuupäev';
            }
            return date.toLocaleDateString('et-EE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('Error formatting date:', error);
            return 'Tundmatu kuupäev';
        }
    };

    const formatTimeRemaining = (expiresAt: Date): string => {
        try {
            if (!expiresAt || isNaN(expiresAt.getTime())) {
                return 'Tundmatu';
            }

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
        } catch (error) {
            console.warn('Error calculating time remaining:', error);
            return 'Tundmatu';
        }
    };

    if (error) {
        return (
            <div className="applications-tab">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">{error}</div>
                    <button onClick={loadApplications} className="retry-btn">
                        Proovi uuesti
                    </button>
                </div>
            </div>
        );
    }

    if (!isGroupLeader(playerStats)) {
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

    const filteredApplications = getFilteredApplications();

    return (
        <div className="applications-tab">
            <div className="tab-header">
                <h3>Avaldused minu üksusesse</h3>
                <div className="category-filters">
                    <button
                        className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        Kõik ({getCategoryCount('all')})
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'group_leader' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('group_leader')}
                    >
                        Grupijuhid ({getCategoryCount('group_leader')})
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'unit_leader' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('unit_leader')}
                    >
                        Talituse juhid ({getCategoryCount('unit_leader')})
                    </button>
                </div>
            </div>

            {filteredApplications.length === 0 ? (
                <div className="no-applications">
                    <div className="no-applications-icon">📄</div>
                    <div className="no-applications-text">
                        {selectedCategory === 'all' ?
                            'Praegu pole ootel olevaid avaldusi' :
                            'Selles kategoorias pole avaldusi'
                        }
                    </div>
                    <div className="no-applications-hint">
                        Avaldused ilmuvad siia, kui keegi kandideerib {selectedCategory === 'unit_leader' ? 'talituse juhi' : selectedCategory === 'group_leader' ? 'grupijuhi' : ''} positsioonile sinu üksuses.
                    </div>
                </div>
            ) : (
                <div className="applications-list">
                    {filteredApplications.map(application => {
                        if (!application || !application.id) {
                            return null;
                        }

                        const votes = Array.isArray(application.votes) ? application.votes : [];
                        const userVote = votes.find(vote => vote?.voterId === playerStats.username);
                        const approveVotes = votes.filter(vote => vote?.vote === 'approve').length;
                        const rejectVotes = votes.filter(vote => vote?.vote === 'reject').length;
                        const timeRemaining = formatTimeRemaining(application.expiresAt);
                        const isExpired = application.expiresAt && new Date() > application.expiresAt;
                        const isOwnApplication = application.applicantUserId === currentUser?.uid;

                        return (
                            <div key={application.id} className="application-card">
                                <div className="application-header">
                                    <div className="applicant-info">
                                        <h4 className="applicant-name">{application.applicantId || 'Tundmatu'}</h4>
                                        <div className="application-position">
                                            Kandideerib: {application.positionName}
                                            <span className={`position-type-badge ${application.applicationType}`}>
                                                {application.applicationType === 'unit_leader' ? 'Talituse juht' : 'Grupijuht'}
                                            </span>
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
                                                disabled={processing === application.id || !!userVote || isExpired || isOwnApplication}
                                            >
                                                {userVote?.vote === 'approve' ? 'Toetad' : 'Toetan'}
                                            </button>
                                            <button
                                                className={`btn-vote btn-vote-reject ${userVote?.vote === 'reject' ? 'voted' : ''}`}
                                                onClick={() => handleVote(application.id, 'reject')}
                                                disabled={processing === application.id || !!userVote || isExpired || isOwnApplication}
                                            >
                                                {userVote?.vote === 'reject' ? 'Ei toeta' : 'Ei toeta'}
                                            </button>
                                        </div>

                                        {userVote && (
                                            <div className="user-vote-status">
                                                Sinu hääl: {userVote.vote === 'approve' ? 'Toetad' : 'Ei toeta'}
                                            </div>
                                        )}
                                        {isOwnApplication && !userVote && (
                                            <div className="user-vote-status">
                                                Sa ei saa enda avaldusele hääletada
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
                                                <span className="detail-value">{application.applicantData?.level || 0}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Töötunnid:</span>
                                                <span className="detail-value">{application.applicantData?.totalWorkedHours || 0} tundi</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Maine:</span>
                                                <span className="detail-value">{application.applicantData?.reputation || 0}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Praegune positsioon:</span>
                                                <span className="detail-value">
                                                    {getPositionById(application.applicantData?.currentPosition)?.name || 'Tundmatu'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {votes.length > 0 && (
                                        <div className="details-section">
                                            <h5>Hääled ({votes.length})</h5>
                                            <div className="votes-list">
                                                {votes.map((vote, index) => (
                                                    <div key={index} className={`vote-item ${vote.vote}`}>
                                                        <span className="vote-user">{vote.voterName || 'Tundmatu'}</span>
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