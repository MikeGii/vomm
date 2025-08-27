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
            completedCourses: entry.completedCourses
        };
        onPlayerClick(playerData);
    };

    // Check if there are any VIP players in the leaderboard
    const hasVipPlayers = entries.some(entry => entry.isVip);

    if (entries.length === 0) {
        return (
            <div className="leaderboard-empty">
                <p>Edetabel on tühi</p>
            </div>
        );
    }

    return (
        <div className="leaderboard-table-container">
            <table className={`leaderboard-table ${hasVipPlayers ? 'has-vip' : ''}`}>
                <thead>
                <tr>
                    <th className="rank-column">Koht</th>
                    <th className="name-column">Nimi</th>
                    <th className="status-column">Staatus</th>
                    <th className="level-column">Tase</th>
                    <th className="reputation-column mobile-hide">Maine</th>
                </tr>
                </thead>
                <tbody>
                {entries.map((entry, index) => {
                    const globalRank = startingRank + index + 1;
                    const medalStyle = getMedalStyle(globalRank);

                    return (
                        <tr
                            key={entry.userId}
                            className={[
                                entry.userId === currentUserId ? 'current-user' : '',
                                entry.isVip ? 'vip-player' : '',
                                entry.isVip && globalRank <= 3 ? 'top-vip' : '',
                                entry.isVip ? 'particles' : ''
                            ].filter(Boolean).join(' ')}
                        >
                            <td className="rank-column">
                                <span
                                    className="rank-number"
                                    style={medalStyle}
                                >
                                    {globalRank}
                                </span>
                            </td>
                            <td className="name-column">
                                <div className="player-name-container">
                                    <button
                                        className="player-name-button"
                                        onClick={() => handlePlayerClick(entry)}
                                    >
                                        {entry.username}
                                    </button>
                                    {entry.isVip && (
                                        <span className="vip-badge" title="VIP kasutaja">
                                            VIP
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="status-column">
                                <span className="status-badge">
                                    {getStatusText(entry)}
                                </span>
                            </td>
                            <td className="level-column">{entry.level}</td>
                            <td className="reputation-column mobile-hide">{entry.reputation}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};