// src/components/department/DepartmentLeaderboard.tsx
import React, { useState, useEffect } from 'react';
import { TabNavigation } from '../ui/TabNavigation';
import { getDepartmentUnitScores, getPrefectureScores, DepartmentScore } from '../../services/DepartmentLeaderboardService';
import '../../styles/components/department/DepartmentLeaderboard.css';

export const DepartmentLeaderboard: React.FC = () => {
    const [view, setView] = useState<'units' | 'prefectures'>('units');
    const [scores, setScores] = useState<DepartmentScore[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadScores();
        // eslint-disable-next-line
    }, [view]);

    const loadScores = async () => {
        setIsLoading(true);
        setScores([]); // Clear previous data

        try {
            const data = view === 'units'
                ? await getDepartmentUnitScores()
                : await getPrefectureScores();
            setScores(data);
        } catch (error) {
            console.error('Error loading department scores:', error);
            setScores([]);
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'units' as const, label: 'Üksused' },
        { id: 'prefectures' as const, label: 'Prefektuurid' }
    ];

    // Get the appropriate empty message
    const getEmptyMessage = () => {
        if (view === 'units') {
            return 'Ühelgi üksusel pole veel punkte kogutud';
        }
        return 'Prefektuuridel pole veel punkte kogutud';
    };

    return (
        <div className="department-leaderboard-section">
            <h2 className="section-title">Osakondade Edetabel</h2>

            <TabNavigation
                tabs={tabs}
                activeTab={view}
                onTabChange={(tab) => setView(tab as 'units' | 'prefectures')}
            />

            <div className="leaderboard-info">
                <p className="info-text">
                    {view === 'units'
                        ? 'Üksuste maine kokku'
                        : 'Prefektuuride maine kokku'}
                </p>
            </div>

            {isLoading ? (
                <div className="leaderboard-loading">
                    <p>Laadin edetabelit...</p>
                </div>
            ) : (
                <div className="department-leaderboard-table">
                    {scores.length === 0 ? (
                        <div className="empty-state">
                            <p>{getEmptyMessage()}</p>
                        </div>
                    ) : (
                        <table className="leaderboard-table">
                            <thead>
                            <tr>
                                <th className="rank-column">Koht</th>
                                <th className="name-column">Nimi</th>
                                <th className="score-column">Maine</th>
                                <th className="players-column">Mängijaid</th>
                            </tr>
                            </thead>
                            <tbody>
                            {scores.map((score, index) => (
                                <tr key={score.id} className="leaderboard-row">
                                    <td className="rank-column">
                                            <span className={`rank rank-${index + 1}`}>
                                                {index + 1}
                                            </span>
                                    </td>
                                    <td className="name-column">
                                            <span className="department-name">
                                                {view === 'prefectures' && '🏛️ '}
                                                {view === 'units' && '🚔 '}
                                                {score.name}
                                            </span>
                                    </td>
                                    <td className="score-column">
                                            <span className="score-value">
                                                {score.score.toLocaleString('et-EE')}
                                            </span>
                                    </td>
                                    <td className="players-column">
                                            <span className="player-count">
                                                {score.playerCount}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};