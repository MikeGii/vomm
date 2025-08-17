import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { HealthDisplay } from '../components/patrol/HealthDisplay';
import { DepartmentSelector } from '../components/patrol/DepartmentSelector';
import { WorkActivitySelector } from '../components/patrol/WorkActivitySelector';
import { ActiveWorkProgress } from '../components/patrol/ActiveWorkProgress';
import { WorkHistory } from '../components/patrol/WorkHistory';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { WorkedHoursDisplay } from "../components/patrol/WorkedHoursDisplay";
import { EventModal } from '../components/events/EventModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PlayerStats, WorkActivity } from '../types';
import { WorkEvent, EventChoice } from '../types/events.types';
import {
    startWork,
    checkWorkCompletion,
    getRemainingWorkTime,
    getWorkHistory,
    completeWorkAfterEvent
} from '../services/WorkService';
import { getAvailableWorkActivities, getWorkActivityById } from '../data/workActivities';
import { updateTutorialProgress } from '../services/PlayerService';
import { getPendingEvent, processEventChoice } from '../services/EventService';
import '../styles/pages/Patrol.css';

const PatrolPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [availableActivities, setAvailableActivities] = useState<WorkActivity[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [selectedHours, setSelectedHours] = useState<number>(1);
    const [isStartingWork, setIsStartingWork] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [workHistory, setWorkHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [pendingEvent, setPendingEvent] = useState<WorkEvent | null>(null);
    const [isProcessingEvent, setIsProcessingEvent] = useState(false);
    const [activeWorkForEvent, setActiveWorkForEvent] = useState<any>(null);

    const completionAlertShownRef = useRef<boolean>(false);
    const isKadett = playerStats?.completedCourses?.includes('sisekaitseakadeemia_entrance') || false;

    // Load work history
    const loadWorkHistory = useCallback(async () => {
        if (currentUser) {
            const history = await getWorkHistory(currentUser.uid, 10);
            setWorkHistory(history);
        }
    }, [currentUser]);

    const getPageTitle = (): string => {
        if (!playerStats) return 'Patrullteenistus';

        if (playerStats.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            return 'Praktika ja tööamps';
        }
        return 'Patrullteenistus';
    };

    // Check for pending events
    const checkForPendingEvent = useCallback(async () => {
        if (!currentUser) return;

        const event = await getPendingEvent(currentUser.uid);
        if (event) {
            setPendingEvent(event.eventData);
            // Get fresh stats instead of using the stale closure
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                const currentStats = statsDoc.data() as PlayerStats;
                if (currentStats.activeWork) {
                    setActiveWorkForEvent(currentStats.activeWork);
                }
            }
        }
    }, [currentUser]);

    // Process stats update
    const processStatsUpdate = useCallback(async (stats: PlayerStats) => {
        // Get available work activities
        const activities = getAvailableWorkActivities(
            stats.level,
            stats.completedCourses || [],
            stats.rank
        );
        setAvailableActivities(activities);

        // Check for work completion
        if (stats.activeWork?.status === 'in_progress') {
            const remaining = getRemainingWorkTime(stats.activeWork);
            setRemainingTime(remaining);

            if (remaining <= 0 && !completionAlertShownRef.current) {
                completionAlertShownRef.current = true;

                // Check for work completion and events
                const result = await checkWorkCompletion(currentUser!.uid);

                if (result.hasPendingEvent) {
                    // Has event, show it
                    await checkForPendingEvent();
                } else if (result.completed) {
                    // Work completed without event - removed unused variable
                    const expGained = stats.activeWork!.expectedExp;

                    showToast(`Töö on edukalt lõpetatud! Teenitud kogemus: +${expGained} XP`, 'success', 4000);

                    setTimeout(() => {
                        loadWorkHistory().catch(console.error);

                        // Check tutorial progress
                        const wasTrainingWork = stats.activeWork?.isTutorial || false;
                        if (wasTrainingWork && stats.tutorialProgress.currentStep === 22) {
                            updateTutorialProgress(currentUser!.uid, 23).catch(console.error);
                            setShowTutorial(true);
                        }
                    }, 1500);

                    completionAlertShownRef.current = false;
                }
            }
        } else {
            setRemainingTime(0);
            completionAlertShownRef.current = false;
        }

        // Check tutorial
        if (!stats.tutorialProgress.isCompleted &&
            stats.tutorialProgress.currentStep >= 17 &&
            stats.tutorialProgress.currentStep <= 24) {
            setShowTutorial(true);
        }
    }, [currentUser, loadWorkHistory, checkForPendingEvent, showToast]);

    // Handle event choice
    const handleEventChoice = useCallback(async (choice: EventChoice) => {
        if (!currentUser || !pendingEvent || !activeWorkForEvent) return;

        setIsProcessingEvent(true);

        try {
            // Get work activity name
            const workActivity = getWorkActivityById(activeWorkForEvent.workId);
            const workName = workActivity?.name || 'Tundmatu töö';

            // Process the event choice
            const success = await processEventChoice(
                currentUser.uid,
                activeWorkForEvent.workSessionId || `${currentUser.uid}_${Date.now()}`,
                pendingEvent,
                choice,
                workName
            );

            if (success) {
                // Complete the work after event
                await completeWorkAfterEvent(currentUser.uid);

                // Show completion message
                setTimeout(() => {
                    showToast('Töö on edukalt lõpetatud!', 'success');
                    setPendingEvent(null);
                    setActiveWorkForEvent(null);
                    loadWorkHistory().catch(console.error);
                }, 500);
            }
        } catch (error) {
            console.error('Error processing event:', error);
            showToast('Viga sündmuse töötlemisel!', 'error');
        } finally {
            setIsProcessingEvent(false);
        }
    }, [currentUser, pendingEvent, activeWorkForEvent, showToast, loadWorkHistory]);

    // Check for pending events on mount
    useEffect(() => {
        if (currentUser && !loading) {
            checkForPendingEvent().catch(console.error);
        }
    }, [currentUser, loading, checkForPendingEvent]);

    // Listen to player stats
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);

        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;
                setPlayerStats(stats);
                processStatsUpdate(stats).catch(console.error);
                setLoading(false);
            }
        }, (error) => {
            console.error('Error listening to player stats:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, processStatsUpdate]);

    // Load work history on mount
    useEffect(() => {
        loadWorkHistory().catch(console.error);
    }, [loadWorkHistory]);

    // Timer for active work
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (playerStats?.activeWork?.status === 'in_progress') {
            const checkAndUpdate = async () => {
                const remaining = getRemainingWorkTime(playerStats.activeWork);
                setRemainingTime(remaining);

                if (remaining <= 0) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }

                    setTimeout(() => {
                        checkWorkCompletion(currentUser!.uid).catch(console.error);
                    }, 1100);
                }
            };

            checkAndUpdate().catch(console.error);
            intervalRef.current = setInterval(() => {
                checkAndUpdate().catch(console.error);
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [playerStats?.activeWork, currentUser]);

    // Handle start work
    const handleStartWork = useCallback(async () => {
        if (!currentUser || !playerStats || isStartingWork) return;

        if (!selectedDepartment || !selectedActivity || selectedHours < 1) {
            showToast('Palun vali osakond, tegevus ja tunnid!', 'warning');
            return;
        }

        setIsStartingWork(true);
        try {
            // Check if this is tutorial work
            const isTutorial = !playerStats.tutorialProgress.isCompleted &&
                playerStats.tutorialProgress.currentStep === 21;

            await startWork(
                currentUser.uid,
                selectedActivity,
                playerStats.prefecture || '',
                selectedDepartment,
                selectedHours,
                isTutorial
            );

            // Progress tutorial if needed
            if (isTutorial) {
                await updateTutorialProgress(currentUser.uid, 22);
            }
        } catch (error: any) {
            showToast(error.message || 'Tööle asumine ebaõnnestus', 'error');
        } finally {
            setIsStartingWork(false);
        }
    }, [currentUser, playerStats, isStartingWork, selectedDepartment, selectedActivity, selectedHours, showToast]);

    // Handle tutorial complete
    const handleTutorialComplete = useCallback(() => {
        setShowTutorial(false);
    }, []);

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

    const canWork = playerStats && playerStats.health && playerStats.health.current >= 50 &&
        !playerStats.activeCourse &&
        playerStats.hasCompletedTraining;

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

                {/* Health display */}
                <HealthDisplay health={playerStats.health} />

                {/* Worked hours display */}
                <WorkedHoursDisplay totalHours={playerStats.totalWorkedHours || 0} />

                {/* Active work progress */}
                {playerStats.activeWork && remainingTime > 0 && (
                    <ActiveWorkProgress
                        activeWork={playerStats.activeWork}
                        remainingTime={remainingTime}
                    />
                )}

                {/* Work setup section - only show when not working and can work */}
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
                            isTutorial={!playerStats.tutorialProgress.isCompleted &&
                                playerStats.tutorialProgress.currentStep === 21}
                            isKadett={isKadett}
                        />
                    </div>
                )}

                {/* Messages for when new work cannot be started */}
                {!playerStats.activeWork && !canWork && (
                    <div className="work-unavailable">
                        {!playerStats.hasCompletedTraining && (
                            <p>Pead esmalt läbima abipolitseiniku koolituse!</p>
                        )}
                        {playerStats.health && playerStats.health.current < 50 && (
                            <p>Su tervis on liiga madal töötamiseks! Minimaalne tervis on 50.</p>
                        )}
                        {playerStats.activeCourse && (
                            <p>Sa ei saa alustada uut tööd koolituse ajal!</p>
                        )}
                    </div>
                )}

                {/* Show message if already working but allow viewing the page */}
                {playerStats.activeWork && !remainingTime && (
                    <div className="work-unavailable">
                        <p>Töö on lõppenud, andmeid uuendatakse...</p>
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

                {/* Tutorial overlay */}
                {showTutorial && currentUser && (
                    <TutorialOverlay
                        stats={playerStats}
                        userId={currentUser.uid}
                        onTutorialComplete={handleTutorialComplete}
                        page="patrol"
                    />
                )}
            </main>
        </div>
    );
};

export default PatrolPage;