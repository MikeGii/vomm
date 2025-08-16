// src/components/leaderboard/LeaderboardFilter.tsx
import React from 'react';
import { LeaderboardSortBy } from '../../types';
import '../../styles/components/leaderboard/LeaderboardFilter.css';

interface LeaderboardFilterProps {
    currentSort: LeaderboardSortBy;
    onSortChange: (sort: LeaderboardSortBy) => void;
}

export const LeaderboardFilter: React.FC<LeaderboardFilterProps> = ({
                                                                        currentSort,
                                                                        onSortChange
                                                                    }) => {
    const sortOptions: { value: LeaderboardSortBy; label: string }[] = [
        { value: 'level', label: 'Tase & Maine' },
        { value: 'reputation', label: 'Maine' },
        { value: 'money', label: 'Raha' },  // ADD THIS
        { value: 'strength', label: 'Jõud' },
        { value: 'agility', label: 'Kiirus' },
        { value: 'dexterity', label: 'Osavus' },
        { value: 'intelligence', label: 'Intelligentsus' },
        { value: 'endurance', label: 'Vastupidavus' },
        { value: 'cases', label: 'Lahendatud juhtumid' },
        { value: 'arrests', label: 'Vahistamised' },
        { value: 'totalWorkedHours', label: 'Töötunnid' }
    ];

    return (
        <div className="leaderboard-filter">
            <label className="filter-label">Sorteeri:</label>
            <select
                className="filter-select"
                value={currentSort}
                onChange={(e) => onSortChange(e.target.value as LeaderboardSortBy)}
            >
                {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};