// src/pages/FightClubPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats } from '../types';
import { checkFightClubRequirements, getEligiblePlayers, EligiblePlayer } from '../services/FightClubService';
import { FightClubRequirements, FightClubOpponents, FightResultModal } from '../components/fightclub';
import { FightResult } from '../services/FightService';
import '../styles/pages/FightClub.css';

const FightClubPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [eligiblePlayers, setEligiblePlayers] = useState<EligiblePlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [fightResult, setFightResult] = useState<FightResult | null>(null);
    const [showFightModal, setShowFightModal] = useState(false);

    // Listen to player stats
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);
        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;
                setPlayerStats(stats);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Load eligible players when player becomes eligible
    useEffect(() => {
        if (!playerStats || !currentUser) return;

        const requirements = checkFightClubRequirements(playerStats);
        if (requirements.eligible) {
            setLoadingPlayers(true);
            getEligiblePlayers(currentUser.uid)
                .then(players => {
                    setEligiblePlayers(players);
                })
                .catch(error => {
                    console.error('Error loading eligible players:', error);
                })
                .finally(() => {
                    setLoadingPlayers(false);
                });
        }
    }, [playerStats, currentUser]);

    const handleFightComplete = (result: FightResult) => {
        setFightResult(result);
        setShowFightModal(true);
    };

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="page-content">
                    <div className="fight-club-container">
                        <div className="loading">Laadin...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="page-content">
                    <div className="fight-club-container">
                        <div className="error">Viga andmete laadimisel</div>
                    </div>
                </div>
            </div>
        );
    }

    const requirements = checkFightClubRequirements(playerStats);

    return (
        <div className="page">
            <AuthenticatedHeader />
            <div className="page-content">
                <div className="fight-club-container">
                    <button
                        className="back-to-dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Tagasi töölauale
                    </button>

                    <h1 className="fight-club-title">🥊 Võitlusklubi</h1>

                    {!requirements.eligible ? (
                        <FightClubRequirements
                            playerStats={playerStats}
                            onNavigateToTraining={() => navigate('/training')}
                        />
                    ) : (
                        <FightClubOpponents
                            playerStats={playerStats}
                            eligiblePlayers={eligiblePlayers}
                            loadingPlayers={loadingPlayers}
                            onFightComplete={handleFightComplete}
                        />
                    )}

                    <FightResultModal
                        isOpen={showFightModal}
                        fightResult={fightResult}
                        onClose={() => setShowFightModal(false)}
                    />
                </div>
            </div>
        </div>
    );
};

export default FightClubPage;