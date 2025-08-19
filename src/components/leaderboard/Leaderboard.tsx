// src/components/leaderboard/Leaderboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { PlayerProfileModal } from './PlayerProfileModal';
import { getLeaderboard } from '../../services/LeaderboardService';
import { getPlayerProfileData } from '../../services/PlayerProfileService';
import { LeaderboardEntry, PlayerProfileModalData } from '../../types';
import '../../styles/components/leaderboard/Leaderboard.css';

interface LeaderboardProps {
    currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileModalData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    const loadLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getLeaderboard('level');
            setEntries(data);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
            setError('Edetabeli laadimine ebaõnnestus');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    const handlePlayerClick = async (playerData: PlayerProfileModalData) => {
        setIsLoadingProfile(true);

        try {
            // Fetch complete player profile data including creation date
            const completeProfile = await getPlayerProfileData(playerData.userId);

            if (completeProfile) {
                setSelectedPlayer(completeProfile);
                setIsModalOpen(true);
            } else {
                // Fallback to basic data if fetch fails
                setSelectedPlayer(playerData);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error loading player profile:', error);
            // Use basic data as fallback
            setSelectedPlayer(playerData);
            setIsModalOpen(true);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlayer(null);
    };

    return (
        <>
            <div className="leaderboard-container">
                <h3 className="leaderboard-title">Edetabel</h3>

                {loading && (
                    <div className="leaderboard-loading">
                        <p>Laadin edetabelit...</p>
                    </div>
                )}

                {error && (
                    <div className="leaderboard-error">
                        <p>{error}</p>
                        <button onClick={loadLeaderboard}>Proovi uuesti</button>
                    </div>
                )}

                {!loading && !error && (
                    <LeaderboardTable
                        entries={entries}
                        currentUserId={currentUserId}
                        onPlayerClick={handlePlayerClick}
                    />
                )}

                {isLoadingProfile && (
                    <div className="profile-loading-overlay">
                        <div className="loading">Laadin profiili...</div>
                    </div>
                )}
            </div>

            <PlayerProfileModal
                isOpen={isModalOpen}
                playerData={selectedPlayer}
                onClose={handleCloseModal}
            />
        </>
    );
};
