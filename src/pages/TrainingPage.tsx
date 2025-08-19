// src/pages/TrainingPage.tsx - Updated version
import React, { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { AttributesDisplay } from '../components/training/AttributesDisplay';
import { TrainingCounter } from '../components/training/TrainingCounter';
import { ActivitySelector } from '../components/training/ActivitySelector';
import { TrainingMilestones} from "../components/training/TrainingMilestones";
import { TrainingBoosters } from '../components/training/TrainingBoosters';
import { getTrainingBoosters } from '../services/TrainingBoosterService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PlayerStats, TrainingActivity } from '../types';
import { InventoryItem } from '../types';
import {
    checkAndResetTrainingClicks,
    performTraining,
    initializeAttributes,
    initializeTrainingData
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

    // Set up real-time listener for player stats
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);

        const unsubscribe = onSnapshot(statsRef, async (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;

                // Initialize attributes if they don't exist
                if (!stats.attributes) {
                    stats.attributes = initializeAttributes();
                }
                if (!stats.trainingData) {
                    stats.trainingData = initializeTrainingData();
                }

                // Check and reset training clicks if needed
                const updatedTrainingData = await checkAndResetTrainingClicks(currentUser.uid);
                stats.trainingData = updatedTrainingData;

                setPlayerStats(stats);

                // Get training boosters from inventory
                const boosters = getTrainingBoosters(stats.inventory || []);
                setTrainingBoosters(boosters);

                // Get available activities based on player level
                const activities = getAvailableActivities(stats.level);
                setAvailableActivities(activities);

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
        if (!currentUser || !selectedActivity || isTraining || !playerStats) return;

        if (!playerStats.trainingData || playerStats.trainingData.remainingClicks <= 0) {
            alert('Treeningkordi pole enam järel! Oota järgmist täistundi.');
            return;
        }

        const activity = getActivityById(selectedActivity);
        if (!activity) return;

        setIsTraining(true);
        try {
            await performTraining(currentUser.uid, selectedActivity, activity.rewards);

        } catch (error: any) {
            alert(error.message || 'Treenimine ebaõnnestus');
        } finally {
            setIsTraining(false);
        }
    }, [currentUser, selectedActivity, isTraining, playerStats]);

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

                {/* Training clicks counter */}
                <TrainingCounter
                    remainingClicks={playerStats.trainingData?.remainingClicks || 0}
                />

                {/* Attributes display */}
                <AttributesDisplay
                    attributes={playerStats.attributes || initializeAttributes()}
                />

                {/* Training milestones */}
                <TrainingMilestones
                    currentLevel={playerStats.level}
                />

                {/* Activity selector */}
                <ActivitySelector
                    activities={availableActivities}
                    selectedActivity={selectedActivity}
                    onActivitySelect={handleActivitySelect}
                    onTrain={handleTrain}
                    isTraining={isTraining}
                    canTrain={(playerStats.trainingData?.remainingClicks || 0) > 0}
                    playerStats={playerStats}
                />

                {/* Training boosters - NEW COMPONENT */}
                <TrainingBoosters
                    boosters={trainingBoosters}
                    currentClicks={playerStats.trainingData?.remainingClicks || 0}
                    maxClicks={playerStats.activeWork ? 10 : 50}
                    onBoosterUsed={handleBoosterUsed}
                />

            </main>
        </div>
    );
};

export default TrainingPage;