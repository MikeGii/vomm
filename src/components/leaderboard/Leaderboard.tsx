// src/components/leaderboard/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { LeaderboardFilter } from './LeaderboardFilter';
import { getLeaderboard } from '../../services/LeaderboardService';
import { LeaderboardEntry, LeaderboardSortBy } from '../../types';
import '../../styles/components/leaderboard/Leaderboard.css';

interface LeaderboardProps {
    currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [sortBy, setSortBy] = useState<LeaderboardSortBy>('level');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLeaderboard();
    }, [sortBy]);

    const loadLeaderboard = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getLeaderboard(sortBy);
            setEntries(data);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
            setError('Edetabeli laadimine ebaõnnestus');
        } finally {
            setLoading(false);
        }
    };

    const handleSortChange = (newSort: LeaderboardSortBy) => {
        setSortBy(newSort);
    };

    return (
        <div className="leaderboard-container">
            <h3 className="leaderboard-title">Edetabel</h3>

            <LeaderboardFilter
                currentSort={sortBy}
                onSortChange={handleSortChange}
            />

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
                    sortBy={sortBy}
                />
            )}
        </div>
    );
};