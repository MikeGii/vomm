// src/pages/TrainingPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { AttributesDisplay } from '../components/training/AttributesDisplay';
import { TrainingCounter } from '../components/training/TrainingCounter';
import { ActivitySelector } from '../components/training/ActivitySelector';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PlayerStats, TrainingActivity } from '../types';
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
    const [showTutorial, setShowTutorial] = useState(false);

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

                // Get available activities based on player level
                const activities = getAvailableActivities(stats.level);
                setAvailableActivities(activities);

                // Check if tutorial should be shown (steps 11-15)
                if (!stats.tutorialProgress.isCompleted &&
                    stats.tutorialProgress.currentStep >= 11 &&
                    stats.tutorialProgress.currentStep <= 15) {
                    setShowTutorial(true);
                }

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

            // If this is during tutorial step 14, progress to step 15
            if (playerStats.tutorialProgress.currentStep === 14) {
                const { updateTutorialProgress } = await import('../services/PlayerService');
                await updateTutorialProgress(currentUser.uid, 15);
            }
        } catch (error: any) {
            alert(error.message || 'Treenimine ebaõnnestus');
        } finally {
            setIsTraining(false);
        }
    }, [currentUser, selectedActivity, isTraining, playerStats]);

    // Handle tutorial complete
    const handleTutorialComplete = useCallback(() => {
        setShowTutorial(false);
    }, []);

    // Handle activity selection
    const handleActivitySelect = (activityId: string) => {
        setSelectedActivity(activityId);

        // If tutorial step 13 and activity selected, progress to step 14
        if (playerStats?.tutorialProgress.currentStep === 13 && activityId && currentUser) {
            import('../services/PlayerService').then(({ updateTutorialProgress }) => {
                updateTutorialProgress(currentUser.uid, 14);
            });
        }
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

                {/* Activity selector */}
                <ActivitySelector
                    activities={availableActivities}
                    selectedActivity={selectedActivity}
                    onActivitySelect={handleActivitySelect}
                    onTrain={handleTrain}
                    isTraining={isTraining}
                    canTrain={(playerStats.trainingData?.remainingClicks || 0) > 0}
                />

                {/* Tutorial overlay */}
                {showTutorial && currentUser && (
                    <TutorialOverlay
                        stats={playerStats}
                        userId={currentUser.uid}
                        onTutorialComplete={handleTutorialComplete}
                        page="training"
                    />
                )}
            </main>
        </div>
    );
};

export default TrainingPage;