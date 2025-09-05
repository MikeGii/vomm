// src/components/leaderboard/LeaderboardTable.tsx
import React from 'react';
import {LeaderboardEntry, PlayerProfileModalData, PlayerStats} from '../../types';
import '../../styles/components/leaderboard/LeaderboardTable.css';
import {getPlayerDisplayStatus} from "../../utils/playerStatus";

interface LeaderboardTableProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
    onPlayerClick: (playerData: PlayerProfileModalData) => void;
    startingRank?: number;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
                                                                      entries,
                                                                      currentUserId,
                                                                      onPlayerClick,
                                                                      startingRank = 0
                                                                  }) => {
    const getStatusText = (entry: LeaderboardEntry): string => {
        const playerStats = {
            policePosition: entry.policePosition
        } as PlayerStats;

        return getPlayerDisplayStatus(playerStats);
    };

    const getMedalStyle = (globalRank: number) => {
        switch (globalRank) {
            case 1:
                return { backgroundColor: '#ffd700', color: '#1a1a1a' }; // Gold
            case 2:
                return { backgroundColor: '#c0c0c0', color: '#1a1a1a' }; // Silver
            case 3:
                return { backgroundColor: '#cd7f32', color: '#1a1a1a' }; // Bronze
            default:
                return { backgroundColor: '#333', color: '#f0f0f0' }; // Default
        }
    };

    const handlePlayerClick = (entry: LeaderboardEntry) => {
        const playerData: PlayerProfileModalData = {
            userId: entry.userId,
            username: entry.username,
            level: entry.level,
            reputation: entry.reputation,
            money: entry.money,
            badgeNumber: entry.badgeNumber,
            policePosition: entry.policePosition,
            attributes: entry.attributes,
            createdAt: undefined,
            completedCourses: entry.completedCourses,
            isVip: entry.isVip
        };
        onPlayerClick(playerData);
    };

    // FIXED: Strict VIP checking
    const hasVipPlayers = entries.some(entry => entry.isVip === true);

    if (entries.length === 0) {
        return (
            <div className="leaderboard-empty">
                <p>Edetabel on tühi</p>
            </div>
        );
    }

    return (
        <div className="leaderboard-table-container">
            <table className={`lb-table${hasVipPlayers ? ' has-vip' : ''}`}>
                <thead>
                <tr>
                    <th className="lb-rank-col">Koht</th>
                    <th className="lb-name-col">Nimi</th>
                    <th className="lb-status-col">Staatus</th>
                    <th className="lb-level-col">Tase</th>
                    <th className="lb-rep-col mobile-hide">Maine</th>
                </tr>
                </thead>
                <tbody>
                {entries.map((entry, index) => {
                    const globalRank = startingRank + index + 1;
                    const medalStyle = getMedalStyle(globalRank);

                    // FIXED: Strict VIP checking - MOVED INSIDE THE MAP FUNCTION
                    const isActuallyVip = entry.isVip === true;

                    return (
                        <tr
                            key={entry.userId}
                            className={[
                                'lb-row',
                                entry.userId === currentUserId ? 'lb-current-user' : '',
                                isActuallyVip ? 'lb-vip-row' : '',
                                isActuallyVip && globalRank <= 3 ? 'lb-top-vip' : ''
                            ].filter(Boolean).join(' ')}
                        >
                            <td className="lb-rank-col">
                            <span
                                className="lb-rank-number"
                                style={medalStyle}
                            >
                                {globalRank}
                            </span>
                            </td>
                            <td className="lb-name-col">
                                <button
                                    className="lb-player-name-btn"
                                    onClick={() => handlePlayerClick(entry)}
                                >
                                    {entry.username}
                                </button>
                                {/* FIXED: Only show for actual VIP players */}
                                {isActuallyVip && (
                                    <span className="lb-vip-badge" title="VIP kasutaja">
                                    VIP
                                </span>
                                )}
                            </td>
                            <td className="lb-status-col">
                            <span className="lb-status-badge">
                                {getStatusText(entry)}
                            </span>
                            </td>
                            <td className="lb-level-col">{entry.level}</td>
                            <td className="lb-rep-col mobile-hide">{entry.reputation}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};