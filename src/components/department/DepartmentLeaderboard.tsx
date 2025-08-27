// src/components/department/DepartmentLeaderboard.tsx
import React, { useState, useEffect } from 'react';
import { TabNavigation } from '../ui/TabNavigation';
import { getDepartmentUnitScores, getPrefectureScores, DepartmentScore } from '../../services/DepartmentLeaderboardService';
import { getAllDepartmentCrimeStats } from '../../services/CrimeService';
import { DepartmentCrimeDisplay } from '../../types/crimeActivity';
import '../../styles/components/department/DepartmentLeaderboard.css';

export const DepartmentLeaderboard: React.FC = () => {
    const [view, setView] = useState<'units' | 'prefectures' | 'crime'>('units');
    const [scores, setScores] = useState<DepartmentScore[]>([]);
    const [crimeStats, setCrimeStats] = useState<DepartmentCrimeDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadScores();
        // eslint-disable-next-line
    }, [view]);

    const loadScores = async () => {
        setIsLoading(true);
        setScores([]); // Clear previous data
        setCrimeStats([]); // Clear previous crime data

        try {
            if (view === 'crime') {
                const crimeData = await getAllDepartmentCrimeStats();
                // Sort by crime level (lowest first for leaderboard)
                const sortedCrimeData = crimeData.sort((a, b) => a.currentCrimeLevel - b.currentCrimeLevel);
                setCrimeStats(sortedCrimeData);
            } else {
                const data = view === 'units'
                    ? await getDepartmentUnitScores()
                    : await getPrefectureScores();
                setScores(data);
            }
        } catch (error) {
            console.error('Error loading department scores:', error);
            setScores([]);
            setCrimeStats([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Get crime level color
    const getCrimeColor = (crimeLevel: number): string => {
        if (crimeLevel >= 80) return '#ff3838'; // High crime - red
        if (crimeLevel >= 60) return '#ffa502'; // Medium crime - orange
        if (crimeLevel >= 40) return '#f39c12'; // Low-medium crime - yellow
        if (crimeLevel >= 20) return '#2ecc71'; // Low crime - green
        return '#27ae60'; // Very low crime - dark green
    };

    // Get crime level description
    const getCrimeDescription = (crimeLevel: number): string => {
        if (crimeLevel >= 80) return 'Väga kõrge';
        if (crimeLevel >= 60) return 'Kõrge';
        if (crimeLevel >= 40) return 'Keskmine';
        if (crimeLevel >= 20) return 'Madal';
        return 'Väga madal';
    };

    const tabs = [
        { id: 'units' as const, label: 'Üksused' },
        { id: 'prefectures' as const, label: 'Prefektuurid' },
        { id: 'crime' as const, label: 'Kuritegevuse edetabel' }
    ];

    // Get the appropriate empty message
    const getEmptyMessage = () => {
        if (view === 'units') {
            return 'Ühelgi üksusel pole veel punkte kogutud';
        }
        if (view === 'prefectures') {
            return 'Prefektuuridel pole veel punkte kogutud';
        }
        return 'Kuritegevuse andmed puuduvad';
    };

    // Get info text based on view
    const getInfoText = () => {
        if (view === 'units') {
            return 'Üksuste maine kokku';
        }
        if (view === 'prefectures') {
            return 'Prefektuuride maine kokku';
        }
        return 'Madalam kuritegevuse protsent = parem positsioon';
    };

    return (
        <div className="department-leaderboard-section">
            <h2 className="section-title">Osakondade Edetabel</h2>

            <TabNavigation
                tabs={tabs}
                activeTab={view}
                onTabChange={(tab) => setView(tab as 'units' | 'prefectures' | 'crime')}
            />

            <div className="leaderboard-info">
                <p className="info-text">{getInfoText()}</p>
                {view === 'crime' && crimeStats.length > 0 && (
                    <div className="crime-reset-info">
                        Lähtestamine: {crimeStats[0]?.daysUntilReset || 0} päeva pärast
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="leaderboard-loading">
                    <p>Laadin edetabelit...</p>
                </div>
            ) : (
                <div className="department-leaderboard-table">
                    {(view !== 'crime' && scores.length === 0) || (view === 'crime' && crimeStats.length === 0) ? (
                        <div className="empty-state">
                            <p>{getEmptyMessage()}</p>
                        </div>
                    ) : (
                        <table className="leaderboard-table">
                            <thead>
                            <tr>
                                <th className="rank-column">Koht</th>
                                <th className="name-column">
                                    {view === 'crime' ? 'Osakond' : 'Nimi'}
                                </th>
                                {view === 'crime' ? (
                                    <>
                                        <th className="crime-level-column">Kuritegevus</th>
                                        <th className="crime-status-column">Staatus</th>
                                        <th className="players-column">Ametnikke</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="score-column">Maine</th>
                                        <th className="players-column">Mängijaid</th>
                                    </>
                                )}
                            </tr>
                            </thead>
                            <tbody>
                            {view === 'crime' ? (
                                crimeStats.map((crime, index) => (
                                    <tr key={crime.departmentId} className="leaderboard-row crime-row">
                                        <td className="rank-column">
                                            <span className={`rank rank-${index + 1} ${index < 3 ? 'top-three' : ''}`}>
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && (index + 1)}
                                            </span>
                                        </td>
                                        <td className="name-column">
                                            <div className="crime-department-info">
                                                <span className="department-name">
                                                    🚨 {crime.departmentId}
                                                </span>
                                                <span className="department-prefecture">
                                                    {crime.prefecture}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="crime-level-column">
                                            <span
                                                className="crime-percentage"
                                                style={{ color: getCrimeColor(crime.currentCrimeLevel) }}
                                            >
                                                {crime.currentCrimeLevel.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="crime-status-column">
                                            <span
                                                className="crime-status"
                                                style={{ color: getCrimeColor(crime.currentCrimeLevel) }}
                                            >
                                                {getCrimeDescription(crime.currentCrimeLevel)}
                                            </span>
                                        </td>
                                        <td className="players-column">
                                            <span className="player-count">
                                                {crime.playerCount}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                scores.map((score, index) => (
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
                                ))
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {view === 'crime' && crimeStats.length > 0 && (
                <div className="crime-footer-info">
                    <div className="crime-footer-item">
                        <span className="info-icon">📈</span>
                        <span>Kuritegevus tõuseb 5% päevas</span>
                    </div>
                    <div className="crime-footer-item">
                        <span className="info-icon">👮</span>
                        <span>Töö vähendab kuritegevust</span>
                    </div>
                </div>
            )}
        </div>
    );
};