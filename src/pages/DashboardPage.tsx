// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PlayerStatsCard } from '../components/dashboard/PlayerStatsCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats } from '../types';
import { initializePlayerStats, getPlayerStats } from '../services/PlayerService';
import { PrefectureSelectionModal } from '../components/dashboard/PrefectureSelectionModal';

import '../styles/pages/Dashboard.css';
import {PlayerAbilities} from "../components/dashboard/PlayerAbilities";

function DashboardPage() {
    const { currentUser, userData } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showPrefectureSelection, setShowPrefectureSelection] = useState(false);

    useEffect(() => {
        const loadPlayerStats = async () => {
            if (currentUser) {
                try {
                    const stats = await initializePlayerStats(currentUser.uid);
                    setPlayerStats(stats);

                    // Check if tutorial should be shown - update condition to include steps 9-10
                    if (!stats.tutorialProgress.isCompleted &&
                        (stats.tutorialProgress.currentStep < 4 ||
                            (stats.tutorialProgress.currentStep >= 9 && stats.tutorialProgress.currentStep <= 10) ||
                            stats.tutorialProgress.currentStep === 16)) {  // Add this condition
                        setShowTutorial(true);
                    }

                    // Check if prefecture selection is needed (after basic training)
                    if (stats.hasCompletedTraining && !stats.prefecture) {
                        setShowPrefectureSelection(true);
                    }
                } catch (error) {
                    console.error('Viga mängija andmete laadimisel:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadPlayerStats();
    }, [currentUser]);

    // Add handler for prefecture selection complete
    const handlePrefectureComplete = async () => {
        setShowPrefectureSelection(false);
        // Reload stats
        if (currentUser) {
            const updatedStats = await getPlayerStats(currentUser.uid);
            if (updatedStats) {
                setPlayerStats(updatedStats);
            }
        }
    };

    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        // Reload stats to reflect tutorial completion
        if (currentUser) {
            const updatedStats = await getPlayerStats(currentUser.uid);
            if (updatedStats) {
                setPlayerStats(updatedStats);
            }
        }
    };

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="dashboard-container">
                    <div className="loading">Laadin...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="dashboard-container">
                {playerStats && userData && (
                    <>
                        <PlayerStatsCard
                            stats={playerStats}
                            username={userData.username}
                        />
                        <QuickActions
                            stats={playerStats}
                        />
                        <PlayerAbilities
                            stats={playerStats}
                        />

                        {showTutorial && currentUser && (
                            <TutorialOverlay
                                stats={playerStats}
                                userId={currentUser.uid}
                                onTutorialComplete={handleTutorialComplete}
                            />
                        )}

                        {showPrefectureSelection && currentUser && (
                            <PrefectureSelectionModal
                                isOpen={showPrefectureSelection}
                                userId={currentUser.uid}
                                onComplete={handlePrefectureComplete}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default DashboardPage;