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
    const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileModalData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    // Pagination settings
    const entriesPerPage = 10;
    const totalPages = Math.ceil(allEntries.length / entriesPerPage);

    // Calculate current page entries
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = allEntries.slice(indexOfFirstEntry, indexOfLastEntry);

    // Find user's rank position
    const userRank = allEntries.findIndex(entry => entry.userId === currentUserId) + 1;
    const userPage = userRank > 0 ? Math.ceil(userRank / entriesPerPage) : 0;

    const loadLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getLeaderboard('level', 100);
            setAllEntries(data);
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

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        // Scroll to top of leaderboard
        document.querySelector('.leaderboard-container')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const handleGoToMyPosition = () => {
        if (userPage > 0) {
            setCurrentPage(userPage);
        }
    };

    return (
        <>
            <div className="leaderboard-container">
                <div className="leaderboard-header">
                    <h3 className="leaderboard-title">Edetabel</h3>
                    {userRank > 0 && userPage !== currentPage && (
                        <button
                            className="go-to-position-btn"
                            onClick={handleGoToMyPosition}
                        >
                            Minu positsioon (#{userRank})
                        </button>
                    )}
                </div>

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
                    <>
                        <LeaderboardTable
                            entries={currentEntries}
                            currentUserId={currentUserId}
                            onPlayerClick={handlePlayerClick}
                            startingRank={indexOfFirstEntry}
                        />

                        {totalPages > 1 && (
                            <div className="leaderboard-pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    ««
                                </button>
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>

                                <div className="pagination-numbers">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            // Show first, last, current, and adjacent pages
                                            return page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - currentPage) <= 1;
                                        })
                                        .map((page, index, array) => (
                                            <React.Fragment key={page}>
                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                    <span className="pagination-ellipsis">...</span>
                                                )}
                                                <button
                                                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        ))
                                    }
                                </div>

                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    »»
                                </button>
                            </div>
                        )}

                        <div className="leaderboard-info">
                            <span>Näitan {indexOfFirstEntry + 1}-{Math.min(indexOfLastEntry, allEntries.length)} kokku {allEntries.length} mängijast</span>
                        </div>
                    </>
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