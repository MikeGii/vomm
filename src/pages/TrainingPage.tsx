// src/pages/TrainingPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { AttributesDisplay } from '../components/training/AttributesDisplay';
import { TrainingCounter } from '../components/training/TrainingCounter';
import { ActivitySelector } from '../components/training/ActivitySelector';
import { TrainingMilestones } from "../components/training/TrainingMilestones";
import { TrainingBoosters } from '../components/training/TrainingBoosters';
import { KitchenBoosters } from '../components/training/KitchenBoosters';
import { getKitchenBoosters } from '../services/TrainingBoosterService';
import { HandicraftBoosters } from '../components/training/HandicraftBoosters';
import { getHandicraftBoosters } from '../services/TrainingBoosterService';
import { CraftingInventory } from "../components/training/CraftingInventory";
import { TabNavigation } from '../components/ui/TabNavigation';
import { getTrainingBoosters } from '../services/TrainingBoosterService';
import { getAvailableKitchenLabActivities, getKitchenLabActivityById } from '../data/kitchenLabActivities';
import { getAvailableHandicraftActivities, getHandicraftActivityById } from '../data/handicraftActivities';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useNavigate } from 'react-router-dom';
import {PlayerAttributes, PlayerStats, TrainingActivity} from '../types';
import { InventoryItem } from '../types';
import {
    checkAndResetTrainingClicks,
    checkAndResetKitchenLabTrainingClicks,
    performTraining,
    initializeAttributes,
    initializeTrainingData,
    initializeKitchenLabTrainingData,
    checkAndResetHandicraftTrainingClicks,
    initializeHandicraftTrainingData
} from '../services/TrainingService';
import { getAvailableActivities, getActivityById } from '../data/trainingActivities';
import { sellCraftedItem } from '../services/SellService';
import '../styles/pages/Training.css';

const getVipAwareMaxClicks = (playerStats: PlayerStats | null): number => {
    if (!playerStats) return 50;

    if (playerStats.isVip) {
        return playerStats.activeWork ? 30 : 100;
    } else {
        return playerStats.activeWork ? 10 : 50;
    }
};

const TrainingPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { playerStats, loading, refreshStats } = usePlayerStats();

    const [availableActivities, setAvailableActivities] = useState<TrainingActivity[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [isTraining, setIsTraining] = useState(false);
    const [trainingBoosters, setTrainingBoosters] = useState<InventoryItem[]>([]);
    const [kitchenBoosters, setKitchenBoosters] = useState<InventoryItem[]>([]);
    const [handicraftBoosters, setHandicraftBoosters] = useState<InventoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<string>('sports');
    const [kitchenLabActivities, setKitchenLabActivities] = useState<TrainingActivity[]>([]);
    const [selectedKitchenLabActivity, setSelectedKitchenLabActivity] = useState<string>('');
    const [isKitchenLabTraining, setIsKitchenLabTraining] = useState(false);
    const [initializationDone, setInitializationDone] = useState(false);
    const clicksCheckedRef = useRef(false);
    const [handicraftActivities, setHandicraftActivities] = useState<TrainingActivity[]>([]);
    const [selectedHandicraftActivity, setSelectedHandicraftActivity] = useState<string>('');
    const [isHandicraftTraining, setIsHandicraftTraining] = useState(false);

    const tabs = [
        { id: 'sports', label: 'Sporditreening' },
        { id: 'food', label: 'Köök & Labor' },
        { id: 'handcraft', label: 'Käsitöö' }
    ];

    // One-time initialization for missing attributes
    useEffect(() => {
        if (!currentUser || !playerStats || initializationDone) return;

        const initializeIfNeeded = async () => {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            let needsUpdate = false;
            const updates: any = {};

            // Check and initialize attributes
            if (!playerStats.attributes) {
                updates.attributes = initializeAttributes();
                needsUpdate = true;
            } else {
                // Ensure all attributes exist
                const defaultAttributes = initializeAttributes();
                const currentAttributes = { ...playerStats.attributes };
                let attributesUpdated = false;

                Object.keys(defaultAttributes).forEach(key => {
                    if (!currentAttributes[key as keyof PlayerAttributes]) {
                        currentAttributes[key as keyof PlayerAttributes] =
                            defaultAttributes[key as keyof PlayerAttributes];
                        attributesUpdated = true;
                    }
                });

                if (attributesUpdated) {
                    updates.attributes = currentAttributes;
                    needsUpdate = true;
                }
            }

            // Initialize training data if missing
            if (!playerStats.trainingData) {
                updates.trainingData = initializeTrainingData();
                needsUpdate = true;
            }

            if (!playerStats.kitchenLabTrainingData) {
                updates.kitchenLabTrainingData = initializeKitchenLabTrainingData();
                needsUpdate = true;
            }

            if (!playerStats.handicraftTrainingData) {
                updates.handicraftTrainingData = initializeHandicraftTrainingData();
                needsUpdate = true;
            }

            // Update database if needed
            if (needsUpdate) {
                try {
                    await updateDoc(statsRef, updates);
                    await refreshStats();
                } catch (error) {
                    console.error('Error initializing training data:', error);
                    showToast('Viga treeningandmete initsialiseerimisel', 'error');
                }
            }

            setInitializationDone(true);
        };

        initializeIfNeeded();
    }, [currentUser, playerStats, initializationDone, refreshStats, showToast]);

    // Update derived state when playerStats changes
    useEffect(() => {
        if (!playerStats || !currentUser) return;

        const abortController = new AbortController();

        const updateClicksIfNeeded = async () => {
            if (abortController.signal.aborted || clicksCheckedRef.current) return;

            try {
                clicksCheckedRef.current = true;

                await checkAndResetTrainingClicks(currentUser.uid);
                await checkAndResetKitchenLabTrainingClicks(currentUser.uid);
                await checkAndResetHandicraftTrainingClicks(currentUser.uid);

            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.error('Error checking clicks:', error);
                    clicksCheckedRef.current = false;
                }
            }
        };

        updateClicksIfNeeded();

        // Update UI elements based on playerStats
        setTrainingBoosters(getTrainingBoosters(playerStats.inventory || []));
        setKitchenBoosters(getKitchenBoosters(playerStats.inventory || []));
        setAvailableActivities(getAvailableActivities(playerStats.level));
        setKitchenLabActivities(getAvailableKitchenLabActivities(playerStats.level));
        setHandicraftActivities(getAvailableHandicraftActivities(playerStats.level));
        setHandicraftBoosters(getHandicraftBoosters(playerStats.inventory || []));

        return () => {
            abortController.abort();
        };
    }, [playerStats, currentUser]);

