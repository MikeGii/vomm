// src/components/dev/DebugMenu.tsx
import React, { useState, useEffect } from 'react';
import {doc, updateDoc, collection, getDocs, Timestamp, onSnapshot,     query,
    where,
    limit,
    deleteDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PlayerStats } from '../../types';
import { getCourseById } from '../../data/courses';
import { completeWork } from '../../services/WorkService';
import { checkCourseCompletion } from '../../services/CourseService';
import { migrateCraftingItems} from "../../services/InventoryMigrationService";
import '../../styles/components/dev/DebugMenu.css';

const ADMIN_USER_ID = 'WUucfDi2DAat9sgDY75mDZ8ct1k2';

export const DebugMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // Load player stats to check for active course
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);
        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                setPlayerStats(doc.data() as PlayerStats);
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Only show for admin user
    if (!currentUser || currentUser.uid !== ADMIN_USER_ID) {
        return null;
    }

    const executeDebugAction = async (action: () => Promise<void>, successMessage: string) => {
        setLoading(true);
        try {
            await action();
            showToast(successMessage, 'success');
        } catch (error) {
            console.error('Debug action failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Tegevus ebaõnnestus';
            showToast(`Viga: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 1. Complete admin's currently active course
    const completeActiveCourse = async () => {
        if (!playerStats?.activeCourse || playerStats.activeCourse.status !== 'in_progress') {
            throw new Error('Sul pole aktiivet kursust');
        }

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);

        // Set course end time to past time to ensure it triggers completion
        const pastTime = Timestamp.fromMillis(Date.now() - 5000); // 5 seconds ago

        await updateDoc(statsRef, {
            'activeCourse.endsAt': pastTime
            // Don't set status to 'completed' here - let checkCourseCompletion handle it
        });

        // Add a small delay to ensure the update is written
        await new Promise(resolve => setTimeout(resolve, 500));

        // Now trigger course completion check
        const wasCompleted = await checkCourseCompletion(currentUser.uid);

        if (!wasCompleted) {
            throw new Error('Kursuse lõpetamine ebaõnnestus');
        }
    };

    // 2. Shorten work time to 20 seconds for admin
    const shortenWorkTime = async () => {
        if (!playerStats?.activeWork) {
            throw new Error('Sul pole aktiivet tööd');
        }

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);
        const newEndTime = Timestamp.fromMillis(Date.now() + 20 * 1000); // 20 seconds from now

        await updateDoc(statsRef, {
            'activeWork.endsAt': newEndTime
        });
    };

    // 3. Fill all training clicks for admin
    const fillTrainingClicks = async () => {
        const statsRef = doc(firestore, 'playerStats', currentUser.uid);
        await updateDoc(statsRef, {
            'trainingData.remainingClicks': 50
        });
    };

    // 4. Complete work for ALL players
    const completeAllPlayersWork = async () => {
        const playerStatsCollection = collection(firestore, 'playerStats');
        const snapshot = await getDocs(playerStatsCollection);

        let completedCount = 0;
        let eventsCleanedCount = 0;

        for (const docSnapshot of snapshot.docs) {
            const stats = docSnapshot.data() as PlayerStats;
            if (stats.activeWork) {
                try {
                    // First, check and clean up any pending events for this player
                    const eventsQuery = query(
                        collection(firestore, 'activeEvents'),
                        where('userId', '==', docSnapshot.id),
                        limit(10)
                    );

                    const eventsSnapshot = await getDocs(eventsQuery);

                    // Delete all pending events for this player
                    for (const eventDoc of eventsSnapshot.docs) {
                        await deleteDoc(doc(firestore, 'activeEvents', eventDoc.id));
                        eventsCleanedCount++;
                    }

                    // Now safely complete the work
                    await completeWork(docSnapshot.id);
                    completedCount++;
                } catch (error) {
                    console.error(`Failed to complete work for ${docSnapshot.id}:`, error);
                }
            }
        }

        if (completedCount === 0) {
            throw new Error('Ühtegi aktiivet tööd ei leitud');
        }

        const message = eventsCleanedCount > 0
            ? `${completedCount} mängija töö lõpetatud, ${eventsCleanedCount} sündmust tühistatud`
            : `${completedCount} mängija töö lõpetatud`;

        showToast(message, 'success');
    };

    const handleMigrateCrafting = async () => {
        if (!currentUser) {
            showToast('User not logged in', 'error');
            return;
        }

        try {
            await migrateCraftingItems(currentUser.uid);
            showToast('Crafting items migrated successfully', 'success');
        } catch (error) {
            console.error('Migration error:', error);
            showToast('Migration failed', 'error');
        }
    };

    const giveVipItemsToAllPlayers = async () => {
        const playerStatsCollection = collection(firestore, 'playerStats');
        const snapshot = await getDocs(playerStatsCollection);

        let playersUpdated = 0;

        for (const docSnapshot of snapshot.docs) {
            try {
                const stats = docSnapshot.data() as PlayerStats;
                const currentInventory = stats.inventory || [];

                // Create the VIP items to add
                const vipItems = [
                    {
                        id: `vip_work_time_booster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: 'Tööaeg 95%',
                        description: 'Lühendab aktiivset tööaega 95%',
                        category: 'consumable' as const,
                        quantity: 1,
                        shopPrice: 0,
                        equipped: false,
                        source: 'event' as const,
                        obtainedAt: new Date(),
                        consumableEffect: {
                            type: 'workTimeReduction' as const,
                            value: 95
                        }
                    },
                    {
                        id: `vip_course_time_booster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: 'Kursus 95%',
                        description: 'Lühendab aktiivset kursust 95%',
                        category: 'consumable' as const,
                        quantity: 1,
                        shopPrice: 0,
                        equipped: false,
                        source: 'event' as const,
                        obtainedAt: new Date(),
                        consumableEffect: {
                            type: 'courseTimeReduction' as const,
                            value: 95
                        }
                    }
                ];

                // Check if player already has these items (to avoid duplicates)
                const hasWorkBooster = currentInventory.some(item =>
                    item.consumableEffect?.type === 'workTimeReduction' &&
                    item.name === 'Tööaeg 95%'
                );
                const hasCourseBooster = currentInventory.some(item =>
                    item.consumableEffect?.type === 'courseTimeReduction' &&
                    item.name === 'Kursus 95%'
                );

                const itemsToAdd = [];

                // Only add items if player doesn't have them
                if (!hasWorkBooster) {
                    itemsToAdd.push(vipItems[0]);
                }
                if (!hasCourseBooster) {
                    itemsToAdd.push(vipItems[1]);
                }

                if (itemsToAdd.length > 0) {
                    const updatedInventory = [...currentInventory, ...itemsToAdd];

                    const statsRef = doc(firestore, 'playerStats', docSnapshot.id);
                    await updateDoc(statsRef, {
                        inventory: updatedInventory
                    });

                    playersUpdated++;
                }
            } catch (error) {
                console.error(`Failed to give VIP items to ${docSnapshot.id}:`, error);
            }
        }

        if (playersUpdated === 0) {
            throw new Error('Ükski mängija ei saanud VIP esemeid (võimalik, et kõigil on juba)');
        }

        showToast(`${playersUpdated} mängijale anti VIP esemed`, 'success');
    };

    // Get current active course info
    const getActiveCourseInfo = () => {
        if (!playerStats?.activeCourse || playerStats.activeCourse.status !== 'in_progress') {
            return null;
        }

        const course = getCourseById(playerStats.activeCourse.courseId);
        return course ? course.name : 'Tundmatu kursus';
    };

    const activeCourseInfo = getActiveCourseInfo();

    return (
        <>
            {/* Debug Toggle Button */}
            <button
                className="debug-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Admin Debug"
            >
                🔧
            </button>

            {/* Debug Menu */}
            {isOpen && (
                <div className="debug-menu">
                    <div className="debug-header">
                        <h3>Admin Debug</h3>
                        <button
                            className="debug-close"
                            onClick={() => setIsOpen(false)}
                        >
                            ×
                        </button>
                    </div>

                    <div className="debug-content">
                        {/* Course Completion Section */}
                        <div className="debug-section">
                            <h4>Aktiivne kursus</h4>
                            {activeCourseInfo ? (
                                <button
                                    className="debug-btn"
                                    onClick={() => executeDebugAction(
                                        completeActiveCourse,
                                        `Kursus "${activeCourseInfo}" lõpetatud`
                                    )}
                                    disabled={loading}
                                >
                                    Lõpeta: {activeCourseInfo}
                                </button>
                            ) : (
                                <div className="debug-info-text">
                                    Sul pole hetkel aktiivet kursust
                                </div>
                            )}
                        </div>

                        {/* Work Time Section */}
                        <div className="debug-section">
                            <h4>Töö kiirenda</h4>
                            {playerStats?.activeWork ? (
                                <button
                                    className="debug-btn"
                                    onClick={() => executeDebugAction(
                                        shortenWorkTime,
                                        'Töö aeg lühendatud 20 sekundile'
                                    )}
                                    disabled={loading}
                                >
                                    Lühenda töö aega 20 sekundile
                                </button>
                            ) : (
                                <div className="debug-info-text">
                                    Sul pole hetkel aktiivet tööd
                                </div>
                            )}
                        </div>

                        {/* Training Section */}
                        <div className="debug-section">
                            <h4>Treening</h4>
                            <button
                                className="debug-btn"
                                onClick={() => executeDebugAction(
                                    fillTrainingClicks,
                                    'Treeningu klikid täidetud'
                                )}
                                disabled={loading}
                            >
                                Täida treeningu klikid (50/50)
                            </button>
                        </div>

                        {/* Global Actions Section */}
                        <div className="debug-section">
                            <h4>Globaalsed tegevused</h4>
                            <button
                                className="debug-btn debug-btn-danger"
                                onClick={() => executeDebugAction(
                                    completeAllPlayersWork,
                                    ''
                                )}
                                disabled={loading}
                            >
                                Lõpeta KÕIKIDE mängijate töö
                            </button>
                        </div>

                        <button onClick={handleMigrateCrafting}>
                            Migrate Crafting Items
                        </button>

                        {/* VIP Items Section - Add this after the Training Section */}
                        <div className="debug-section">
                            <h4>VIP Esemed</h4>
                            <button
                                className="debug-btn debug-btn-danger"
                                onClick={() => executeDebugAction(
                                    giveVipItemsToAllPlayers,
                                    ''
                                )}
                                disabled={loading}
                            >
                                Anna kõigile mängijatele VIP esemed
                            </button>
                            <div className="debug-info-text" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                Annab igale mängijale: 1x Tööaeg 95%, 1x Kursus 95%
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="debug-info">
                            <small>
                                Admin ID: {currentUser.uid.substring(0, 8)}...<br/>
                                Email: {currentUser.email}
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};