// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ProfileAttributes } from '../components/profile/ProfileAttributes';
import { ProfileSkills } from '../components/profile/ProfileSkills';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats } from '../types';
import { initializeAttributes } from '../services/TrainingService';
import '../styles/pages/Profile.css';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);
        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;
                setPlayerStats(stats);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error loading player stats:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="profile-container">
                    <div className="loading">Laadin...</div>
                </main>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="profile-container">
                    <div className="error">Viga andmete laadimisel</div>
                </main>
            </div>
        );
    }

    const attributes = playerStats.attributes || initializeAttributes();
    const abilities = playerStats.abilities || [];

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="profile-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="profile-title">Minu Profiil</h1>

                <ProfileAttributes attributes={attributes} />
                <ProfileSkills abilities={abilities} />
            </main>
        </div>
    );
};

export default ProfilePage;