// Reset flag when user changes
    useEffect(() => {
        clicksCheckedRef.current = false;
    }, [currentUser]);

    // Handle training action
    const handleTrain = useCallback(async () => {
        if (!currentUser || isTraining || !playerStats) return;

        // Check clicks based on active tab
        let hasClicks = false;
        if (activeTab === 'sports') {
            hasClicks = (playerStats.trainingData?.remainingClicks || 0) > 0;
        } else if (activeTab === 'food') {
            hasClicks = (playerStats.kitchenLabTrainingData?.remainingClicks || 0) > 0;
        } else if (activeTab === 'handcraft') {
            hasClicks = (playerStats.handicraftTrainingData?.remainingClicks || 0) > 0;
        }

        if (!hasClicks) {
            showToast('Treeningkordi pole enam järel! Oota järgmist täistundi.', 'warning');
            return;
        }

        let activityId = '';
        let activity = null;

        // Determine which activity to use
        if (activeTab === 'sports') {
            if (!selectedActivity) {
                showToast('Vali esmalt treeningtegevus!', 'warning');
                return;
            }
            activityId = selectedActivity;
            activity = getActivityById(selectedActivity);
        } else if (activeTab === 'food') {
            if (!selectedKitchenLabActivity) {
                showToast('Vali esmalt köök & labor tegevus!', 'warning');
                return;
            }
            activityId = selectedKitchenLabActivity;
            activity = getKitchenLabActivityById(selectedKitchenLabActivity);
        } else if (activeTab === 'handcraft') {
            if (!selectedHandicraftActivity) {
                showToast('Vali esmalt käsitöö tegevus!', 'warning');
                return;
            }
            activityId = selectedHandicraftActivity;
            activity = getHandicraftActivityById(selectedHandicraftActivity);
        }

        if (!activity) return;

        setIsTraining(true);
        if (activeTab === 'food') {
            setIsKitchenLabTraining(true);
        } else if (activeTab === 'handcraft') {
            setIsHandicraftTraining(true);
        }

        try {
            const trainingType = activeTab === 'sports' ? 'sports' :
                activeTab === 'food' ? 'kitchen-lab' : 'handicraft';
            await performTraining(currentUser.uid, activityId, activity.rewards, trainingType);
            await refreshStats(); // Update stats after training
        } catch (error: any) {
            showToast(error.message || 'Treenimine ebaõnnestus', 'error');
        } finally {
            setIsTraining(false);
            setIsKitchenLabTraining(false);
            setIsHandicraftTraining(false);
        }
    }, [currentUser, selectedActivity, selectedKitchenLabActivity, selectedHandicraftActivity, activeTab,
        isTraining, playerStats, refreshStats, showToast]);

    // Handle selling crafted items
    const handleSellItem = useCallback(async (itemId: string, quantity: number) => {
        if (!currentUser) {
            throw new Error('Kasutaja ei ole sisse logitud');
        }

        try {
            const result = await sellCraftedItem(currentUser.uid, itemId, quantity);

            if (result.success) {
                showToast(result.message, 'success');
                await refreshStats();
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            showToast(error.message || 'Müük ebaõnnestus', 'error');
            throw error;
        }
    }, [currentUser, refreshStats, showToast]);

    // Handle booster used
    const handleBoosterUsed = useCallback(async () => {
        await refreshStats();
    }, [refreshStats]);

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="training-container">
                    <div className="loading">Laadin treeningkeskust...</div>
                </main>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="training-container">
                    <div className="error">Viga andmete laadimisel</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="training-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="training-title">Treeningkeskus</h1>

                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Sports Tab */}
                {activeTab === 'sports' && (
                    <>
                        <TrainingCounter
                            remainingClicks={playerStats.trainingData?.remainingClicks || 0}
                            maxClicks={getVipAwareMaxClicks(playerStats)}
                            lastResetTime={playerStats.trainingData?.lastResetTime}
                        />

                        <AttributesDisplay
                            attributes={playerStats.attributes || initializeAttributes()}
                            displayAttributes={[
                                { key: 'strength', name: 'Jõud', icon: '💪' },
                                { key: 'agility', name: 'Kiirus', icon: '🏃' },
                                { key: 'dexterity', name: 'Osavus', icon: '🎯' },
                                { key: 'intelligence', name: 'Intelligentsus', icon: '🧠' },
                                { key: 'endurance', name: 'Vastupidavus', icon: '🏋️' }
                            ]}
                        />

                        <TrainingMilestones currentLevel={playerStats.level} />

                        <ActivitySelector
                            activities={availableActivities}
                            selectedActivity={selectedActivity}
                            onActivitySelect={setSelectedActivity}
                            onTrain={handleTrain}
                            isTraining={isTraining}
                            canTrain={(playerStats.trainingData?.remainingClicks || 0) > 0}
                            playerStats={playerStats}
                            trainingType="sports"
                        />

                        <TrainingBoosters
                            boosters={trainingBoosters}
                            currentClicks={playerStats.trainingData?.remainingClicks || 0}
                            maxClicks={getVipAwareMaxClicks(playerStats)}
                            onBoosterUsed={handleBoosterUsed}
                        />
                    </>
                )}

                {/* Kitchen & Lab Tab */}
                {activeTab === 'food' && (
                    <>
                        <TrainingCounter
                            remainingClicks={playerStats.kitchenLabTrainingData?.remainingClicks || 0}
                            maxClicks={getVipAwareMaxClicks(playerStats)}
                            label="Köök & Labor klikke jäänud"
                            lastResetTime={playerStats.kitchenLabTrainingData?.lastResetTime}
                        />

                        <AttributesDisplay
                            attributes={playerStats.attributes || initializeAttributes()}
                            title="Sinu köök & labor oskused"
                            displayAttributes={[
                                { key: 'cooking', name: 'Toidu valmistamine', icon: '🍳' },
                                { key: 'brewing', name: 'Joogi valmistamine', icon: '🥤' },
                                { key: 'chemistry', name: 'Keemia valmistamine', icon: '🧪' }
                            ]}
                        />

                        <TrainingMilestones currentLevel={playerStats.level} />

                        <ActivitySelector
                            activities={kitchenLabActivities}
                            selectedActivity={selectedKitchenLabActivity}
                            onActivitySelect={setSelectedKitchenLabActivity}
                            onTrain={handleTrain}
                            isTraining={isKitchenLabTraining}
                            canTrain={(playerStats.kitchenLabTrainingData?.remainingClicks || 0) > 0}
                            playerStats={playerStats}
                            trainingType="kitchen-lab"
                        />

                        <CraftingInventory
                            inventory={playerStats.inventory || []}
                            onSellItem={handleSellItem}
                        />

                        <KitchenBoosters
                            boosters={kitchenBoosters}
                            currentClicks={playerStats.kitchenLabTrainingData?.remainingClicks || 0}
                            maxClicks={getVipAwareMaxClicks(playerStats)}
                            onBoosterUsed={handleBoosterUsed}
                        />
                    </>
                )}

                {/* Handcraft Tab */}
                {activeTab === 'handcraft' && (
                    <>
                        <TrainingCounter
                            remainingClicks={playerStats.handicraftTrainingData?.remainingClicks || 0}
                            maxClicks={getVipAwareMaxClicks(playerStats)}
                            label="Käsitöö klikke jäänud"
                            lastResetTime={playerStats.handicraftTrainingData?.lastResetTime}
                        />

                        <AttributesDisplay
                            attributes={playerStats.attributes || initializeAttributes()}
                            title="Sinu käsitöö oskused"
                            displayAttributes={[
                                { key: 'sewing', name: 'Õmblemine', icon: '🪡' },
                                { key: 'medicine', name: 'Meditsiin', icon: '🏥' },
                                { key: 'printing', name: '3D Printimine - Esmalt osta kinnisvara (tulekul)', icon: '🔒' },
                                { key: 'lasercutting', name: 'Laserilõikus - Esmalt osta kinnisvara (tulekul)', icon: '🔒' }
                            ]}
                        />

                        <TrainingMilestones currentLevel={playerStats.level} />

                        <ActivitySelector
                            activities={handicraftActivities}
                            selectedActivity={selectedHandicraftActivity}
                            onActivitySelect={setSelectedHandicraftActivity}
                            onTrain={handleTrain}
                            isTraining={isHandicraftTraining}
                            canTrain={(playerStats.handicraftTrainingData?.remainingClicks || 0) > 0}
                            playerStats={playerStats}
                            trainingType="handicraft"
                        />

                        <CraftingInventory
                            inventory={playerStats.inventory || []}
                            onSellItem={handleSellItem}
                        />

                        <HandicraftBoosters
                            boosters={handicraftBoosters}
                            currentClicks={playerStats.handicraftTrainingData?.remainingClicks || 0}
                            maxClicks={getVipAwareMaxClicks(playerStats)}
                            onBoosterUsed={handleBoosterUsed}
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default TrainingPage;