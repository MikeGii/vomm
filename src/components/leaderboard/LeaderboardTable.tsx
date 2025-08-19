// src/components/leaderboard/LeaderboardTable.tsx
import React from 'react';
import { LeaderboardEntry, PlayerProfileModalData } from '../../types';
import '../../styles/components/leaderboard/LeaderboardTable.css';

interface LeaderboardTableProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
    onPlayerClick: (playerData: PlayerProfileModalData) => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
                                                                      entries,
                                                                      currentUserId,
                                                                      onPlayerClick
                                                                  }) => {
    const getStatusText = (entry: LeaderboardEntry): string => {
        // Check if player has completed Sisekaitseakadeemia entrance (is a Kadett)
        if (entry.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            return 'Kadett';
        }
        // Check if player has a rank AND is not a Kadett (is a Politseiametnik)
        if (entry.rank && !entry.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            return 'Politseiametnik';
        }
        // Check if player has completed basic training (is an Abipolitseinik)
        if (entry.completedCourses?.includes('basic_police_training_abipolitseinik')) {
            return 'Abipolitseinik';
        }
        return '—';
    };

    const handlePlayerClick = (entry: LeaderboardEntry) => {
        const playerData: PlayerProfileModalData = {
            userId: entry.userId,
            username: entry.username,
            level: entry.level,
            reputation: entry.reputation,
            status: getStatusText(entry),
            money: entry.money,
            badgeNumber: entry.badgeNumber,
            attributes: entry.attributes,
            createdAt: undefined
        };
        onPlayerClick(playerData);
    };

    if (entries.length === 0) {
        return (
            <div className="leaderboard-empty">
                <p>Edetabel on tühi</p>
            </div>
        );
    }

    return (
        <div className="leaderboard-table-container">
            <table className="leaderboard-table">
                <thead>
                <tr>
                    <th className="rank-column">Koht</th>
                    <th className="name-column">Nimi</th>
                    <th className="status-column">Staatus</th>
                    <th className="level-column">Tase</th>
                    <th className="reputation-column">Maine</th>
                </tr>
                </thead>
                <tbody>
                {entries.map((entry, index) => (
                    <tr
                        key={entry.userId}
                        className={entry.userId === currentUserId ? 'current-user' : ''}
                    >
                        <td className="rank-column">
                            <span className="rank-number">{index + 1}</span>
                        </td>
                        <td className="name-column">
                            <button
                                className="player-name-button"
                                onClick={() => handlePlayerClick(entry)}
                            >
                                {entry.username}
                            </button>
                        </td>
                        <td className="status-column">
                                <span className="status-badge">
                                    {getStatusText(entry)}
                                </span>
                        </td>
                        <td className="level-column">{entry.level}</td>
                        <td className="reputation-column">{entry.reputation}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};