// src/pages/TrainingPage.tsx - Updated version
import React, { useState, useEffect, useCallback } from 'react';
import {doc, onSnapshot, updateDoc} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { AttributesDisplay } from '../components/training/AttributesDisplay';
import { TrainingCounter } from '../components/training/TrainingCounter';
import { ActivitySelector } from '../components/training/ActivitySelector';
import { TrainingMilestones} from "../components/training/TrainingMilestones";
import { TrainingBoosters } from '../components/training/TrainingBoosters';
import { getTrainingBoosters } from '../services/TrainingBoosterService';
import { TabNavigation } from '../components/ui/TabNavigation';
import { CraftingInventory} from "../components/training/CraftingInventory";
import { getAvailableKitchenLabActivities, getKitchenLabActivityById } from '../data/kitchenLabActivities';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {PlayerAttributes, PlayerStats, TrainingActivity} from '../types';
import { InventoryItem } from '../types';
import {
    checkAndResetTrainingClicks,
    checkAndResetKitchenLabTrainingClicks,
    performTraining,
    initializeAttributes,
    initializeTrainingData, initializeKitchenLabTrainingData
} from '../services/TrainingService';
import { getAvailableActivities, getActivityById } from '../data/trainingActivities';
import '../styles/pages/Training.css';

const TrainingPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [availableActivities, setAvailableActivities] = useState<TrainingActivity[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [isTraining, setIsTraining] = useState(false);
    const [loading, setLoading] = useState(true);
    const [trainingBoosters, setTrainingBoosters] = useState<InventoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<string>('sports');
    const [kitchenLabActivities, setKitchenLabActivities] = useState<TrainingActivity[]>([]);
    const [selectedKitchenLabActivity, setSelectedKitchenLabActivity] = useState<string>('');
    const [isKitchenLabTraining, setIsKitchenLabTraining] = useState(false);

    const tabs = [
        { id: 'sports', label: 'Sporditreening' },
        { id: 'food', label: 'Köök & Labor' },
        { id: 'handcraft', label: 'Käsitöö' }
    ];

    // Set up real-time listener for player stats
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);

        const unsubscribe = onSnapshot(statsRef, async (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;
                let needsUpdate = false;

                if (!stats.attributes) {
                    stats.attributes = initializeAttributes();
                    needsUpdate = true;
                } else {
                    // Ensure all attributes exist (including new kitchen/lab ones for existing players)
                    const defaultAttributes = initializeAttributes();
                    Object.keys(defaultAttributes).forEach(key => {
                        if (!stats.attributes![key as keyof PlayerAttributes]) {
                            stats.attributes![key as keyof PlayerAttributes] = defaultAttributes[key as keyof PlayerAttributes];
                            needsUpdate = true;
                        }
                    });
                }

                // Initialize training data if it doesn't exist
                if (!stats.trainingData) {
                    stats.trainingData = initializeTrainingData();
                    needsUpdate = true;
                }

                if (!stats.kitchenLabTrainingData) {
                    stats.kitchenLabTrainingData = initializeKitchenLabTrainingData();
                    needsUpdate = true;
                }

                // Update database if new attributes were added
                if (needsUpdate) {
                    try {
                        await updateDoc(statsRef, {
                            attributes: stats.attributes,
                            trainingData: stats.trainingData,
                            kitchenLabTrainingData: stats.kitchenLabTrainingData
                        });
                    } catch (error) {
                        console.error('Error updating player stats:', error);
                    }
                }

                // Check and reset training clicks if needed
                const updatedTrainingData = await checkAndResetTrainingClicks(currentUser.uid);
                stats.trainingData = updatedTrainingData;

                const updatedKitchenLabTrainingData = await checkAndResetKitchenLabTrainingClicks(currentUser.uid);
                stats.kitchenLabTrainingData = updatedKitchenLabTrainingData;

                setPlayerStats(stats);

                // Get training boosters from inventory
                const boosters = getTrainingBoosters(stats.inventory || []);
                setTrainingBoosters(boosters);

                // Get available activities based on player level
                const activities = getAvailableActivities(stats.level);
                setAvailableActivities(activities);

                const kitchenActivities = getAvailableKitchenLabActivities(stats.level);
                setKitchenLabActivities(kitchenActivities);

                setLoading(false);
            }
        }, (error) => {
            console.error('Error listening to player stats:', error);
            setLoading(false);
        });

        return () => unsubscribe();
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
        }

        if (!hasClicks) {
            alert('Treeningkordi pole enam järel! Oota järgmist täistundi.');
            return;
        }

        let activityId = '';
        let activity = null;

        // Determine which activity to use based on active tab
        if (activeTab === 'sports') {
            if (!selectedActivity) return;
            activityId = selectedActivity;
            activity = getActivityById(selectedActivity);
        } else if (activeTab === 'food') {
            if (!selectedKitchenLabActivity) return;
            activityId = selectedKitchenLabActivity;
            activity = getKitchenLabActivityById(selectedKitchenLabActivity);
        }

        if (!activity) return;

        setIsTraining(true);
        if (activeTab === 'food') {
            setIsKitchenLabTraining(true);
        }

        try {
            const trainingType = activeTab === 'sports' ? 'sports' : 'kitchen-lab';
            await performTraining(currentUser.uid, activityId, activity.rewards, trainingType);
        } catch (error: any) {
            alert(error.message || 'Treenimine ebaõnnestus');
        } finally {
            setIsTraining(false);
            if (activeTab === 'food') {
                setIsKitchenLabTraining(false);
            }
        }
    }, [currentUser, selectedActivity, selectedKitchenLabActivity, activeTab, isTraining, playerStats]);

    // Handle activity selection
    const handleActivitySelect = (activityId: string) => {
        setSelectedActivity(activityId);

    };

    // Handle booster used callback
    const handleBoosterUsed = () => {
    };

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="training-container">
                    <div className="loading">Laadin...</div>
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

                {/* NEW: Tab Navigation */}
                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Show existing training content only when sports tab is active */}
                {activeTab === 'sports' && (
                    <>
                        <TrainingCounter
                            remainingClicks={playerStats.trainingData?.remainingClicks || 0}
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

                        <TrainingMilestones
                            currentLevel={playerStats.level}
                        />

                        <ActivitySelector
                            activities={availableActivities}
                            selectedActivity={selectedActivity}
                            onActivitySelect={handleActivitySelect}
                            onTrain={handleTrain}
                            isTraining={isTraining}
                            canTrain={(playerStats.trainingData?.remainingClicks || 0) > 0}
                            playerStats={playerStats}
                            trainingType="sports"
                        />

                        <TrainingBoosters
                            boosters={trainingBoosters}
                            currentClicks={playerStats.trainingData?.remainingClicks || 0}
                            maxClicks={playerStats.activeWork ? 100 : 50}
                            onBoosterUsed={handleBoosterUsed}
                        />
                    </>
                )}

                {/* Placeholder content for other tabs */}
                {activeTab === 'food' && (
                    <>
                        {/* Reuse existing TrainingCounter */}
                        <TrainingCounter
                            remainingClicks={playerStats.kitchenLabTrainingData?.remainingClicks || 0}
                            label="Köök & Labor klikke jäänud"
                            lastResetTime={playerStats.kitchenLabTrainingData?.lastResetTime}
                        />

                        {/* Kitchen/Lab Attributes Display */}
                        <AttributesDisplay
                            attributes={playerStats.attributes || initializeAttributes()}
                            title="Sinu köök & labor oskused"
                            displayAttributes={[
                                { key: 'cooking', name: 'Toidu valmistamine', icon: '🍳' },
                                { key: 'brewing', name: 'Joogi valmistamine', icon: '🥤' },
                                { key: 'chemistry', name: 'Keemia valmistamine', icon: '🧪' }
                            ]}
                        />

                        {/* Kitchen/Lab Milestones */}
                        <TrainingMilestones
                            currentLevel={playerStats.level}
                        />

                        {/* Kitchen/Lab Activity Selector */}
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
                        />

                    </>
                )}

                {activeTab === 'handcraft' && (
                    <div className="tab-placeholder">
                        <h2>Käsitöö</h2>
                        <p>See sektsioon on veel arendamisel...</p>
                    </div>
                )}

            </main>
        </div>
    );
};

export default TrainingPage;