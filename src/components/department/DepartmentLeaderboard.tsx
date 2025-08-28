// src/components/department/DepartmentLeaderboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { TabNavigation } from '../ui/TabNavigation';
import { Pagination } from '../ui/Pagination';
import { getAllDepartmentData, DepartmentScore } from '../../services/DepartmentLeaderboardService';
import { DepartmentCrimeDisplay } from '../../types/crimeActivity';
import '../../styles/components/department/DepartmentLeaderboard.css';

type ViewType =  'prefectures' | 'departments' | 'units' | 'crime';

export const DepartmentLeaderboard: React.FC = () => {
    const [view, setView] = useState<ViewType>('units');
    const [scores, setScores] = useState<DepartmentScore[]>([]);
    const [crimeStats, setCrimeStats] = useState<DepartmentCrimeDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadScores();
    }, [view]);

    useEffect(() => {
        // Reset to page 1 when view changes
        setCurrentPage(1);
    }, [view]);

    const loadScores = async () => {
        setIsLoading(true);
        setScores([]);
        setCrimeStats([]);

        try {
            const data = await getAllDepartmentData();

            if (view === 'crime') {
                const sortedCrimeData = data.crimeStats.sort((a, b) => a.currentCrimeLevel - b.currentCrimeLevel);
                setCrimeStats(sortedCrimeData);
            } else if (view === 'units') {
                setScores(data.unitScores);
            } else if (view === 'prefectures') {
                setScores(data.prefectureScores);
            } else if (view === 'departments') {
                setScores(data.departmentScores);
            }
        } catch (error) {
            console.error('Error loading department scores:', error);
            setScores([]);
            setCrimeStats([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination logic
    const { paginatedData, totalPages, totalItems } = useMemo(() => {
        const data = view === 'crime' ? crimeStats : scores;
        const total = data.length;
        const pages = Math.ceil(total / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginated = data.slice(startIndex, endIndex);

        return {
            paginatedData: paginated,
            totalPages: pages,
            totalItems: total
        };
    }, [view, scores, crimeStats, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Color and description functions (same as before)
    const getCrimeColor = (crimeLevel: number): string => {
        if (crimeLevel >= 80) return '#ff3838';
        if (crimeLevel >= 60) return '#ffa502';
        if (crimeLevel >= 40) return '#f39c12';
        if (crimeLevel >= 20) return '#2ecc71';
        return '#27ae60';
    };

    const getCrimeDescription = (crimeLevel: number): string => {
        if (crimeLevel >= 80) return 'Väga kõrge';
        if (crimeLevel >= 60) return 'Kõrge';
        if (crimeLevel >= 40) return 'Keskmine';
        if (crimeLevel >= 20) return 'Madal';
        return 'Väga madal';
    };

    const tabs = [
        { id: 'prefectures' as const, label: 'Prefektuurid' },
        { id: 'departments' as const, label: 'Jaoskonnad' },
        { id: 'units' as const, label: 'Talitused' },
        { id: 'crime' as const, label: 'Kuritegevus' }
    ];

    const getEmptyMessage = () => {
        if (view === 'units') return 'Ühelgi üksusel pole veel punkte kogutud';
        if (view === 'prefectures') return 'Prefektuuridel pole veel punkte kogutud';
        if (view === 'departments') return 'Ühelgi osakonnal pole veel punkte kogutud';
        return 'Kuritegevuse andmed puuduvad';
    };

    const getInfoText = () => {
        if (view === 'units') return 'Üksuste maine kokku';
        if (view === 'prefectures') return 'Prefektuuride maine kokku';
        if (view === 'departments') return 'Osakondade maine kokku';
        return 'Madalam kuritegevuse protsent = parem positsioon';
    };

    const getIconForView = () => {
        if (view === 'prefectures') return '🏛️ ';
        if (view === 'units') return '🚔 ';
        if (view === 'departments') return '🏢 ';
        return '🚨 ';
    };

    return (
        <div className="department-leaderboard-section">
            <h2 className="section-title">Osakondade Edetabel</h2>

            <TabNavigation
                tabs={tabs}
                activeTab={view}
                onTabChange={(tab) => setView(tab as ViewType)}
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
                <>
                    <div className="department-leaderboard-table">
                        {paginatedData.length === 0 ? (
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
                                    (paginatedData as DepartmentCrimeDisplay[]).map((crime, index) => {
                                        const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <tr key={crime.departmentId} className="leaderboard-row crime-row">
                                                <td className="rank-column">
                                                        <span className={`rank rank-${globalRank} ${globalRank <= 3 ? 'top-three' : ''}`}>
                                                            {globalRank === 1 && '🥇'}
                                                            {globalRank === 2 && '🥈'}
                                                            {globalRank === 3 && '🥉'}
                                                            {globalRank > 3 && globalRank}
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
                                        );
                                    })
                                ) : (
                                    (paginatedData as DepartmentScore[]).map((score, index) => {
                                        const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <tr key={score.id} className="leaderboard-row">
                                                <td className="rank-column">
                                                        <span className={`rank rank-${globalRank}`}>
                                                            {globalRank}
                                                        </span>
                                                </td>
                                                <td className="name-column">
                                                        <span className="department-name">
                                                            {getIconForView()}{score.name}
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
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Component */}
                    {paginatedData.length > 0 && totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            totalItems={totalItems}
                        />
                    )}
                </>
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