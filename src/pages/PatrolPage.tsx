// src/pages/PatrolPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { HealthDisplay } from '../components/patrol/HealthDisplay';
import { DepartmentSelector } from '../components/patrol/DepartmentSelector';
import { WorkActivitySelector } from '../components/patrol/WorkActivitySelector';
import { ActiveWorkProgress } from '../components/patrol/ActiveWorkProgress';
import { WorkHistory } from '../components/patrol/WorkHistory';
import { WorkedHoursDisplay } from "../components/patrol/WorkedHoursDisplay";
import { EventModal } from '../components/events/EventModal';
import { WorkBoosterPanel } from '../components/patrol/WorkBoosterPanel';
import { checkAndApplyHealthRecovery } from '../services/HealthService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { WorkEvent, EventChoice } from '../types';
import {
    startWork,
    checkAndCompleteWork,
    getRemainingWorkTime,
    getWorkHistory,
    cancelWork
} from '../services/WorkService';
import {getDefaultWorkActivityForPosition} from '../data/workActivities';
import { getActiveEvent, processEventChoice } from '../services/EventService';
import '../styles/pages/Patrol.css';
import {isAbipolitseinik, isKadett, isPoliceOfficer} from "../utils/playerStatus";

const PatrolPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { playerStats, loading, refreshStats } = usePlayerStats();

    // Refs for interval and event management
    const workCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastWorkCheckRef = useRef<number>(0);
    const isCheckingEventRef = useRef(false);
    const isProcessingWorkEndRef = useRef(false);

    // State
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedHours, setSelectedHours] = useState<number>(1);
    const [isStartingWork, setIsStartingWork] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [workHistory, setWorkHistory] = useState<any[]>([]);
    const [workHistoryTotalCount, setWorkHistoryTotalCount] = useState<number>(0);
    const [workHistoryCurrentPage, setWorkHistoryCurrentPage] = useState<number>(1);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
    const [pendingEvent, setPendingEvent] = useState<WorkEvent | null>(null);
    const [eventDocumentId, setEventDocumentId] = useState<string | null>(null);
    const [isProcessingEvent, setIsProcessingEvent] = useState(false);
    const [healthCheckDone, setHealthCheckDone] = useState(false);

    const [isCancellingWork, setIsCancellingWork] = useState(false);

    // Player status checks - Memoized
    const playerStatus = React.useMemo(() => {
        if (!playerStats) return { isAbipolitseinik: false, isKadett: false, isPolitseiametnik: false };

        return {
            isAbipolitseinik: isAbipolitseinik(playerStats),
            isKadett: isKadett(playerStats),
            isPolitseiametnik: isPoliceOfficer(playerStats)
        };
    }, [playerStats]);

    // Load work history
    const loadWorkHistory = useCallback(async (page: number = 1) => {
        if (!currentUser) return;

        try {
            setIsLoadingHistory(true);
            const result = await getWorkHistory(currentUser.uid, page, 10);
            setWorkHistory(result.entries);
            setWorkHistoryTotalCount(result.totalCount);
            setWorkHistoryCurrentPage(page);
        } catch (error) {
            console.error('Error loading work history:', error);
            showToast('Viga tööajaloo laadimisel', 'error');
        } finally {
            setIsLoadingHistory(false);
        }
    }, [currentUser, showToast]);

    const handleWorkHistoryPageChange = useCallback((page: number) => {
        loadWorkHistory(page);
    }, [loadWorkHistory]);

    // Check for active events - with protection against multiple calls
    const checkForEvents = useCallback(async () => {
        if (!currentUser || isCheckingEventRef.current) return;

        try {
            isCheckingEventRef.current = true;
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
        } finally {
            // Add a small delay before allowing next check
            setTimeout(() => {
                isCheckingEventRef.current = false;
            }, 1000);
        }
    }, [currentUser]);

    // Update available activities when stats change
    useEffect(() => {
        if (!playerStats) return;

        // Update remaining time if working
        if (playerStats.activeWork) {
            const remaining = getRemainingWorkTime(playerStats.activeWork);
            setRemainingTime(remaining);
        } else {
            setRemainingTime(0);
        }
    }, [playerStats]);

    // One-time health recovery check on mount
    useEffect(() => {
        if (!currentUser || healthCheckDone) return;

        checkAndApplyHealthRecovery(currentUser.uid).then(result => {
            if (result.recovered && result.amountRecovered > 0) {
                showToast(`Tervis taastus +${result.amountRecovered} HP`, 'success');
                refreshStats();
            }
            setHealthCheckDone(true);
        });
    }, [currentUser, healthCheckDone, showToast, refreshStats]);

    // Handle event choice
    const handleEventChoice = useCallback(async (choice: EventChoice) => {
        if (!currentUser || !eventDocumentId || isProcessingEvent) return;

        setIsProcessingEvent(true);
        try {
            const success = await processEventChoice(currentUser.uid, eventDocumentId, choice);

            if (success) {
                showToast('Töö on edukalt lõpetatud!', 'success');
                setPendingEvent(null);
                setEventDocumentId(null);
                await Promise.all([refreshStats(), loadWorkHistory()]);
            } else {
                showToast('Viga sündmuse töötlemisel!', 'error');
            }
        } catch (error) {
            console.error('Error processing event:', error);
            showToast('Viga sündmuse töötlemisel!', 'error');
        } finally {
            setIsProcessingEvent(false);
            isProcessingWorkEndRef.current = false;
        }
    }, [currentUser, eventDocumentId, isProcessingEvent, showToast, refreshStats, loadWorkHistory]);

    // Handle start work
    const handleStartWork = useCallback(async () => {
        if (!currentUser || !playerStats || isStartingWork) return;

        const departmentToUse = playerStatus.isPolitseiametnik
            ? playerStats.department
            : selectedDepartment;

        const workActivity = getDefaultWorkActivityForPosition(playerStats.policePosition ?? null);

        if (!departmentToUse || !workActivity || selectedHours < 1) {
            if (playerStatus.isPolitseiametnik && !playerStats.department) {
                showToast('Su osakond pole määratud! Võta ühendust administraatoriga.', 'error');
            } else {
                showToast('Palun vali osakond ja tunnid!', 'warning');
            }
            return;
        }

        setIsStartingWork(true);
        try {
            // Check health recovery first
            const recoveryResult = await checkAndApplyHealthRecovery(currentUser.uid);
            if (recoveryResult.recovered && recoveryResult.amountRecovered > 0) {
                showToast(`Tervis taastus +${recoveryResult.amountRecovered} HP`, 'success');
                await refreshStats();

                // Re-check health after refresh
                if (!playerStats.health || playerStats.health.current < 50) {
                    showToast('Su tervis on ikka liiga madal töötamiseks!', 'error');
                    setIsStartingWork(false);
                    return;
                }
            }

            await startWork(
                currentUser.uid,
                workActivity.id,
                playerStats.prefecture || '',
                departmentToUse,
                selectedHours
            );

            showToast('Töö alustatud!', 'success');
            await refreshStats();
        } catch (error: any) {
            showToast(error.message || 'Tööle asumine ebaõnnestus', 'error');
        } finally {
            setIsStartingWork(false);
        }
    }, [currentUser, playerStats, isStartingWork, selectedDepartment, selectedHours, showToast, refreshStats, playerStatus.isPolitseiametnik]);


    // Optimized work completion checking with better event handling
    useEffect(() => {
        if (!currentUser || !playerStats?.activeWork) {
            if (workCheckIntervalRef.current) {
                clearInterval(workCheckIntervalRef.current);
                workCheckIntervalRef.current = null;
            }
            isProcessingWorkEndRef.current = false;
            return;
        }

        const checkWork = async () => {
            // Prevent duplicate checks
            const now = Date.now();
            if (now - lastWorkCheckRef.current < 500) return;
            if (isProcessingWorkEndRef.current) return;

            lastWorkCheckRef.current = now;

            const result = await checkAndCompleteWork(currentUser.uid);

            if (result.hasEvent || result.completed) {
                // Mark as processing to prevent multiple checks
                isProcessingWorkEndRef.current = true;

                if (result.hasEvent) {
                    // Wait a bit for the event to be properly saved
                    setTimeout(() => {
                        checkForEvents();
                    }, 500);
                } else if (result.completed) {
                    const exp = playerStats.activeWork?.expectedExp || 0;
                    showToast(`Töö on edukalt lõpetatud! Teenitud kogemus: +${exp} XP`, 'success', 4000);
                    await Promise.all([refreshStats(), loadWorkHistory()]);
                    isProcessingWorkEndRef.current = false;
                }
            }
        };

        // Initial check if time is up
        if (remainingTime <= 0 && !isProcessingWorkEndRef.current) {
            checkWork();
        }

        // Set up interval
        workCheckIntervalRef.current = setInterval(() => {
            if (playerStats.activeWork) {
                const remaining = getRemainingWorkTime(playerStats.activeWork);
                setRemainingTime(remaining);

                if (remaining <= 0 && !isProcessingWorkEndRef.current) {
                    checkWork();
                }
            }
        }, 1000);

        return () => {
            if (workCheckIntervalRef.current) {
                clearInterval(workCheckIntervalRef.current);
                workCheckIntervalRef.current = null;
            }
        };
    }, [currentUser, playerStats?.activeWork, remainingTime, checkForEvents,
        showToast, refreshStats, loadWorkHistory]);

    // Check for pending events only once on mount
    useEffect(() => {
        if (currentUser && !loading && !pendingEvent) {
            checkForEvents();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, loading]); // Intentionally omitting checkForEvents and pendingEvent

    // Load work history on mount
    useEffect(() => {
        loadWorkHistory();
    }, [loadWorkHistory]);

    // Handle booster applied
    const handleBoosterApplied = useCallback(async () => {
        await refreshStats();
        showToast('Kiirendaja rakendatud!', 'success');

        // Force immediate work check
        if (playerStats?.activeWork) {
            const remaining = getRemainingWorkTime(playerStats.activeWork);
            setRemainingTime(remaining);

            if (remaining <= 0 && !isProcessingWorkEndRef.current) {
                isProcessingWorkEndRef.current = true;
                const result = await checkAndCompleteWork(currentUser!.uid);

                if (result.hasEvent) {
                    setTimeout(() => {
                        checkForEvents();
                    }, 500);
                } else if (result.completed) {
                    const exp = playerStats.activeWork?.expectedExp || 0;
                    showToast(`Töö on edukalt lõpetatud! Teenitud kogemus: +${exp} XP`, 'success', 4000);
                    await Promise.all([refreshStats(), loadWorkHistory()]);
                    isProcessingWorkEndRef.current = false;
                }
            }
        }
    }, [currentUser, playerStats, showToast, refreshStats, loadWorkHistory, checkForEvents]);

    // Get page title
    const getPageTitle = (): string => {
        if (!playerStats) return 'Teenistus';
        return playerStatus.isKadett ? 'Praktika ja tööamps' : 'Teenistus';
    };

    const handleCancelWork = useCallback(async () => {
        if (!currentUser || !playerStats?.activeWork || isCancellingWork) {
            return;
        }

        setIsCancellingWork(true);

        try {
            const result = await cancelWork(currentUser.uid);

            if (result.success && result.rewards) {
                const expGained = result.rewards.experience;
                const moneyGained = result.rewards.money;

                let message = `Töö katkestatud! Saite: +${expGained} XP`;
                if (moneyGained > 0) {
                    message += `, +${moneyGained}€`;
                }

                showToast(message, 'info', 4000);
                await refreshStats();
            } else {
                showToast(result.message || 'Töö katkestamine ebaõnnestus', 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'Töö katkestamine ebaõnnestus', 'error');
        } finally {
            setIsCancellingWork(false);
        }
    }, [currentUser, playerStats?.activeWork, isCancellingWork, showToast, refreshStats]);

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

    // Can work checks
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

                {playerStats.health && <HealthDisplay health={playerStats.health} />}
                <WorkedHoursDisplay totalHours={playerStats.totalWorkedHours || 0} />

                {playerStats.activeWork && remainingTime > 0 && (
                    <div className="active-work-section">
                        <ActiveWorkProgress
                            activeWork={playerStats.activeWork}
                            remainingTime={remainingTime}
                            onCancelWork={handleCancelWork}
                            isCancelling={isCancellingWork}
                        />

                        <WorkBoosterPanel
                            inventory={playerStats.inventory || []}
                            currentUserId={currentUser!.uid}
                            activeWorkEndTime={
                                playerStats.activeWork.endsAt instanceof Timestamp
                                    ? playerStats.activeWork.endsAt.toDate()
                                    : new Date(playerStats.activeWork.endsAt)
                            }
                            onBoosterApplied={handleBoosterApplied}
                            boosterAlreadyUsed={playerStats.activeWork.boosterUsed || false}
                        />
                    </div>
                )}

                {!playerStats.activeWork && canWork && (
                    <div className="work-setup">
                        {(playerStatus.isAbipolitseinik || playerStatus.isKadett) && (
                            <DepartmentSelector
                                prefecture={playerStats.prefecture || ''}
                                isAbipolitseinik={playerStatus.isAbipolitseinik}
                                currentDepartment={playerStats.department}
                                selectedDepartment={selectedDepartment}
                                onDepartmentSelect={setSelectedDepartment}
                                isKadett={playerStatus.isKadett}
                            />
                        )}

                        {playerStatus.isPolitseiametnik && (
                            <div className="department-selector">
                                <h3>Tööpiirkond</h3>
                                <div className="department-locked">
                                    <p>Sinu tööpiirkond: <strong>{playerStats.department || 'Määramata'}</strong></p>
                                    <p className="info-text">Politseiametnikuna oled määratud konkreetsesse osakonda.</p>
                                </div>
                            </div>
                        )}

                        <WorkActivitySelector
                            selectedHours={selectedHours}
                            onHoursSelect={setSelectedHours}
                            onStartWork={handleStartWork}
                            isStarting={isStartingWork}
                            isKadett={playerStatus.isKadett}
                            playerRank={playerStats.rank}
                            playerStats={playerStats}
                            policePosition={playerStats.policePosition}
                        />
                    </div>
                )}

                {!playerStats.activeWork && !canWork && (
                    <div className="work-unavailable">
                        {!hasBasicTraining && <p>Pead esmalt läbima abipolitseiniku koolituse!</p>}
                        {(!playerStats.health || playerStats.health.current < 50) &&
                            <p>Su tervis on liiga madal töötamiseks! Minimaalne tervis on 50.</p>}
                        {playerStats.activeCourse?.status === 'in_progress' &&
                            <p>Sa ei saa alustada uut tööd koolituse ajal!</p>}
                    </div>
                )}

                <WorkHistory
                    history={workHistory}
                    isLoading={isLoadingHistory}
                    currentPage={workHistoryCurrentPage}
                    totalCount={workHistoryTotalCount}
                    onPageChange={handleWorkHistoryPageChange}
                />

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