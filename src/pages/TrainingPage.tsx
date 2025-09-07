// src/pages/TrainingPage.tsx - CORRECTED VERSION
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {updateDoc, doc} from 'firebase/firestore';
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
import { useEstate } from '../contexts/EstateContext';
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
    initializeHandicraftTrainingData, performTraining5x
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
    const { canUse3DPrinter, canUseLaserCutter, playerEstate } = useEstate();

    // Consolidated training states
    const [trainingStates, setTrainingStates] = useState({
        sports: { isTraining: false, selectedActivity: '' },
        food: { isTraining: false, selectedActivity: '' },
        handcraft: { isTraining: false, selectedActivity: '' }
    });

    const [activeTab, setActiveTab] = useState<string>('sports');
    const [initializationDone, setInitializationDone] = useState(false);
    const clicksCheckedRef = useRef(false);

    // Fixed memoized calculations with proper dependencies
    const maxClicks = useMemo(() => getVipAwareMaxClicks(playerStats), [playerStats]);

    const remainingClicks = useMemo(() => {
        if (!playerStats) return 0;

        switch (activeTab) {
            case 'sports': return playerStats.trainingData?.remainingClicks || 0;
            case 'food': return playerStats.kitchenLabTrainingData?.remainingClicks || 0;
            case 'handcraft': return playerStats.handicraftTrainingData?.remainingClicks || 0;
            default: return 0;
        }
    }, [playerStats, activeTab]);

    // Fixed memoized activities with proper dependencies
    const availableActivities = useMemo(() =>
            playerStats ? getAvailableActivities(playerStats.level) : [],
        [playerStats]
    );

    const kitchenLabActivities = useMemo(() =>
            playerStats ? getAvailableKitchenLabActivities(playerStats.level) : [],
        [playerStats]
    );

    const handicraftActivities = useMemo(() =>
            playerStats ? getAvailableHandicraftActivities(playerStats.level) : [],
        [playerStats]
    );

    const currentBoosters = useMemo(() => {
        if (!playerStats?.inventory) return [];

        switch (activeTab) {
            case 'sports': return getTrainingBoosters(playerStats.inventory);
            case 'food': return getKitchenBoosters(playerStats.inventory);
            case 'handcraft': return getHandicraftBoosters(playerStats.inventory);
            default: return [];
        }
    }, [playerStats, activeTab]);

    const tabs = [
        { id: 'sports', label: 'Sporditreening' },
        { id: 'food', label: 'Köök & Labor' },
        { id: 'handcraft', label: 'Käsitöö' }
    ];

    // Validation helper - moved outside useCallback to avoid dependency issues
    const validateTrainingState = useCallback((): { isValid: boolean; error?: string } => {
        if (!currentUser) return { isValid: false, error: 'Kasutaja ei ole sisse logitud' };
        if (!playerStats) return { isValid: false, error: 'Mängija andmed puuduvad' };
        if (trainingStates[activeTab as keyof typeof trainingStates].isTraining) {
            return { isValid: false, error: 'Treening juba käib' };
        }

        return { isValid: true };
    }, [currentUser, playerStats, trainingStates, activeTab]);

    // Simplified state setters
    const setActiveTrainingState = useCallback((isTraining: boolean) => {
        setTrainingStates(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab as keyof typeof prev], isTraining }
        }));
    }, [activeTab]);

    const setSelectedActivityForTab = useCallback((activityId: string) => {
        setTrainingStates(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab as keyof typeof prev], selectedActivity: activityId }
        }));
    }, [activeTab]);

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

        return () => {
            abortController.abort();
        };
    }, [playerStats, currentUser]);

    // Reset flag when user changes
    useEffect(() => {
        clicksCheckedRef.current = false;
    }, [currentUser]);

    // Fixed training handler with proper dependencies
    const handleTrain = useCallback(async () => {
        const validation = validateTrainingState();
        if (!validation.isValid) {
            if (validation.error) {
                showToast(validation.error, 'error');
            }
            return;
        }

        // Check clicks based on active tab
        if (remainingClicks <= 0) {
            showToast('Treeningkordi pole enam järel! Oota järgmist täistundi.', 'warning');
            return;
        }

        const currentTrainingState = trainingStates[activeTab as keyof typeof trainingStates];
        let activity: TrainingActivity | null = null;

        // Determine which activity to use
        if (activeTab === 'sports') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt treeningtegevus!', 'warning');
                return;
            }
            activity = getActivityById(currentTrainingState.selectedActivity) || null;
        } else if (activeTab === 'food') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt köök & labor tegevus!', 'warning');
                return;
            }
            activity = getKitchenLabActivityById(currentTrainingState.selectedActivity) || null;
        } else if (activeTab === 'handcraft') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt käsitöö tegevus!', 'warning');
                return;
            }
            activity = getHandicraftActivityById(currentTrainingState.selectedActivity) || null;
        }

        if (!activity) {
            showToast('Tegevust ei leitud!', 'error');
            return;
        }

        setActiveTrainingState(true);

        try {
            const trainingType = activeTab === 'sports' ? 'sports' :
                activeTab === 'food' ? 'kitchen-lab' : 'handicraft';

            const result = await performTraining(currentUser!.uid, currentTrainingState.selectedActivity, activity.rewards, trainingType);
            await refreshStats();

// Enhanced feedback based on actual result
            if (activeTab === 'handcraft' && result.craftingResult && (activity.rewards.printing || activity.rewards.lasercutting)) {
                if (!result.craftingResult.itemsProduced) {
                    showToast('Käsitöö ebaõnnestus - materjalid kulutatud, kuid esemeid ei saadud.', 'warning');
                }
            }

        } catch (error: any) {
            console.error('Training error:', error);
            showToast(error.message || 'Treenimine ebaõnnestus', 'error');
        } finally {
            setActiveTrainingState(false);
        }
    }, [
        currentUser,
        activeTab,
        trainingStates,
        remainingClicks,
        refreshStats,
        showToast,
        validateTrainingState,
        setActiveTrainingState
    ]);

    const handleTrain5x = useCallback(async () => {
        const validation = validateTrainingState();
        if (!validation.isValid) {
            if (validation.error) {
                showToast(validation.error, 'error');
            }
            return;
        }

        // Check we have at least 5 clicks
        if (remainingClicks < 5) {
            showToast(`Vajad vähemalt 5 treeningut, sul on ${remainingClicks}`, 'warning');
            return;
        }

        const currentTrainingState = trainingStates[activeTab as keyof typeof trainingStates];
        let activity: TrainingActivity | null = null;

        // Determine which activity to use (same logic as handleTrain)
        if (activeTab === 'sports') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt treeningtegevus!', 'warning');
                return;
            }
            activity = getActivityById(currentTrainingState.selectedActivity) || null;
        } else if (activeTab === 'food') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt köök & labor tegevus!', 'warning');
                return;
            }
            activity = getKitchenLabActivityById(currentTrainingState.selectedActivity) || null;
        } else if (activeTab === 'handcraft') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt käsitöö tegevus!', 'warning');
                return;
            }
            activity = getHandicraftActivityById(currentTrainingState.selectedActivity) || null;
        }

        if (!activity) {
            showToast('Tegevust ei leitud!', 'error');
            return;
        }

        setActiveTrainingState(true);

        try {
            const trainingType = activeTab === 'sports' ? 'sports' :
                activeTab === 'food' ? 'kitchen-lab' : 'handicraft';

            // Perform 5 individual trainings in sequence
            const result = await performTraining5x(currentUser!.uid, currentTrainingState.selectedActivity, activity.rewards, trainingType);

            await refreshStats();

            // Show enhanced feedback for handicraft activities
            if (activeTab === 'handcraft' && result.craftingSummary && result.craftingSummary.isWorkshopActivity) {
                const { successful, failed, activityName } = result.craftingSummary;
                showToast(`5x ${activityName}: ${successful} õnnestus, ${failed} ebaõnnestus`, 'success');
            } else {
                showToast(`5x ${activity.name} lõpetatud!`, 'success');
            }

        } catch (error: any) {
            console.error('5x Training error:', error);
            showToast(error.message || '5x treenimine ebaõnnestus', 'error');
        } finally {
            setActiveTrainingState(false);
        }
    }, [
        currentUser,
        activeTab,
        trainingStates,
        remainingClicks,
        refreshStats,
        showToast,
        validateTrainingState,
        setActiveTrainingState
    ]);

    const handleTrainCustom = useCallback(async (amount: number) => {
        const validation = validateTrainingState();
        if (!validation.isValid) {
            if (validation.error) {
                showToast(validation.error, 'error');
            }
            return;
        }

        if (amount < 1 || amount > remainingClicks) {
            showToast(`Vigane kogus: ${amount}`, 'warning');
            return;
        }

        const currentTrainingState = trainingStates[activeTab as keyof typeof trainingStates];
        let activity: TrainingActivity | null = null;

        // Same activity selection logic as other handlers
        if (activeTab === 'sports') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt treeningtegevus!', 'warning');
                return;
            }
            activity = getActivityById(currentTrainingState.selectedActivity) || null;
        } else if (activeTab === 'food') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt köök & labor tegevus!', 'warning');
                return;
            }
            activity = getKitchenLabActivityById(currentTrainingState.selectedActivity) || null;
        } else if (activeTab === 'handcraft') {
            if (!currentTrainingState.selectedActivity) {
                showToast('Vali esmalt käsitöö tegevus!', 'warning');
                return;
            }
            activity = getHandicraftActivityById(currentTrainingState.selectedActivity) || null;
        }

        if (!activity) {
            showToast('Tegevust ei leitud!', 'error');
            return;
        }

        setActiveTrainingState(true);

        try {
            const trainingType = activeTab === 'sports' ? 'sports' :
                activeTab === 'food' ? 'kitchen-lab' : 'handicraft';

            // Perform custom amount of trainings
            for (let i = 0; i < amount; i++) {
                await performTraining(currentUser!.uid, currentTrainingState.selectedActivity, activity.rewards, trainingType);
            }

            await refreshStats();
            showToast(`${amount}x ${activity.name} lõpetatud!`, 'success');

        } catch (error: any) {
            console.error(`${amount}x Training error:`, error);
            showToast(error.message || `${amount}x treenimine ebaõnnestus`, 'error');
        } finally {
            setActiveTrainingState(false);
        }
    }, [
        currentUser,
        activeTab,
        trainingStates,
        remainingClicks,
        refreshStats,
        showToast,
        validateTrainingState,
        setActiveTrainingState
    ]);

    // Handle selling crafted items
    const handleSellItem = useCallback(async (itemId: string, quantity: number) => {
        if (!currentUser) {
            showToast('Kasutaja ei ole sisse logitud', 'error');
            return;
        }

        try {
            const result = await sellCraftedItem(currentUser.uid, itemId, quantity);

            if (result.success) {
                showToast(result.message, 'success');
                await refreshStats();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'Müük ebaõnnestus', 'error');
        }
    }, [currentUser, refreshStats, showToast]);

    // Handle booster used
    const handleBoosterUsed = useCallback(async () => {
        try {
            await refreshStats();
            showToast('Booster kasutatud!', 'success');
        } catch (error) {
            console.error('Error refreshing after booster use:', error);
            showToast('Viga boosteri kasutamisel', 'error');
        }
    }, [refreshStats, showToast]);

    // Workshop status component
    const WorkshopStatus: React.FC = useCallback(() => {
        if (activeTab !== 'handcraft') return null;

        const getPrinterSuccessRate = (): number => {
            const rate = playerEstate?.equippedDeviceDetails?.printer?.workshopStats?.successRate;
            return rate || 0;
        };

        const getLaserSuccessRate = (): number => {
            const rate = playerEstate?.equippedDeviceDetails?.laserCutter?.workshopStats?.successRate;
            return rate || 0;
        };

        return (
            <div className="workshop-status">
                <h3>Töökoja seadmed:</h3>
                <div className="workshop-devices-status">
                    <div className={`device-status ${canUse3DPrinter() ? 'available' : 'unavailable'}`}>
                        {canUse3DPrinter()
                            ? `🖨️ 3D Printer: Saadaval (${getPrinterSuccessRate()}% õnnestumismäär)`
                            : '🔒 3D Printer: Pole paigaldatud'
                        }
                    </div>
                    <div className={`device-status ${canUseLaserCutter() ? 'available' : 'unavailable'}`}>
                        {canUseLaserCutter()
                            ? `⚡ Laserlõikur: Saadaval (${getLaserSuccessRate()}% õnnestumismäär)`
                            : '🔒 Laserlõikur: Pole paigaldatud'
                        }
                    </div>
                </div>
            </div>
        );
    }, [activeTab, canUse3DPrinter, canUseLaserCutter, playerEstate]);

    // One-time initialization effect
    useEffect(() => {
        if (!currentUser || !playerStats || initializationDone) return;

        const initializeIfNeeded = async () => {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            let needsUpdate = false;
            const updates: any = {};

            if (!playerStats.attributes) {
                updates.attributes = initializeAttributes();
                needsUpdate = true;
            } else {
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

    // Update clicks when needed
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

        return () => {
            abortController.abort();
        };
    }, [playerStats, currentUser]);

    // Reset flag when user changes
    useEffect(() => {
        clicksCheckedRef.current = false;
    }, [currentUser]);

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

    const currentTrainingState = trainingStates[activeTab as keyof typeof trainingStates];

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
                            remainingClicks={remainingClicks}
                            maxClicks={maxClicks}
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
                            selectedActivity={currentTrainingState.selectedActivity}
                            onActivitySelect={setSelectedActivityForTab}
                            onTrain={handleTrain}
                            onTrain5x={handleTrain5x}
                            isTraining={currentTrainingState.isTraining}
                            onTrainCustom={handleTrainCustom}
                            onRefreshStats={refreshStats}
                            playerStats={playerStats}
                            trainingType="sports"
                        />

                        <TrainingBoosters
                            boosters={currentBoosters as InventoryItem[]}
                            currentClicks={remainingClicks}
                            maxClicks={maxClicks}
                            onBoosterUsed={handleBoosterUsed}
                        />
                    </>
                )}

                {/* Kitchen & Lab Tab */}
                {activeTab === 'food' && (
                    <>
                        <TrainingCounter
                            remainingClicks={remainingClicks}
                            maxClicks={maxClicks}
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
                            selectedActivity={currentTrainingState.selectedActivity}
                            onActivitySelect={setSelectedActivityForTab}
                            onTrain={handleTrain}
                            onTrain5x={handleTrain5x}
                            onTrainCustom={handleTrainCustom}
                            onRefreshStats={refreshStats}
                            isTraining={currentTrainingState.isTraining}
                            playerStats={playerStats}
                            trainingType="kitchen-lab"
                        />

                        <CraftingInventory
                            inventory={playerStats.inventory || []}
                            onSellItem={handleSellItem}
                        />

                        <KitchenBoosters
                            boosters={currentBoosters as InventoryItem[]}
                            currentClicks={remainingClicks}
                            maxClicks={maxClicks}
                            onBoosterUsed={handleBoosterUsed}
                        />
                    </>
                )}

                {/* Handcraft Tab */}
                {activeTab === 'handcraft' && (
                    <>
                        <TrainingCounter
                            remainingClicks={remainingClicks}
                            maxClicks={maxClicks}
                            label="Käsitöö klikke jäänud"
                            lastResetTime={playerStats.handicraftTrainingData?.lastResetTime}
                        />

                        <WorkshopStatus />

                        <AttributesDisplay
                            attributes={playerStats.attributes || initializeAttributes()}
                            title="Sinu käsitöö oskused"
                            displayAttributes={[
                                { key: 'sewing', name: 'Õmblemine', icon: '🪡' },
                                { key: 'medicine', name: 'Meditsiin', icon: '🏥' },
                                {
                                    key: 'printing',
                                    name: canUse3DPrinter() ? '3D Printimine' : '3D Printimine - Vajab seadet',
                                    icon: canUse3DPrinter() ? '🖨️' : '🔒'
                                },
                                {
                                    key: 'lasercutting',
                                    name: canUseLaserCutter() ? 'Laserlõikus' : 'Laserlõikus - Vajab seadet',
                                    icon: canUseLaserCutter() ? '✂️' : '🔒'
                                }
                            ]}
                        />

                        <TrainingMilestones currentLevel={playerStats.level} />

                        <ActivitySelector
                            activities={handicraftActivities}
                            selectedActivity={currentTrainingState.selectedActivity}
                            onActivitySelect={setSelectedActivityForTab}
                            onTrain={handleTrain}
                            onTrain5x={handleTrain5x}
                            onTrainCustom={handleTrainCustom}
                            isTraining={currentTrainingState.isTraining}
                            onRefreshStats={refreshStats}
                            playerStats={playerStats}
                            trainingType="handicraft"
                        />

                        <CraftingInventory
                            inventory={playerStats.inventory || []}
                            onSellItem={handleSellItem}
                        />

                        <HandicraftBoosters
                            boosters={currentBoosters as InventoryItem[]}
                            currentClicks={remainingClicks}
                            maxClicks={maxClicks}
                            onBoosterUsed={handleBoosterUsed}
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default TrainingPage;