// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PlayerStatsCard } from '../components/dashboard/PlayerStatsCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats } from '../types';
import { initializePlayerStats, hireAsPoliceOfficer } from '../services/PlayerService';
import '../styles/pages/Dashboard.css';

const DashboardPage: React.FC = () => {
    const { currentUser, userData } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlayerStats = async () => {
            if (currentUser) {
                try {
                    const stats = await initializePlayerStats(currentUser.uid);
                    setPlayerStats(stats);
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
        } catch (error) {
            console.error('Viga tööle kandideerimisel:', error);
            alert('Kandideerimine ebaõnnestus. Proovi uuesti!');
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
                            onApplyForJob={handleApplyForJob}
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;