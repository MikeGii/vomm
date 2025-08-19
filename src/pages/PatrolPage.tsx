// Update src/pages/PatrolPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { HealthDisplay } from '../components/patrol/HealthDisplay';
import { DepartmentSelector } from '../components/patrol/DepartmentSelector';
import { WorkActivitySelector } from '../components/patrol/WorkActivitySelector';
import { ActiveWorkProgress } from '../components/patrol/ActiveWorkProgress';
import { WorkHistory } from '../components/patrol/WorkHistory';
import { WorkedHoursDisplay } from "../components/patrol/WorkedHoursDisplay";
import { EventModal } from '../components/events/EventModal';
import { checkAndApplyHealthRecovery } from '../services/HealthService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PlayerStats, WorkActivity } from '../types';
import { WorkEvent, EventChoice } from '../types';
import {
    startWork,
    checkAndCompleteWork,
    getRemainingWorkTime,
    getWorkHistory
} from '../services/WorkService';
import { getAvailableWorkActivities } from '../data/workActivities';
import { getActiveEvent, processEventChoice } from '../services/EventService';
import '../styles/pages/Patrol.css';

const PatrolPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // State
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [availableActivities, setAvailableActivities] = useState<WorkActivity[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [selectedHours, setSelectedHours] = useState<number>(1);
    const [isStartingWork, setIsStartingWork] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [workHistory, setWorkHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingEvent, setPendingEvent] = useState<WorkEvent | null>(null);
    const [eventDocumentId, setEventDocumentId] = useState<string | null>(null);
    const [isProcessingEvent, setIsProcessingEvent] = useState(false);

    const isKadett = playerStats?.completedCourses?.includes('sisekaitseakadeemia_entrance') || false;

    // Load work history
    const loadWorkHistory = useCallback(async () => {
        if (!currentUser) return;

        try {
            const history = await getWorkHistory(currentUser.uid, 10);
            setWorkHistory(history);
        } catch (error) {
            console.error('Error loading work history:', error);
        }
    }, [currentUser]);

    // Load player stats
    const loadPlayerStats = useCallback(async () => {
        if (!currentUser) return;

        try {
            const statsDoc = await getDoc(doc(firestore, 'playerStats', currentUser.uid));
            if (statsDoc.exists()) {
                setPlayerStats(statsDoc.data() as PlayerStats);
            }
        } catch (error) {
            console.error('Error loading player stats:', error);
        }
    }, [currentUser]);

    // Check for active events
    const checkForEvents = useCallback(async () => {
        if (!currentUser) return;

        try {
            const eventData = await getActiveEvent(currentUser.uid);

            if (eventData) {
                setPendingEvent(eventData.event);
                setEventDocumentId(eventData.documentId);
            } else {
                setPendingEvent(null);
                setEventDocumentId(null);
            }
        } catch (error) {
            console.error('Error checking for events:', error);
        }
    }, [currentUser]);

    // Process stats update
    const processStatsUpdate = useCallback((stats: PlayerStats) => {
        // Update available activities
        const activities = getAvailableWorkActivities(
            stats.level,
            stats.completedCourses || [],
            stats.rank
        );
        setAvailableActivities(activities);

        // Update remaining time if working
        if (stats.activeWork) {
            const remaining = getRemainingWorkTime(stats.activeWork);
            setRemainingTime(remaining);
        } else {
            setRemainingTime(0);
        }
    }, []);

    // Handle event choice
    const handleEventChoice = useCallback(async (choice: EventChoice) => {
        if (!currentUser || !eventDocumentId) return;

        setIsProcessingEvent(true);

        try {
            const success = await processEventChoice(
                currentUser.uid,
                eventDocumentId,
                choice
            );

            if (success) {
                showToast('Töö on edukalt lõpetatud!', 'success');
                setPendingEvent(null);
                setEventDocumentId(null);

                // Reload data
                await Promise.all([
                    loadPlayerStats(),
                    loadWorkHistory()
                ]);
            } else {
                showToast('Viga sündmuse töötlemisel!', 'error');
            }
        } catch (error) {
            console.error('Error processing event:', error);
            showToast('Viga sündmuse töötlemisel!', 'error');
        } finally {
            setIsProcessingEvent(false);
        }
    }, [currentUser, eventDocumentId, showToast, loadPlayerStats, loadWorkHistory]);

    // Handle start work
    const handleStartWork = useCallback(async () => {
        if (!currentUser || !playerStats || isStartingWork) return;

        if (!selectedDepartment || !selectedActivity || selectedHours < 1) {
            showToast('Palun vali osakond, tegevus ja tunnid!', 'warning');
            return;
        }

        setIsStartingWork(true);

        try {
            // Check health recovery first
            const recoveryResult = await checkAndApplyHealthRecovery(currentUser.uid);
            if (recoveryResult.recovered && recoveryResult.amountRecovered > 0) {
                showToast(`Tervis taastus +${recoveryResult.amountRecovered} HP`, 'success');

                // Reload stats after recovery
                await loadPlayerStats();

                // Check if health is still too low (safe check with optional chaining)
                if (!playerStats.health || playerStats.health.current < 50) {
                    showToast('Su tervis on ikka liiga madal töötamiseks!', 'error');
                    setIsStartingWork(false);
                    return;
                }
            }

            // Start work
            await startWork(
                currentUser.uid,
                selectedActivity,
                playerStats.prefecture || '',
                selectedDepartment,
                selectedHours
            );

            showToast('Töö alustatud!', 'success');
        } catch (error: any) {
            showToast(error.message || 'Tööle asumine ebaõnnestus', 'error');
        } finally {
            setIsStartingWork(false);
        }
    }, [currentUser, playerStats, isStartingWork, selectedDepartment, selectedActivity,
        selectedHours, showToast, loadPlayerStats]);

    // Listen to player stats
    useEffect(() => {
        if (!currentUser) return;

        // Check health recovery on mount
        checkAndApplyHealthRecovery(currentUser.uid).then(result => {
            if (result.recovered && result.amountRecovered > 0) {
                showToast(`Tervis taastus +${result.amountRecovered} HP`, 'success');
            }
        });

        // Subscribe to stats changes
        const unsubscribe = onSnapshot(
            doc(firestore, 'playerStats', currentUser.uid),
            (doc) => {
                if (doc.exists()) {
                    const stats = doc.data() as PlayerStats;
                    setPlayerStats(stats);
                    processStatsUpdate(stats);
                    setLoading(false);
                }
            },
            (error) => {
                console.error('Error listening to player stats:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser, processStatsUpdate, showToast]);

    // Check for work completion and events
    useEffect(() => {
        if (!currentUser || !playerStats?.activeWork) return;

        const checkWork = async () => {
            const result = await checkAndCompleteWork(currentUser.uid);

            if (result.hasEvent) {
                // Event triggered, check for it
                await checkForEvents();
            } else if (result.completed) {
                // Work completed without event - safe access to activeWork
                const activeWork = playerStats.activeWork;
                if (activeWork) {
                    showToast(`Töö on edukalt lõpetatud! Teenitud kogemus: +${activeWork.expectedExp} XP`,
                        'success', 4000);
                }

                // Reload data
                await Promise.all([
                    loadPlayerStats(),
                    loadWorkHistory()
                ]);
            }
        };

        // Check immediately if time is up
        if (remainingTime <= 0) {
            checkWork();
        }

        // Set up interval to check every second
        const interval = setInterval(() => {
            const activeWork = playerStats.activeWork;
            if (activeWork) {
                const remaining = getRemainingWorkTime(activeWork);
                setRemainingTime(remaining);

                if (remaining <= 0) {
                    checkWork();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentUser, playerStats?.activeWork, remainingTime, checkForEvents, showToast,
        loadPlayerStats, loadWorkHistory]);

    // Check for pending events on mount and when stats change
    useEffect(() => {
        if (currentUser && !loading) {
            checkForEvents();
        }
    }, [currentUser, loading, checkForEvents]);

    // Load work history on mount
    useEffect(() => {
        loadWorkHistory();
    }, [loadWorkHistory]);

    // Page title helper
    const getPageTitle = (): string => {
        if (!playerStats) return 'Patrullteenistus';

        if (playerStats.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            return 'Praktika ja tööamp';
        }
        return 'Patrullteenistus';
    };

    // Loading state
    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="patrol-container">
                    <div className="loading">Laadin...</div>
                </main>
            </div>
        );
    }

    // Error state
    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="patrol-container">
                    <div className="error">Viga andmete laadimisel</div>
                </main>
            </div>
        );
    }

    // Check if player can work - Updated logic without hasCompletedTraining
    const hasBasicTraining = playerStats.completedCourses?.includes('basic_police_training_abipolitseinik') || false;
    const healthOk = playerStats.health && playerStats.health.current >= 50;
    const notInCourse = !playerStats.activeCourse || playerStats.activeCourse.status !== 'in_progress';

    const canWork = hasBasicTraining && healthOk && notInCourse;

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="patrol-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="patrol-title">{getPageTitle()}</h1>

                {/* Health display - safe access */}
                {playerStats.health && (
                    <HealthDisplay health={playerStats.health} />
                )}

                {/* Worked hours display */}
                <WorkedHoursDisplay totalHours={playerStats.totalWorkedHours || 0} />

                {/* Active work progress */}
                {playerStats.activeWork && remainingTime > 0 && (
                    <ActiveWorkProgress
                        activeWork={playerStats.activeWork}
                        remainingTime={remainingTime}
                    />
                )}

                {/* Work setup section */}
                {!playerStats.activeWork && canWork && (
                    <div className="work-setup">
                        <DepartmentSelector
                            prefecture={playerStats.prefecture || ''}
                            isAbipolitseinik={!playerStats.rank}
                            currentDepartment={playerStats.department}
                            selectedDepartment={selectedDepartment}
                            onDepartmentSelect={setSelectedDepartment}
                            isKadett={isKadett}
                        />

                        <WorkActivitySelector
                            activities={availableActivities}
                            selectedActivity={selectedActivity}
                            selectedHours={selectedHours}
                            onActivitySelect={setSelectedActivity}
                            onHoursSelect={setSelectedHours}
                            onStartWork={handleStartWork}
                            isStarting={isStartingWork}
                            isKadett={isKadett}
                        />
                    </div>
                )}

                {/* Work unavailable messages */}
                {!playerStats.activeWork && !canWork && (
                    <div className="work-unavailable">
                        {!hasBasicTraining && (
                            <p>Pead esmalt läbima abipolitseiniku koolituse!</p>
                        )}
                        {(!playerStats.health || playerStats.health.current < 50) && (
                            <p>Su tervis on liiga madal töötamiseks! Minimaalne tervis on 50.</p>
                        )}
                        {playerStats.activeCourse && playerStats.activeCourse.status === 'in_progress' && (
                            <p>Sa ei saa alustada uut tööd koolituse ajal!</p>
                        )}
                    </div>
                )}

                {/* Work history */}
                <WorkHistory history={workHistory} />

                {/* Event Modal */}
                {pendingEvent && (
                    <EventModal
                        event={pendingEvent}
                        onChoiceSelect={handleEventChoice}
                        isProcessing={isProcessingEvent}
                    />
                )}
            </main>
        </div>
    );
};

export default PatrolPage;