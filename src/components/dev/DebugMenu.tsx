// src/components/dev/DebugMenu.tsx
import React, { useState, useEffect } from 'react';
import {doc, updateDoc, getDoc, setDoc} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { initializeAttributes, initializeTrainingData } from '../../services/TrainingService';
import { PlayerStats } from '../../types';
import { checkCourseCompletion } from '../../services/CourseService';
import { checkWorkCompletion } from '../../services/WorkService';
import { Timestamp } from 'firebase/firestore';
import { createActiveEvent, getPendingEvent } from '../../services/EventService';
import { ALL_EVENTS } from '../../data/events';
import '../../styles/components/dev/DebugMenu.css';

export const DebugMenu: React.FC = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

    // Load player stats to check active course/work
    useEffect(() => {
        if (!currentUser) return;

        const loadStats = async () => {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                setPlayerStats(statsDoc.data() as PlayerStats);
            }
        };

        loadStats();
        // Reload stats when menu is opened
        if (isOpen) {
            loadStats();
        }
    }, [currentUser, isOpen]);

    // Only show for developer account - moved after hooks
    if (currentUser?.email !== 'cjmike12@gmail.com') {
        return null;
    }

    const completeCurrentWork = async () => {
        if (!currentUser || !playerStats?.activeWork) {
            alert('Aktiivne töö puudub!');
            return;
        }

        if (!window.confirm('Lõpeta praegune töö kohe?')) return;

        setIsProcessing(true);
        try {
            // Set work end time to now
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'activeWork.endsAt': Timestamp.now()
            });

            // Wait a moment then trigger completion
            setTimeout(async () => {
                await checkWorkCompletion(currentUser.uid);
                alert('Töö lõpetatud!');

                // Reload stats
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    setPlayerStats(statsDoc.data() as PlayerStats);
                }
            }, 100);
        } catch (error) {
            console.error('Error completing work:', error);
            alert('Failed to complete work');
        } finally {
            setIsProcessing(false);
        }
    };

    const completeCurrentCourse = async () => {
        if (!currentUser || !playerStats?.activeCourse) {
            alert('Aktiivne koolitus puudub!');
            return;
        }

        if (!window.confirm('Lõpeta praegune koolitus kohe?')) return;

        setIsProcessing(true);
        try {
            // Set course end time to now
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'activeCourse.endsAt': Timestamp.now()
            });

            // Wait a moment then trigger completion
            setTimeout(async () => {
                await checkCourseCompletion(currentUser.uid);
                alert('Koolitus lõpetatud!');

                // Reload stats
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    setPlayerStats(statsDoc.data() as PlayerStats);
                }
            }, 100);
        } catch (error) {
            console.error('Error completing course:', error);
            alert('Failed to complete course');
        } finally {
            setIsProcessing(false);
        }
    };

    const refillTrainingClicks = async () => {
        if (!currentUser) return;

        if (!window.confirm('Taasta kõik treeningkorrad (50)?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const maxClicks = playerStats?.activeWork ? 10 : 50;

            await updateDoc(statsRef, {
                'trainingData.remainingClicks': maxClicks,
                'trainingData.lastResetTime': Timestamp.now()
            });

            alert(`Treeningkorrad taastatud: ${maxClicks}`);

            // Reload stats
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                setPlayerStats(statsDoc.data() as PlayerStats);
            }
        } catch (error) {
            console.error('Error refilling training clicks:', error);
            alert('Failed to refill training clicks');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTutorialAndCourses = async () => {
        if (!currentUser || !window.confirm('Reset tutorial and all courses?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'tutorialProgress.isCompleted': false,
                'tutorialProgress.currentStep': 0,
                'tutorialProgress.startedAt': null,
                'tutorialProgress.completedAt': null,
                completedCourses: [],
                activeCourse: null,
                hasCompletedTraining: false,
                isEmployed: false,
                badgeNumber: null
            });
            alert('Tutorial and courses reset!');
        } catch (error) {
            console.error('Error resetting tutorial:', error);
            alert('Failed to reset tutorial');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetAttributes = async () => {
        if (!currentUser || !window.confirm('Reset all attributes to level 0?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                attributes: initializeAttributes(),
                trainingData: initializeTrainingData()
            });
            alert('Attributes reset!');
        } catch (error) {
            console.error('Error resetting attributes:', error);
            alert('Failed to reset attributes');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetPlayerStats = async () => {
        if (!currentUser || !window.confirm('Reset level, reputation, prefecture, and department?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                level: 1,
                experience: 0,
                reputation: 0,
                rank: null,
                department: null,
                prefecture: null,
                casesCompleted: 0,
                criminalsArrested: 0
            });
            alert('Player stats reset!');
        } catch (error) {
            console.error('Error resetting stats:', error);
            alert('Failed to reset stats');
        } finally {
            setIsProcessing(false);
        }
    };

    const fullReset = async () => {
        if (!currentUser || !window.confirm('⚠️ FULL RESET - This will reset EVERYTHING. Are you sure?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                level: 1,
                experience: 0,
                reputation: 0,
                rank: null,
                department: null,
                prefecture: null,
                badgeNumber: null,
                isEmployed: false,
                hasCompletedTraining: false,
                casesCompleted: 0,
                criminalsArrested: 0,
                'tutorialProgress.isCompleted': false,
                'tutorialProgress.currentStep': 0,
                'tutorialProgress.startedAt': null,
                'tutorialProgress.completedAt': null,
                completedCourses: [],
                activeCourse: null,
                activeWork: null,
                attributes: initializeAttributes(),
                trainingData: initializeTrainingData()
            });
            alert('Full reset complete!');
            window.location.reload();
        } catch (error) {
            console.error('Error doing full reset:', error);
            alert('Failed to do full reset');
        } finally {
            setIsProcessing(false);
        }
    };

    const skipToStep = async (step: number) => {
        if (!currentUser) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'tutorialProgress.currentStep': step
            });
            alert(`Jumped to tutorial step ${step}`);
            window.location.reload();
        } catch (error) {
            console.error('Error jumping to step:', error);
            alert('Failed to jump to step');
        } finally {
            setIsProcessing(false);
        }
    };

    const triggerRandomEvent = async () => {
        if (!currentUser || !playerStats?.activeWork) {
            alert('Aktiivne töö puudub! Alusta tööd esmalt.');
            return;
        }

        if (!window.confirm('Trigger random event for current work?')) return;

        setIsProcessing(true);
        try {
            // Create an event for current work
            const workSessionId = playerStats.activeWork.workSessionId || `${currentUser.uid}_${Date.now()}`;
            const event = await createActiveEvent(
                currentUser.uid,
                workSessionId,
                playerStats.activeWork.workId,
                playerStats.level
            );

            if (event) {
                alert('Event triggered! Refresh the page to see it.');
                window.location.reload();
            } else {
                alert('No event was triggered (30% chance of no event)');
            }
        } catch (error) {
            console.error('Error triggering event:', error);
            alert('Failed to trigger event');
        } finally {
            setIsProcessing(false);
        }
    };

    const completeWorkWithEvent = async () => {
        if (!currentUser || !playerStats?.activeWork) {
            alert('Aktiivne töö puudub!');
            return;
        }

        if (!window.confirm('Complete work and trigger an event?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);

            // First create an event
            const workSessionId = playerStats.activeWork.workSessionId || `${currentUser.uid}_${Date.now()}`;
            await createActiveEvent(
                currentUser.uid,
                workSessionId,
                playerStats.activeWork.workId,
                playerStats.level
            );

            // Then complete the work
            await updateDoc(statsRef, {
                'activeWork.endsAt': Timestamp.now()
            });

            // Wait and trigger completion
            setTimeout(() => {
                alert('Work completed with event! Refresh to see the event.');
                window.location.reload();
            }, 100);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to complete with event');
        } finally {
            setIsProcessing(false);
        }
    };

    const forceSpecificEvent = async () => {
        if (!currentUser || !playerStats?.activeWork) {
            alert('Aktiivne töö puudub!');
            return;
        }

        // Get events for current work activity
        const availableEvents = ALL_EVENTS.filter(e =>
            e.activityTypes.includes(playerStats.activeWork!.workId)
        );

        if (availableEvents.length === 0) {
            alert('No events available for current work type');
            return;
        }

        // Let developer choose which event
        const eventList = availableEvents.map((e, i) => `${i + 1}. ${e.title}`).join('\n');
        const choice = prompt(`Choose event (1-${availableEvents.length}):\n${eventList}`);

        if (!choice) return;

        const eventIndex = parseInt(choice) - 1;
        if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= availableEvents.length) {
            alert('Invalid choice');
            return;
        }

        setIsProcessing(true);
        try {
            const selectedEvent = availableEvents[eventIndex];
            const workSessionId = playerStats.activeWork.workSessionId || `${currentUser.uid}_${Date.now()}`;

            // Create the specific event
            const activeEvent = {
                eventId: selectedEvent.id,
                userId: currentUser.uid,
                workSessionId: workSessionId,
                triggeredAt: Timestamp.now(),
                status: 'pending' as const
            };

            // Store in activeEvents collection
            const eventRef = doc(firestore, 'activeEvents', `${currentUser.uid}_${workSessionId}`);
            await setDoc(eventRef, activeEvent);

            alert(`Event "${selectedEvent.title}" created! Refresh to see it.`);
            window.location.reload();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create event');
        } finally {
            setIsProcessing(false);
        }
    };

    const checkPendingEvents = async () => {
        if (!currentUser) return;

        setIsProcessing(true);
        try {
            const pending = await getPendingEvent(currentUser.uid);
            if (pending) {
                alert(`Pending event found: "${pending.eventData.title}"\n\nRefresh the page to see it.`);
            } else {
                alert('No pending events');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to check events');
        } finally {
            setIsProcessing(false);
        }
    };

    const setWorkToLast20Seconds = async () => {
        if (!currentUser || !playerStats?.activeWork) {
            alert('Aktiivne töö puudub! Alusta tööd esmalt.');
            return;
        }

        // Extra validation to ensure we're only affecting current user
        if (playerStats.activeWork.userId && playerStats.activeWork.userId !== currentUser.uid) {
            alert('VIGA: Töö ei kuulu sellele kasutajale!');
            return;
        }

        if (!window.confirm('Määra töö lõppema 20 sekundi pärast?\n(Mõjutab ainult sinu tööd)')) return;

        setIsProcessing(true);
        try {
            // ONLY update the current user's document
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const newEndsAt = Timestamp.fromMillis(Date.now() + 20000);

            // Update playerStats for THIS user only
            await updateDoc(statsRef, {
                'activeWork.endsAt': newEndsAt
            });

            // Also update the activeWork collection if needed
            if (playerStats.activeWork.workSessionId) {
                // Ensure the workSessionId includes the userId
                if (!playerStats.activeWork.workSessionId.startsWith(currentUser.uid)) {
                    console.error('WorkSessionId does not match current user!');
                    alert('VIGA: Töö sessioon ei vasta kasutajale!');
                    return;
                }

                try {
                    const activeWorkRef = doc(firestore, 'activeWork', playerStats.activeWork.workSessionId);
                    await updateDoc(activeWorkRef, {
                        endsAt: newEndsAt,
                        userId: currentUser.uid  // Ensure userId is set
                    });
                } catch (error) {
                    console.log('ActiveWork document update failed (this is OK):', error);
                }
            }

            alert(`Töö lõppeb 20 sekundi pärast!\nAinult kasutaja: ${currentUser.email}`);

            // Reload only THIS user's stats
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                setPlayerStats(statsDoc.data() as PlayerStats);
            }
        } catch (error) {
            console.error('Error setting work countdown:', error);
            alert('Viga töö aja muutmisel');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {/* Floating debug button */}
            <button
                className="debug-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Developer Tools"
            >
                🛠️
            </button>

            {/* Debug menu panel */}
            {isOpen && (
                <div className="debug-menu">
                    <div className="debug-header">
                        <h3>Developer Tools</h3>
                        <button
                            className="debug-close"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="debug-content">
                        <div className="debug-section">
                            <h4>Quick Actions</h4>
                            <button
                                className="debug-btn"
                                onClick={completeCurrentWork}
                                disabled={isProcessing || !playerStats?.activeWork}
                                title={playerStats?.activeWork ? 'Complete active work' : 'No active work'}
                            >
                                ⏭️ Complete Work {!playerStats?.activeWork && '(N/A)'}
                            </button>
                            <button
                                className="debug-btn"
                                onClick={completeCurrentCourse}
                                disabled={isProcessing || !playerStats?.activeCourse}
                                title={playerStats?.activeCourse ? 'Complete active course' : 'No active course'}
                            >
                                ⏭️ Complete Course {!playerStats?.activeCourse && '(N/A)'}
                            </button>
                            <button
                                className="debug-btn"
                                onClick={refillTrainingClicks}
                                disabled={isProcessing}
                            >
                                🔄 Refill Training Clicks
                            </button>
                        </div>

                        <div className="debug-section">
                            <h4>Reset Options</h4>
                            <button
                                className="debug-btn"
                                onClick={resetTutorialAndCourses}
                                disabled={isProcessing}
                            >
                                🔄 Reset Tutorial & Courses
                            </button>
                            <button
                                className="debug-btn"
                                onClick={resetAttributes}
                                disabled={isProcessing}
                            >
                                💪 Reset All Attributes
                            </button>
                            <button
                                className="debug-btn"
                                onClick={resetPlayerStats}
                                disabled={isProcessing}
                            >
                                📊 Reset Player Stats
                            </button>
                            <button
                                className="debug-btn debug-btn-danger"
                                onClick={fullReset}
                                disabled={isProcessing}
                            >
                                ⚠️ FULL RESET
                            </button>
                        </div>

                        <div className="debug-section">
                            <h4>Event Testing</h4>
                            <button
                                className="debug-btn"
                                onClick={triggerRandomEvent}
                                disabled={isProcessing || !playerStats?.activeWork}
                                title="Triggers a random event for current work"
                            >
                                🎲 Trigger Random Event
                            </button>
                            <button
                                className="debug-btn"
                                onClick={forceSpecificEvent}
                                disabled={isProcessing || !playerStats?.activeWork}
                                title="Choose specific event to trigger"
                            >
                                🎯 Force Specific Event
                            </button>
                            <button
                                className="debug-btn"
                                onClick={completeWorkWithEvent}
                                disabled={isProcessing || !playerStats?.activeWork}
                                title="Complete work and trigger event"
                            >
                                ⚡ Complete Work + Event
                            </button>
                            <button
                                className="debug-btn"
                                onClick={checkPendingEvents}
                                disabled={isProcessing}
                                title="Check if there are pending events"
                            >
                                🔍 Check Pending Events
                            </button>
                        </div>

                        <div className="debug-section">
                            <h4>Work Timer Testing</h4>
                            <button
                                className="debug-btn"
                                onClick={setWorkToLast20Seconds}
                                disabled={isProcessing || !playerStats?.activeWork}
                                title="Set work to complete in 20 seconds"
                            >
                                ⏱️ Töö lõppeb 20s pärast
                            </button>
                        </div>

                        <div className="debug-section">
                            <h4>Tutorial Navigation</h4>
                            <div className="debug-step-buttons">
                                <button onClick={() => skipToStep(0)} disabled={isProcessing}>Start</button>
                                <button onClick={() => skipToStep(3)} disabled={isProcessing}>Step 3</button>
                                <button onClick={() => skipToStep(6)} disabled={isProcessing}>Step 6</button>
                                <button onClick={() => skipToStep(9)} disabled={isProcessing}>Step 9</button>
                                <button onClick={() => skipToStep(11)} disabled={isProcessing}>Step 11</button>
                                <button onClick={() => skipToStep(14)} disabled={isProcessing}>Step 14</button>
                            </div>
                        </div>

                        <div className="debug-info">
                            <small>User: {currentUser?.email}</small>
                            {playerStats && (
                                <>
                                    <br />
                                    <small>
                                        Training: {playerStats.trainingData?.remainingClicks || 0} clicks
                                        {playerStats.activeWork && ' (Working)'}
                                        {playerStats.activeCourse && ' (In Course)'}
                                    </small>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};