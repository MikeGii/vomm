// src/components/leaderboard/Leaderboard.tsx
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { PlayerProfileModal } from './PlayerProfileModal';
import { getLeaderboard } from '../../services/LeaderboardService';
import { getPlayerProfileData } from '../../services/PlayerProfileService';
import { LeaderboardEntry, PlayerProfileModalData } from '../../types';
import '../../styles/components/leaderboard/Leaderboard.css';

interface LeaderboardProps {
    currentUserId?: string;
    currentUserIsVip?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
                                                            currentUserId,
                                                            currentUserIsVip = false
                                                        }) => {
    const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileModalData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    const loadingRef = useRef(false);
    const entriesPerPage = 10;

    const { currentEntries, totalPages, userRank, userPage, indexOfFirstEntry, indexOfLastEntry, vipCount } = useMemo(() => {
        const total = Math.ceil(allEntries.length / entriesPerPage);
        const indexOfLastEntry = currentPage * entriesPerPage;
        const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
        const entries = allEntries.slice(indexOfFirstEntry, indexOfLastEntry);
        const rank = allEntries.findIndex(entry => entry.userId === currentUserId) + 1;
        const page = rank > 0 ? Math.ceil(rank / entriesPerPage) : 0;
        const vipPlayerCount = allEntries.filter(entry => entry.isVip === true).length;

        return {
            currentEntries: entries,
            totalPages: total,
            userRank: rank,
            userPage: page,
            indexOfFirstEntry,
            indexOfLastEntry,
            vipCount: vipPlayerCount
        };
    }, [allEntries, currentPage, currentUserId, entriesPerPage]);

    const loadLeaderboard = useCallback(async (forceRefresh = false) => {
        if (loadingRef.current && !forceRefresh) return;
        loadingRef.current = true;

        setLoading(true);
        setError(null);

        try {
            const data = await getLeaderboard(300, forceRefresh);
            setAllEntries(data);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
            setError('Edetabeli laadimine ebaõnnestus');
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    const handleRefresh = () => {
        loadLeaderboard(true);
    };

    const handlePlayerClick = async (playerData: PlayerProfileModalData) => {
        setIsLoadingProfile(true);

        try {
            const completeProfile = await getPlayerProfileData(playerData.userId);
            if (completeProfile) {
                // Preserve the isVip status from the original playerData
                setSelectedPlayer({
                    ...completeProfile,
                    isVip: playerData.isVip // Keep the original VIP status
                });
                setIsModalOpen(true);
            } else {
                setSelectedPlayer(playerData);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error loading player profile:', error);
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

    const hasVipPlayers = allEntries.some(entry => entry.isVip === true);

    return (
        <>
            <div className={`leaderboard-container${currentUserIsVip ? ' current-user-vip' : ''}`}>
                <div className="leaderboard-header">
                    {currentUserIsVip ? (
                        <div className="leaderboard-title-section">
                            <h3 className="leaderboard-title">Edetabel</h3>
                        </div>
                    ) : (
                        <h3 className="leaderboard-title">Edetabel</h3>
                    )}

                    <div className="leaderboard-actions">
                        {userRank > 0 && userPage !== currentPage && (
                            <button
                                className={`go-to-position-btn${currentUserIsVip ? ' vip-button' : ''}`}
                                onClick={handleGoToMyPosition}
                            >
                                Minu positsioon (#{userRank})
                                {currentUserIsVip && <span className="button-sparkle">✨</span>}
                            </button>
                        )}
                        {!loading && (
                            <button
                                className={`refresh-btn${currentUserIsVip ? ' vip-button' : ''}`}
                                onClick={handleRefresh}
                                title="Värskenda edetabelit"
                            >
                                ↻
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="leaderboard-loading">
                        <p>Laadin edetabelit...</p>
                    </div>
                )}

                {error && (
                    <div className="leaderboard-error">
                        <p>{error}</p>
                        <button onClick={() => loadLeaderboard(true)}>Proovi uuesti</button>
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
                                {/* Previous button - only show if not on first page */}
                                {currentPage > 1 && (
                                    <button
                                        className={`pagination-btn pagination-prev${currentUserIsVip ? ' vip-btn' : ''}`}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                    >
                                        ‹
                                    </button>
                                )}

                                {/* Page numbers container */}
                                <div className="pagination-numbers">
                                    {/* First page if we're not near it */}
                                    {currentPage > 2 && (
                                        <>
                                            <button
                                                className={`pagination-number${currentUserIsVip ? ' vip-btn' : ''}`}
                                                onClick={() => handlePageChange(1)}
                                            >
                                                1
                                            </button>
                                            {currentPage > 3 && (
                                                <span className="pagination-ellipsis">...</span>
                                            )}
                                        </>
                                    )}

                                    {/* Current page and neighbors */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            const distance = Math.abs(page - currentPage);
                                            // Always show current page, and neighbors on desktop
                                            return distance <= 1;
                                        })
                                        .map(page => (
                                            <button
                                                key={page}
                                                className={`pagination-number${currentPage === page ? ' active' : ''}${currentUserIsVip ? ' vip-btn' : ''}`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        ))
                                    }

                                    {/* Last page if we're not near it */}
                                    {currentPage < totalPages - 1 && (
                                        <>
                                            {currentPage < totalPages - 2 && (
                                                <span className="pagination-ellipsis">...</span>
                                            )}
                                            <button
                                                className={`pagination-number${currentUserIsVip ? ' vip-btn' : ''}`}
                                                onClick={() => handlePageChange(totalPages)}
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Next button - only show if not on last page */}
                                {currentPage < totalPages && (
                                    <button
                                        className={`pagination-btn pagination-next${currentUserIsVip ? ' vip-btn' : ''}`}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                    >
                                        ›
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Info section - make it more compact on mobile */}
                        <div className="leaderboard-info">
                        <span className="desktop-only">
                            Näitan {indexOfFirstEntry + 1}-{Math.min(indexOfLastEntry, allEntries.length)} kokku {allEntries.length} mängijast
                            {currentUserIsVip && hasVipPlayers && (
                                <span className="vip-info-highlight"> • {vipCount} VIP</span>
                            )}
                         </span>
                            <span className="mobile-only">
                                {indexOfFirstEntry + 1}-{Math.min(indexOfLastEntry, allEntries.length)} / {allEntries.length}
                                {currentUserIsVip && hasVipPlayers && (
                                    <span className="vip-info-highlight"> • {vipCount} VIP</span>
                                )}
                        </span>
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