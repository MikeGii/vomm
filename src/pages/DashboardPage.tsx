// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PlayerStatsCard } from '../components/dashboard/PlayerStatsCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats } from '../types';
import { initializePlayerStats, getPlayerStats, hireAsPoliceOfficer } from '../services/PlayerService';
import '../styles/pages/Dashboard.css';

function DashboardPage() {
    const { currentUser, userData } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const loadPlayerStats = async () => {
            if (currentUser) {
                try {
                    const stats = await initializePlayerStats(currentUser.uid);
                    setPlayerStats(stats);

                    // Check if tutorial should be shown
                    if (!stats.tutorialProgress.isCompleted) {
                        setShowTutorial(true);
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

    const handleApplyForJob = async () => {
        if (!currentUser) return;

        try {
            const updatedStats = await hireAsPoliceOfficer(currentUser.uid);
            setPlayerStats(updatedStats);
            alert('Õnnitleme! Oled nüüd Eesti Politsei liige!');
        } catch (error: any) {
            console.error('Viga tööle kandideerimisel:', error);
            alert(error.message || 'Kandideerimine ebaõnnestus. Proovi uuesti!');
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

                        {showTutorial && currentUser && (
                            <TutorialOverlay
                                stats={playerStats}
                                userId={currentUser.uid}
                                onTutorialComplete={handleTutorialComplete}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default DashboardPage;