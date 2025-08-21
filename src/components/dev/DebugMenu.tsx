// src/components/dev/DebugMenu.tsx
import React, { useState, useEffect } from 'react';
import {
    doc, updateDoc, collection, getDocs, Timestamp, onSnapshot, query,
    where,
    limit,
    deleteDoc,
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PlayerStats } from '../../types';
import { getCourseById } from '../../data/courses';
import { completeWork } from '../../services/WorkService';
import { checkCourseCompletion } from '../../services/CourseService';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';

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

    const refillAllCraftingStocks = async (): Promise<void> => {
        const stockCollection = collection(firestore, 'shopStock');
        const stockSnapshot = await getDocs(stockCollection);

        let refillCount = 0;

        for (const stockDoc of stockSnapshot.docs) {
            const stockData = stockDoc.data();
            const itemId = stockData.itemId;

            // Find the corresponding crafting ingredient
            const craftingItem = CRAFTING_INGREDIENTS.find(item => item.id === itemId);

            // Only refill crafting ingredients with maxStock > 0 (basic ingredients)
            if (craftingItem && craftingItem.maxStock > 0) {
                await updateDoc(stockDoc.ref, {
                    currentStock: craftingItem.maxStock,
                    lastRestockTime: Timestamp.now()
                });
                refillCount++;
            }
        }

        if (refillCount === 0) {
            throw new Error('Ühtegi koostisosa laovaru ei täiendatud');
        }

        showToast(`${refillCount} koostisosa laovaru täiendatud maksimumini`, 'success');
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

                        {/* Shop Stock Section */}
                        <div className="debug-section">
                            <h4>Poe laovaru</h4>
                            <button
                                className="debug-btn"
                                onClick={() => executeDebugAction(
                                    refillAllCraftingStocks,
                                    ''
                                )}
                                disabled={loading}
                            >
                                Täienda kõik koostisosade varud
                            </button>
                            <div className="debug-info-text" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                Täidab kõik algmaterjali varud (kaerahelbed, vesi, siirup, alkohol) maksimumini. Ei mõjuta mängijate toodetud esemeid.
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
