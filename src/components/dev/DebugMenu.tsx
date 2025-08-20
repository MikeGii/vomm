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
import { getRecentPurchases, getSuspiciousPurchases } from '../../services/ShopLoggingService';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';
import {
    previewConsolidation,
    repairAndConsolidateAllInventories
} from '../../services/InventoryRepairService';
import '../../styles/components/dev/DebugMenu.css';

const ADMIN_USER_ID = 'WUucfDi2DAat9sgDY75mDZ8ct1k2';

export const DebugMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [purchaseLogs, setPurchaseLogs] = useState<any[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [consolidationPreview, setConsolidationPreview] = useState<{
        totalUsers: number;
        totalItems: number;
        items: any[];
    } | null>(null);
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

// Add preview function
    const previewConsolidationChanges = async () => {
        setLoading(true);
        try {
            const preview = await previewConsolidation();
            setConsolidationPreview({
                totalUsers: preview.totalUsers,
                totalItems: preview.totalItemsToConsolidate,
                items: preview.consolidationPreview
            });
            showToast(`Leiti ${preview.totalItemsToConsolidate} kokku viidavat eset ${preview.totalUsers} mängijal`, 'info');
        } catch (error) {
            console.error('Preview failed:', error);
            showToast('Eelvaate laadimine ebaõnnestus', 'error');
        } finally {
            setLoading(false);
        }
    };

// Add consolidation execution function
    const executeConsolidation = async () => {
        const result = await repairAndConsolidateAllInventories();

        if (result.success) {
            setConsolidationPreview(null);
            showToast(`Kokku viidud ${result.totalItemsConsolidated} eset ${result.usersProcessed} mängijal`, 'success');
            console.log('Consolidation Results:', result.details);
        } else {
            throw new Error('Kokku viimine ebaõnnestus');
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

    // Add functions
    const loadPurchaseLogs = async () => {
        setLoading(true);
        try {
            const logs = await getRecentPurchases(50);
            setPurchaseLogs(logs);
            setShowLogs(true);
            showToast(`Laaditud ${logs.length} viimast ostu`, 'info');
        } catch (error) {
            showToast('Logide laadimine ebaõnnestus', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadSuspiciousActivity = async () => {
        setLoading(true);
        try {
            const logs = await getSuspiciousPurchases(50); // 50+ items at once
            setPurchaseLogs(logs);
            setShowLogs(true);
            if (logs.length > 0) {
                showToast(`⚠️ Leitud ${logs.length} kahtlast ostu!`, 'warning');
            } else {
                showToast('Kahtlasi oste ei leitud', 'success');
            }
        } catch (error) {
            showToast('Logide laadimine ebaõnnestus', 'error');
        } finally {
            setLoading(false);
        }
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

                        {/* Inventory Repair Section */}
                        <div className="debug-section">
                            <h4>Inventari kokku viimine (Stack Fix)</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <button
                                    className="debug-btn"
                                    onClick={previewConsolidationChanges}
                                    disabled={loading}
                                >
                                    Vaata duplikaate
                                </button>

                                {consolidationPreview && (
                                    <div className="debug-info-text" style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                                        <strong>Leitud {consolidationPreview.totalItems} duplikaati {consolidationPreview.totalUsers} mängijal:</strong>
                                        <div style={{ maxHeight: '100px', overflow: 'auto', marginTop: '0.25rem' }}>
                                            {consolidationPreview.items.slice(0, 10).map((item, index) => (
                                                <div key={index} style={{ fontSize: '0.7rem' }}>
                                                    {item.userId}: {item.currentItems}x "{item.itemName}" → 1x (kokku {item.totalQuantity})
                                                </div>
                                            ))}
                                            {consolidationPreview.items.length > 10 && (
                                                <div style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                                                    ...ja veel {consolidationPreview.items.length - 10} duplikaati
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {consolidationPreview && consolidationPreview.totalItems > 0 && (
                                    <button
                                        className="debug-btn debug-btn-danger"
                                        onClick={() => executeDebugAction(
                                            executeConsolidation,
                                            ''
                                        )}
                                        disabled={loading}
                                    >
                                        VII KOKKU kõikide inventarid
                                    </button>
                                )}
                            </div>
                            <div className="debug-info-text" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                Viib kokku samade ID-dega esemed (nt 5x "Puhastusaine" → 1x kogusega 5). Esmalt vaata eelvaade üle!
                            </div>
                        </div>

                        <div className="debug-section">
                            <h4>Poe ostude logi</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <button
                                    className="debug-btn"
                                    onClick={loadPurchaseLogs}
                                    disabled={loading}
                                >
                                    Vaata viimased 50 ostu
                                </button>

                                <button
                                    className="debug-btn"
                                    onClick={loadSuspiciousActivity}
                                    disabled={loading}
                                >
                                    Vaata kahtlasi oste (50+ tk)
                                </button>

                                {showLogs && purchaseLogs.length > 0 && (
                                    <div className="debug-info-text" style={{
                                        fontSize: '0.7rem',
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        backgroundColor: '#2a2a2a',
                                        padding: '0.5rem',
                                        borderRadius: '4px'
                                    }}>
                                        {purchaseLogs.map((log, index) => (
                                            <div key={index} style={{
                                                borderBottom: '1px solid #444',
                                                paddingBottom: '0.25rem',
                                                marginBottom: '0.25rem'
                                            }}>
                                                <strong>{log.username}</strong> ostis {log.quantity}x {log.itemName}<br/>
                                                Hind: {log.currency === 'pollid' ? '💎' : '€'}{log.totalCost.toFixed(2)}<br/>
                                                Laoseis: {log.stockBefore} → {log.stockAfter}<br/>
                                                <small>{new Date(log.timestamp.seconds * 1000).toLocaleString('et-EE')}</small>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showLogs && (
                                    <button
                                        className="debug-btn"
                                        onClick={() => {
                                            setShowLogs(false);
                                            setPurchaseLogs([]);
                                        }}
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        Sulge logid
                                    </button>
                                )}
                            </div>
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