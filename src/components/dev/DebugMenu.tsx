// src/components/dev/DebugMenu.tsx
import React, { useState, useEffect } from 'react';
import {doc, updateDoc, getDoc, setDoc, deleteDoc, getDocs, query, collection, where, addDoc} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { initializeAttributes, initializeTrainingData } from '../../services/TrainingService';
import {ActiveWork, PlayerStats, TrainingData, WorkHistoryEntry} from '../../types';
import { checkCourseCompletion } from '../../services/CourseService';
import { checkWorkCompletion } from '../../services/WorkService';
import { Timestamp } from 'firebase/firestore';
import { createActiveEvent, getPendingEvent } from '../../services/EventService';
import { migrateUserEquipment, migrateAllUsers } from '../../services/EquipmentMigration';
import { ALL_EVENTS } from '../../data/events';
import '../../styles/components/dev/DebugMenu.css';
import {calculateWorkRewards, getWorkActivityById} from "../../data/workActivities";
import {calculateLevelFromExp} from "../../services/PlayerService";

// ADMIN EMAIL CONSTANT
const ADMIN_EMAIL = 'cjmike12@gmail.com';

export const DebugMenu: React.FC = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

    // Security check helper
    const isAdmin = () => {
        return currentUser?.email === ADMIN_EMAIL;
    };

    // Security check with logging
    const verifyAdminAndLog = (action: string): boolean => {
        if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
            console.error(`SECURITY: Non-admin attempted ${action}`, currentUser?.email);
            return false;
        }
        console.log(`ADMIN ACTION: ${action} by ${currentUser.email} (${currentUser.uid})`);
        return true;
    };

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

    // Only show for admin account
    if (!isAdmin()) {
        return null;
    }

    const completeCurrentWork = async () => {
        if (!verifyAdminAndLog('completeCurrentWork')) {
            alert('Unauthorized');
            return;
        }

        if (!playerStats?.activeWork) {
            alert('Aktiivne töö puudub!');
            return;
        }

        // Extra validation - ensure work belongs to admin
        if (playerStats.activeWork.userId && playerStats.activeWork.userId !== currentUser!.uid) {
            console.error('SECURITY: Attempted to modify another user\'s work!');
            alert('SECURITY ERROR: This work belongs to another user!');
            return;
        }

        if (!window.confirm(`Lõpeta praegune töö kohe?\nUser: ${currentUser!.email}\nUID: ${currentUser!.uid}`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);

            // Double-check document exists and belongs to admin
            const statsDoc = await getDoc(adminStatsRef);
            if (!statsDoc.exists()) {
                throw new Error('Admin stats document not found');
            }

            await updateDoc(adminStatsRef, {
                'activeWork.endsAt': Timestamp.now()
            });

            // Wait a moment then trigger completion FOR ADMIN ONLY
            setTimeout(async () => {
                await checkWorkCompletion(currentUser!.uid); // Pass admin's UID explicitly
                alert(`Töö lõpetatud!\nUser: ${currentUser!.email}`);

                // Reload ADMIN's stats only
                const updatedDoc = await getDoc(adminStatsRef);
                if (updatedDoc.exists()) {
                    setPlayerStats(updatedDoc.data() as PlayerStats);
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
        if (!verifyAdminAndLog('completeCurrentCourse')) {
            alert('Unauthorized');
            return;
        }

        if (!playerStats?.activeCourse) {
            alert('Aktiivne koolitus puudub!');
            return;
        }

        if (playerStats.activeCourse.status !== 'in_progress') {
            alert('Koolitus ei ole aktiivne!');
            return;
        }

        // Extra validation - ensure course belongs to admin
        if (playerStats.activeCourse.userId && playerStats.activeCourse.userId !== currentUser!.uid) {
            console.error('SECURITY: Attempted to modify another user\'s course!');
            alert('SECURITY ERROR: This course belongs to another user!');
            return;
        }

        if (!window.confirm(`Lõpeta praegune koolitus kohe?\nUser: ${currentUser!.email}\nUID: ${currentUser!.uid}`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);

            // Verify the document exists
            const statsDoc = await getDoc(adminStatsRef);
            if (!statsDoc.exists()) {
                throw new Error('Admin stats document not found');
            }

            await updateDoc(adminStatsRef, {
                'activeCourse.endsAt': Timestamp.now()
            });

            // Wait a moment then trigger completion FOR ADMIN ONLY
            setTimeout(async () => {
                await checkCourseCompletion(currentUser!.uid); // Pass admin's UID explicitly
                alert(`Koolitus lõpetatud!\nUser: ${currentUser!.email}`);

                // Reload ADMIN's stats only
                const updatedDoc = await getDoc(adminStatsRef);
                if (updatedDoc.exists()) {
                    setPlayerStats(updatedDoc.data() as PlayerStats);
                }
            }, 100);
        } catch (error) {
            console.error('Error completing course:', error);
            alert('Koolituse lõpetamine ebaõnnestus');
        } finally {
            setIsProcessing(false);
        }
    };

    const refillTrainingClicks = async () => {
        if (!verifyAdminAndLog('refillTrainingClicks')) {
            alert('Unauthorized');
            return;
        }

        if (!window.confirm(`Taasta kõik treeningkorrad (50)?\nUser: ${currentUser!.email}`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);
            const maxClicks = playerStats?.activeWork ? 10 : 50;

            await updateDoc(adminStatsRef, {
                'trainingData.remainingClicks': maxClicks,
                'trainingData.lastResetTime': Timestamp.now()
            });

            alert(`Treeningkorrad taastatud: ${maxClicks}\nUser: ${currentUser!.email}`);

            // Reload ADMIN's stats only
            const statsDoc = await getDoc(adminStatsRef);
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
        if (!verifyAdminAndLog('resetTutorialAndCourses')) {
            alert('Unauthorized');
            return;
        }

        if (!window.confirm(`Reset tutorial and all courses?\nUser: ${currentUser!.email}`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);
            await updateDoc(adminStatsRef, {
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
            alert(`Tutorial and courses reset!\nUser: ${currentUser!.email}`);
        } catch (error) {
            console.error('Error resetting tutorial:', error);
            alert('Failed to reset tutorial');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetAttributes = async () => {
        if (!verifyAdminAndLog('resetAttributes')) {
            alert('Unauthorized');
            return;
        }

        if (!window.confirm(`Reset all attributes to level 0?\nUser: ${currentUser!.email}`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);
            await updateDoc(adminStatsRef, {
                attributes: initializeAttributes(),
                trainingData: initializeTrainingData()
            });
            alert(`Attributes reset!\nUser: ${currentUser!.email}`);
        } catch (error) {
            console.error('Error resetting attributes:', error);
            alert('Failed to reset attributes');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetPlayerStats = async () => {
        if (!verifyAdminAndLog('resetPlayerStats')) {
            alert('Unauthorized');
            return;
        }

        if (!window.confirm(`Reset level, reputation, prefecture, and department?\nUser: ${currentUser!.email}`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);
            await updateDoc(adminStatsRef, {
                level: 1,
                experience: 0,
                reputation: 0,
                rank: null,
                department: null,
                prefecture: null,
                casesCompleted: 0,
                criminalsArrested: 0
            });
            alert(`Player stats reset!\nUser: ${currentUser!.email}`);
        } catch (error) {
            console.error('Error resetting stats:', error);
            alert('Failed to reset stats');
        } finally {
            setIsProcessing(false);
        }
    };

    const fullReset = async () => {
        if (!verifyAdminAndLog('fullReset')) {
            alert('Unauthorized');
            return;
        }

        if (!window.confirm(`⚠️ FULL RESET - This will reset EVERYTHING.\nUser: ${currentUser!.email}\nAre you sure?`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);
            await updateDoc(adminStatsRef, {
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
            alert(`Full reset complete!\nUser: ${currentUser!.email}`);
            window.location.reload();
        } catch (error) {
            console.error('Error doing full reset:', error);
            alert('Failed to do full reset');
        } finally {
            setIsProcessing(false);
        }
    };

    const skipToStep = async (step: number) => {
        if (!verifyAdminAndLog(`skipToStep ${step}`)) {
            alert('Unauthorized');
            return;
        }

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);
            await updateDoc(adminStatsRef, {
                'tutorialProgress.currentStep': step
            });
            alert(`Jumped to tutorial step ${step}\nUser: ${currentUser!.email}`);
            window.location.reload();
        } catch (error) {
            console.error('Error jumping to step:', error);
            alert('Failed to jump to step');
        } finally {
            setIsProcessing(false);
        }
    };

    const triggerRandomEvent = async () => {
        if (!verifyAdminAndLog('triggerRandomEvent')) {
            alert('Unauthorized');
            return;
        }

        if (!playerStats?.activeWork) {
            alert('Aktiivne töö puudub! Alusta tööd esmalt.');
            return;
        }

        // Ensure work belongs to admin
        if (playerStats.activeWork.userId && playerStats.activeWork.userId !== currentUser!.uid) {
            console.error('SECURITY: Work belongs to different user!');
            alert('SECURITY ERROR: Work belongs to different user!');
            return;
        }

        if (!window.confirm(`Trigger random event for current work?\nUser: ${currentUser!.email}`)) return;

        setIsProcessing(true);
        try {
            // Create an event for ADMIN's work only
            const workSessionId = playerStats.activeWork.workSessionId || `${currentUser!.uid}_${Date.now()}`;
            const event = await createActiveEvent(
                currentUser!.uid, // Explicitly pass admin's UID
                workSessionId,
                playerStats.activeWork.workId,
                playerStats.level
            );

            if (event) {
                alert(`Event triggered!\nUser: ${currentUser!.email}\nRefresh the page to see it.`);
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
        if (!verifyAdminAndLog('completeWorkWithEvent')) {
            alert('Unauthorized');
            return;
        }

        if (!playerStats?.activeWork) {
            alert('Aktiivne töö puudub!');
            return;
        }

        // Ensure work belongs to admin
        if (playerStats.activeWork.userId && playerStats.activeWork.userId !== currentUser!.uid) {
            console.error('SECURITY: Work belongs to different user!');
            alert('SECURITY ERROR: Work belongs to different user!');
            return;
        }

        if (!window.confirm(`Complete work immediately and potentially trigger an event?\nUser: ${currentUser!.email}`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);

            await updateDoc(adminStatsRef, {
                'activeWork.endsAt': Timestamp.now()
            });

            setTimeout(async () => {
                const result = await checkWorkCompletion(currentUser!.uid); // Explicitly pass admin's UID
                if (result.hasPendingEvent) {
                    alert(`Work completed with event!\nUser: ${currentUser!.email}`);
                } else if (result.completed) {
                    alert(`Work completed without event!\nUser: ${currentUser!.email}`);
                }
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
        if (!verifyAdminAndLog('forceSpecificEvent')) {
            alert('Unauthorized');
            return;
        }

        if (!playerStats?.activeWork) {
            alert('Aktiivne töö puudub!');
            return;
        }

        // Ensure work belongs to admin
        if (playerStats.activeWork.userId && playerStats.activeWork.userId !== currentUser!.uid) {
            console.error('SECURITY: Work belongs to different user!');
            alert('SECURITY ERROR: Work belongs to different user!');
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

        const eventList = availableEvents.map((e, i) => `${i + 1}. ${e.title}`).join('\n');
        const choice = prompt(`Choose event (1-${availableEvents.length}):\n${eventList}\nUser: ${currentUser!.email}`);

        if (!choice) return;

        const eventIndex = parseInt(choice) - 1;
        if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= availableEvents.length) {
            alert('Invalid choice');
            return;
        }

        setIsProcessing(true);
        try {
            const selectedEvent = availableEvents[eventIndex];
            const workSessionId = playerStats.activeWork.workSessionId || `${currentUser!.uid}_${Date.now()}`;

            // Create the specific event FOR ADMIN ONLY
            const activeEvent = {
                eventId: selectedEvent.id,
                userId: currentUser!.uid, // Explicitly set admin's UID
                workSessionId: workSessionId,
                triggeredAt: Timestamp.now(),
                status: 'pending' as const
            };

            // Store in activeEvents collection with admin's ID
            const eventRef = doc(firestore, 'activeEvents', `${currentUser!.uid}_${workSessionId}`);
            await setDoc(eventRef, activeEvent);

            alert(`Event "${selectedEvent.title}" created!\nUser: ${currentUser!.email}\nRefresh to see it.`);
            window.location.reload();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create event');
        } finally {
            setIsProcessing(false);
        }
    };

    const checkPendingEvents = async () => {
        if (!verifyAdminAndLog('checkPendingEvents')) {
            alert('Unauthorized');
            return;
        }

        setIsProcessing(true);
        try {
            // Check pending events for ADMIN ONLY
            const pending = await getPendingEvent(currentUser!.uid);
            if (pending) {
                alert(`Pending event found: "${pending.eventData.title}"\nUser: ${currentUser!.email}\nRefresh the page to see it.`);
            } else {
                alert(`No pending events\nUser: ${currentUser!.email}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to check events');
        } finally {
            setIsProcessing(false);
        }
    };

    const setWorkToLast20Seconds = async () => {
        if (!verifyAdminAndLog('setWorkToLast20Seconds')) {
            alert('Unauthorized');
            return;
        }

        if (!playerStats?.activeWork) {
            alert('Aktiivne töö puudub! Alusta tööd esmalt.');
            return;
        }

        // Extra validation to ensure work belongs to admin
        if (playerStats.activeWork.userId && playerStats.activeWork.userId !== currentUser!.uid) {
            console.error('SECURITY: Work belongs to different user!');
            alert('SECURITY ERROR: Töö ei kuulu sellele kasutajale!');
            return;
        }

        if (!window.confirm(`Määra töö lõppema 20 sekundi pärast?\nUser: ${currentUser!.email}\n(Mõjutab ainult sinu tööd)`)) return;

        setIsProcessing(true);
        try {
            // ONLY update admin's document
            const adminStatsRef = doc(firestore, 'playerStats', currentUser!.uid);
            const newEndsAt = Timestamp.fromMillis(Date.now() + 20000);

            await updateDoc(adminStatsRef, {
                'activeWork.endsAt': newEndsAt
            });

            // Also update the activeWork collection if needed
            if (playerStats.activeWork.workSessionId) {
                // Ensure the workSessionId includes the admin's userId
                if (!playerStats.activeWork.workSessionId.startsWith(currentUser!.uid)) {
                    console.error('SECURITY: WorkSessionId does not match admin user!');
                    alert('SECURITY ERROR: Töö sessioon ei vasta kasutajale!');
                    return;
                }

                try {
                    const activeWorkRef = doc(firestore, 'activeWork', playerStats.activeWork.workSessionId);
                    await updateDoc(activeWorkRef, {
                        endsAt: newEndsAt,
                        userId: currentUser!.uid  // Ensure userId is admin's
                    });
                } catch (error) {
                    console.log('ActiveWork document update failed (this is OK):', error);
                }
            }

            alert(`Töö lõppeb 20 sekundi pärast!\nUser: ${currentUser!.email}`);

            // Reload ADMIN's stats only
            const statsDoc = await getDoc(adminStatsRef);
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

    const migrateEquipment = async () => {
        if (!verifyAdminAndLog('migrateEquipment')) {
            alert('Unauthorized');
            return;
        }

        const choice = window.confirm(
            `Choose migration type:\n\n` +
            `OK = Migrate only YOUR account (${currentUser!.email})\n` +
            `Cancel = Migrate ALL users (admin only)`
        );

        setIsProcessing(true);
        try {
            if (choice) {
                // Migrate ADMIN user only
                const result = await migrateUserEquipment(currentUser!.uid);
                if (result.success) {
                    alert(`✅ ${result.message}\nUser: ${currentUser!.email}`);
                    if (!result.alreadyMigrated) {
                        window.location.reload();
                    }
                } else {
                    alert(`❌ Migration failed: ${result.message}`);
                }
            } else {
                // Migrate all users - SPECIAL CASE: This affects all users intentionally
                if (!window.confirm('⚠️ ADMIN ACTION: This will migrate ALL users in the database. Continue?')) {
                    setIsProcessing(false);
                    return;
                }

                console.warn('ADMIN ACTION: Migrating ALL users by', currentUser!.email);
                const results = await migrateAllUsers();
                alert(`Migration complete!\n\n` +
                    `Total users: ${results.total}\n` +
                    `Successfully migrated: ${results.migrated}\n` +
                    `Already migrated: ${results.alreadyMigrated}\n` +
                    `Failed: ${results.failed}\n\n` +
                    `Admin: ${currentUser!.email}\n` +
                    `Check console for details.`
                );
                console.log('Migration results:', results);
            }
        } catch (error) {
            console.error('Migration error:', error);
            alert('Migration failed! Check console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    const finishAllWorksNoEvent = async () => {
        if (!currentUser) {
            alert('Kasutaja pole sisse logitud!');
            return;
        }

        if (!window.confirm('Lõpeta kõik aktiivsed tööd ilma sündmusteta?')) return;

        setIsProcessing(true);
        try {
            // Query all active work sessions
            const activeWorkQuery = query(
                collection(firestore, 'activeWork'),
                where('status', '==', 'in_progress')
            );

            const activeWorkDocs = await getDocs(activeWorkQuery);
            let completedCount = 0;
            let totalRewards = 0;

            for (const workDoc of activeWorkDocs.docs) {
                const activeWork = workDoc.data() as ActiveWork;

                // Get player stats for this work
                const statsRef = doc(firestore, 'playerStats', activeWork.userId);
                const statsDoc = await getDoc(statsRef);

                if (!statsDoc.exists()) continue;

                const stats = statsDoc.data() as PlayerStats;

                // Get work activity details
                const workActivity = getWorkActivityById(activeWork.workId);
                if (!workActivity) continue;

                // Calculate rewards
                const expReward = activeWork.expectedExp || calculateWorkRewards(workActivity, activeWork.totalHours);
                totalRewards += expReward;

                // Add to work history
                const historyEntry: WorkHistoryEntry = {
                    userId: activeWork.userId,
                    workId: activeWork.workId,
                    workName: workActivity.name,
                    prefecture: activeWork.prefecture,
                    department: activeWork.department,
                    hoursWorked: activeWork.totalHours,
                    expEarned: expReward,
                    completedAt: new Date()
                };
                await addDoc(collection(firestore, 'workHistory'), historyEntry);

                // Update player stats
                const newExperience = stats.experience + expReward;
                const newLevel = calculateLevelFromExp(newExperience);
                const newTotalWorkedHours = (stats.totalWorkedHours || 0) + activeWork.totalHours;

                // Reset training data to normal
                const normalTrainingClicks = 50;
                const updatedTrainingData: TrainingData = {
                    remainingClicks: normalTrainingClicks,
                    lastResetTime: Timestamp.now(),
                    totalTrainingsDone: stats.trainingData?.totalTrainingsDone || 0,
                    isWorking: false
                };

                // Update player stats and remove active work
                await updateDoc(statsRef, {
                    experience: newExperience,
                    level: newLevel,
                    totalWorkedHours: newTotalWorkedHours,
                    activeWork: null,
                    trainingData: updatedTrainingData
                });

                // Delete the active work document
                await deleteDoc(doc(firestore, 'activeWork', workDoc.id));

                completedCount++;
            }

            // Also check for any pending events and clear them
            const eventsQuery = query(
                collection(firestore, 'activeEvents'),
                where('status', '==', 'pending')
            );

            const eventDocs = await getDocs(eventsQuery);
            for (const eventDoc of eventDocs.docs) {
                await deleteDoc(doc(firestore, 'activeEvents', eventDoc.id));
            }

            alert(`Lõpetatud ${completedCount} tööd!\nKogukogemus: ${totalRewards} XP\nKõik sündmused tühistatud.`);

            // Reload stats
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                setPlayerStats(statsDoc.data() as PlayerStats);
            }
        } catch (error) {
            console.error('Error finishing works:', error);
            alert('Viga tööde lõpetamisel! Vaata konsooli.');
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
                title={`Developer Tools (${currentUser?.email})`}
            >
                🛠️
            </button>

            {/* Debug menu panel */}
            {isOpen && (
                <div className="debug-menu">
                    <div className="debug-header">
                        <h3>Developer Tools (ADMIN)</h3>
                        <button
                            className="debug-close"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="debug-content">
                        <div className="debug-warning" style={{
                            backgroundColor: '#ff000020',
                            border: '1px solid #ff0000',
                            padding: '10px',
                            marginBottom: '10px',
                            borderRadius: '5px'
                        }}>
                            ⚠️ ADMIN MODE: {currentUser?.email}<br/>
                            All actions affect ONLY your account
                        </div>

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
                        <h4>Work Management</h4>
                        <button
                            className="debug-btn"
                            onClick={finishAllWorksNoEvent}
                            disabled={isProcessing}
                            title="Complete ALL active works server-wide without events"
                        >
                            ✅ Lõpeta KÕIK tööd (admin)
                        </button>

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
                        </div>

                        <div className="debug-section">
                            <h4>Equipment Migration</h4>
                            <button
                                className="debug-btn"
                                onClick={migrateEquipment}
                                disabled={isProcessing}
                                title="Add stats to existing equipment"
                            >
                                🔧 Migrate Equipment Stats
                            </button>
                            <small style={{ display: 'block', marginTop: '5px', color: '#888' }}>
                                Adds missing stats, prices, and grants missing equipment from completed courses
                            </small>
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
                            <small>Admin User: {currentUser?.email}</small>
                            <br />
                            <small>UID: {currentUser?.uid}</small>
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