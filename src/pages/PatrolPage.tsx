// src/pages/PatrolPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { HealthDisplay } from '../components/patrol/HealthDisplay';
import { DepartmentSelector } from '../components/patrol/DepartmentSelector';
import { WorkActivitySelector } from '../components/patrol/WorkActivitySelector';
import { ActiveWorkProgress } from '../components/patrol/ActiveWorkProgress';
import { WorkHistory } from '../components/patrol/WorkHistory';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats, WorkActivity } from '../types';
import {
    startWork,
    checkWorkCompletion,
    getRemainingWorkTime,
    getWorkHistory
} from '../services/WorkService';
import { getAvailableWorkActivities } from '../data/workActivities';
import { updateTutorialProgress } from '../services/PlayerService';
import { WorkedHoursDisplay} from "../components/patrol/WorkedHoursDisplay";
import '../styles/pages/Patrol.css';

const PatrolPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
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

                // Store activeWork before it gets cleared by checkWorkCompletion
                const wasTrainingWork = stats.activeWork?.isTutorial || false;

                const completed = await checkWorkCompletion(currentUser!.uid);
                if (completed) {
                    alert('Töö on edukalt lõpetatud!');

                    setTimeout(async () => {
                        await loadWorkHistory();

                        // Check if this was tutorial work and progress to step 23
                        if (wasTrainingWork &&
                            stats.tutorialProgress.currentStep === 22) {
                            // Progress to step 23 to show work history
                            await updateTutorialProgress(currentUser!.uid, 23);
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
    }, [currentUser, loadWorkHistory]);

    // Listen to player stats
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);

        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;
                setPlayerStats(stats);
                processStatsUpdate(stats);
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
        loadWorkHistory();
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

                    setTimeout(async () => {
                        await checkWorkCompletion(currentUser!.uid);
                    }, 1100);
                }
            };

            checkAndUpdate();
            intervalRef.current = setInterval(checkAndUpdate, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [playerStats?.activeWork, currentUser]);

    // Handle start work
    const handleStartWork = async () => {
        if (!currentUser || !playerStats || isStartingWork) return;

        if (!selectedDepartment || !selectedActivity || selectedHours < 1) {
            alert('Palun vali osakond, tegevus ja tunnid!');
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
            alert(error.message || 'Tööle asumine ebaõnnestus');
        } finally {
            setIsStartingWork(false);
        }
    };

    // Handle tutorial complete
    const handleTutorialComplete = useCallback(() => {
        setShowTutorial(false);
    }, []);

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