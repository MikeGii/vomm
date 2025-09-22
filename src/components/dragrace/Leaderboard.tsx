// src/components/dragrace/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { DragRaceLeaderboardService } from '../../services/DragRaceLeaderboardService';
import { LeaderboardData, DRAG_RACE_TRACKS } from '../../types/dragRace';
import { DragRacePhysics } from '../../utils/dragRacePhysics';
import '../../styles/components/dragrace/Leaderboard.css';

interface LeaderboardProps {
    currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
    const [selectedTrackId, setSelectedTrackId] = useState<string>('half_mile');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Load leaderboard data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const track = DRAG_RACE_TRACKS.find(t => t.id === selectedTrackId);
                if (!track) return;

                const data = await DragRaceLeaderboardService.getLeaderboard(
                    selectedTrackId,
                    track.distance,
                    currentPage,
                    currentUserId
                );
                setLeaderboardData(data);
            } catch (error) {
                console.error('Error loading leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedTrackId, currentPage, currentUserId]);

    // Handle track change
    const handleTrackChange = (trackId: string) => {
        setSelectedTrackId(trackId);
        setCurrentPage(1);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="dr-leaderboard">
            {/* Track Selector */}
            <div className="dr-track-selector">
                <h2>Edetabel</h2>
                <div className="dr-track-buttons">
                    {DRAG_RACE_TRACKS.map(track => (
                        <button
                            key={track.id}
                            className={`dr-track-btn ${selectedTrackId === track.id ? 'active' : ''}`}
                            onClick={() => handleTrackChange(track.id)}
                        >
                            {track.icon} {track.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="dr-loading">
                    Laaditakse edetabelit...
                </div>
            )}

            {/* Leaderboard Table */}
            {!loading && leaderboardData && (
                <div className="dr-leaderboard-content">
                    <div className="dr-leaderboard-info">
                        <span>Kokku mängijaid: {leaderboardData.totalPlayers}</span>
                        <span>Viimati uuendatud: {leaderboardData.lastUpdated.toLocaleTimeString()}</span>
                    </div>

                    <div className="dr-leaderboard-table">
                        <div className="dr-table-header">
                            <span>Koht</span>
                            <span>Mängija</span>
                            <span>Auto</span>
                            <span>Aeg</span>
                            <span>Kuupäev</span>
                        </div>

                        {leaderboardData.entries.map((entry, index) => (
                            <div
                                key={`${entry.userId}_${entry.rank}`}
                                className={`dr-table-row ${entry.isCurrentPlayer ? 'current-player' : ''} ${index < 3 ? `rank-${index + 1}` : ''}`}
                            >
                                <span className="dr-rank">
                                    {entry.rank <= 3 ? (
                                        <span className="dr-medal">
                                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                                        </span>
                                    ) : (
                                        entry.rank
                                    )}
                                </span>
                                <span className="dr-player">{entry.playerName}</span>
                                <span className="dr-car">{entry.carBrand} {entry.carModel}</span>
                                <span className="dr-time">{DragRacePhysics.formatTime(entry.time)}</span>
                                <span className="dr-date">{entry.completedAt.toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>

                    {/* Player's Rank (if not in top results) */}
                    {leaderboardData.playerRank && leaderboardData.playerRank > 15 && (
                        <div className="dr-player-rank">
                            Teie koht: {leaderboardData.playerRank}
                        </div>
                    )}

                    {/* Pagination */}
                    {leaderboardData.totalPages > 1 && (
                        <div className="dr-pagination">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Eelmine
                            </button>

                            <span>Lehekülg {currentPage} / {leaderboardData.totalPages}</span>

                            <button
                                disabled={currentPage === leaderboardData.totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                Järgmine
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!loading && leaderboardData && leaderboardData.entries.length === 0 && (
                <div className="dr-empty-leaderboard">
                    <h3>Edetabel on tühi</h3>
                    <p>Sõitke esimese aja sisse!</p>
                </div>
            )}
        </div>
    );
};