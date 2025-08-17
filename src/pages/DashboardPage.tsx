// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PlayerStatsCard } from '../components/dashboard/PlayerStatsCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PlayerStats } from '../types';
import { initializePlayerStats, getPlayerStats } from '../services/PlayerService';
import { PrefectureSelectionModal } from '../components/dashboard/PrefectureSelectionModal';
import { Leaderboard} from "../components/leaderboard/Leaderboard";
import { checkForPendingEvent } from '../services/EventService';
import { HealthRecoveryManager} from "../components/dashboard/HealthRecoveryManager";
import { checkAndApplyHealthRecovery } from '../services/HealthService';
import { checkCourseCompletion } from '../services/CourseService';

import '../styles/pages/Dashboard.css';
import {PlayerAbilities} from "../components/dashboard/PlayerAbilities";

function DashboardPage() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();  // ADD THIS
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showPrefectureSelection, setShowPrefectureSelection] = useState(false);

    useEffect(() => {
        const loadPlayerStats = async () => {
            if (currentUser) {
                try {
                    // First check and apply health recovery (works offline)
                    try {
                        const recoveryResult = await checkAndApplyHealthRecovery(currentUser.uid);
                        if (recoveryResult.recovered && recoveryResult.amountRecovered > 0) {
                            showToast(`Tervis taastus +${recoveryResult.amountRecovered} HP`, 'success');
                        }
                    } catch (error) {
                        console.error('Error checking health recovery:', error);
                    }

                    // Check course completion
                    try {
                        const courseCompleted = await checkCourseCompletion(currentUser.uid);
                        if (courseCompleted) {
                            showToast('Koolitus lõpetatud!', 'success');
                        }
                    } catch (error) {
                        console.error('Error checking course completion:', error);
                    }

                    // Now load the updated stats
                    const stats = await initializePlayerStats(currentUser.uid);
                    setPlayerStats(stats);

                    // Check for pending events (work completed while offline)
                    const hasPendingEvent = await checkForPendingEvent(currentUser.uid);
                    if (hasPendingEvent) {
                        // Redirect to patrol page to handle event
                        navigate('/patrol');
                        return;
                    }

                    // Check if tutorial should be shown - update condition to include steps 9-10
                    if (!stats.tutorialProgress.isCompleted &&
                        (stats.tutorialProgress.currentStep < 4 ||
                            (stats.tutorialProgress.currentStep >= 9 && stats.tutorialProgress.currentStep <= 10) ||
                            stats.tutorialProgress.currentStep === 16)) {
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
    }, [currentUser, navigate, showToast]);  // ADD showToast to dependencies

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
            <HealthRecoveryManager />
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

                        <Leaderboard
                            currentUserId={currentUser?.uid}
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