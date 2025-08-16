// src/components/leaderboard/LeaderboardTable.tsx
import React from 'react';
import { LeaderboardEntry, LeaderboardSortBy } from '../../types';
import '../../styles/components/leaderboard/LeaderboardTable.css';

interface LeaderboardTableProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
    sortBy: LeaderboardSortBy;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
                                                                      entries,
                                                                      currentUserId,
                                                                      sortBy
                                                                  }) => {
    const getStatusText = (entry: LeaderboardEntry): string => {
        // Check if player has completed Sisekaitseakadeemia entrance (is a Kadett)
        // This takes priority even if they have a rank
        if (entry.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            // TODO: Add check for graduation course when implemented
            // For now, all who completed entrance are Kadett
            return 'Kadett';
        }
        // Check if player has a rank AND is not a Kadett (is a Politseiametnik)
        // This will be for future courses that graduate from the academy
        if (entry.rank && !entry.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            return 'Politseiametnik';
        }
        // Check if player has completed training (is an Abipolitseinik)
        if (entry.hasCompletedTraining) {
            return 'Abipolitseinik';
        }
        return '—';
    };

    const getAttributeValue = (entry: LeaderboardEntry, attribute: string): number => {
        if (!entry.attributes) return 0;

        switch(attribute) {
            case 'strength':
                return entry.attributes.strength.level;
            case 'agility':
                return entry.attributes.agility.level;
            case 'dexterity':
                return entry.attributes.dexterity.level;
            case 'intelligence':
                return entry.attributes.intelligence.level;
            case 'endurance':
                return entry.attributes.endurance.level;
            default:
                return 0;
        }
    };

    const getSortedValue = (entry: LeaderboardEntry): string | number => {
        switch(sortBy) {
            case 'reputation':
                return entry.reputation;
            case 'money':
                return `${entry.money} €`;
            case 'cases':
                return entry.casesCompleted;
            case 'arrests':
                return entry.criminalsArrested;
            case 'totalWorkedHours':
                return entry.totalWorkedHours;
            case 'strength':
            case 'agility':
            case 'dexterity':
            case 'intelligence':
            case 'endurance':
                return getAttributeValue(entry, sortBy);
            default:
                return '';
        }
    };

    const getExtraColumnHeader = (): string => {
        switch(sortBy) {
            case 'reputation':
                return 'Maine';
            case 'money':
                return 'Raha';
            case 'strength':
                return 'Jõud';
            case 'agility':
                return 'Kiirus';
            case 'dexterity':
                return 'Osavus';
            case 'intelligence':
                return 'Intelligentsus';
            case 'endurance':
                return 'Vastupidavus';
            case 'cases':
                return 'Juhtumid';
            case 'arrests':
                return 'Vahistamised';
            case 'totalWorkedHours':
                return 'Töötunnid';
            default:
                return '';
        }
    };

    // Check if we should show the extra column
    const showExtraColumn = sortBy !== 'level';

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
                    <th className="money-column">Raha</th>
                    {showExtraColumn && sortBy !== 'money' && (
                        <th className="value-column">
                            {getExtraColumnHeader()}
                        </th>
                    )}
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
                        <td className="name-column">{entry.username}</td>
                        <td className="status-column">
                <span className="status-badge">
                    {getStatusText(entry)}
                </span>
                        </td>
                        <td className="level-column">{entry.level}</td>
                        <td className="reputation-column">{entry.reputation}</td>
                        <td className="money-column">{entry.money} €</td>
                        {showExtraColumn && sortBy !== 'money' && (
                            <td className="value-column">
                    <span className="sorted-value">
                        {getSortedValue(entry)}
                    </span>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};