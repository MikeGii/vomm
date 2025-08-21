// src/components/department/DepartmentHierarchy.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { getRankImagePath } from '../../utils/rankUtils';
import { DEPARTMENT_UNITS, getUnitById } from '../../data/departmentUnits';
import {
    GraduatedPlayer,
    PrefectureStats,
    DepartmentStats,
    getHierarchyStats,
    getPlayersByUnit
} from '../../services/DepartmentService';
import '../../styles/components/department/DepartmentHierarchy.css';

interface DepartmentHierarchyProps {
    currentPlayerStats: PlayerStats;
}

type ViewLevel = 'prefectures' | 'departments' | 'units' | 'players';

interface BreadcrumbItem {
    label: string;
    level: ViewLevel;
    prefecture?: string;
    department?: string;
    unit?: string;
}

export const DepartmentHierarchy: React.FC<DepartmentHierarchyProps> = ({
                                                                            currentPlayerStats
                                                                        }) => {
    const [currentView, setCurrentView] = useState<ViewLevel>('prefectures');
    const [selectedPrefecture, setSelectedPrefecture] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<string>('');

    // Data states
    const [prefectureStats, setPrefectureStats] = useState<PrefectureStats[]>([]);
    const [currentDepartments, setCurrentDepartments] = useState<DepartmentStats[]>([]);
    const [currentUnits, setCurrentUnits] = useState<typeof DEPARTMENT_UNITS>([]);
    const [currentPlayers, setCurrentPlayers] = useState<GraduatedPlayer[]>([]);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate breadcrumb navigation
    const getBreadcrumb = (): BreadcrumbItem[] => {
        const breadcrumb: BreadcrumbItem[] = [
            { label: 'Kõik prefektuurid', level: 'prefectures' }
        ];

        if (currentView !== 'prefectures' && selectedPrefecture) {
            breadcrumb.push({
                label: selectedPrefecture,
                level: 'departments',
                prefecture: selectedPrefecture
            });
        }

        if ((currentView === 'units' || currentView === 'players') && selectedPrefecture && selectedDepartment) {
            breadcrumb.push({
                label: selectedDepartment,
                level: 'units',
                prefecture: selectedPrefecture,
                department: selectedDepartment
            });
        }

        if (currentView === 'players' && selectedPrefecture && selectedDepartment && selectedUnit) {
            const unit = getUnitById(selectedUnit);
            breadcrumb.push({
                label: unit?.name || selectedUnit,
                level: 'players',
                prefecture: selectedPrefecture,
                department: selectedDepartment,
                unit: selectedUnit
            });
        }

        return breadcrumb;
    };

    // Load prefectures with stats (initial load)
    const loadPrefectures = async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await getHierarchyStats();
            setPrefectureStats(stats);
        } catch (err) {
            setError('Viga prefektuuride laadimisel');
            console.error('Error loading prefectures:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load departments for selected prefecture
    const loadDepartments = async (prefecture: string) => {
        setLoading(true);
        setError(null);
        try {
            const stats = await getHierarchyStats();
            const prefectureData = stats.find(p => p.name === prefecture);
            setCurrentDepartments(prefectureData?.departments || []);
        } catch (err) {
            setError('Viga osakondade laadimisel');
            console.error('Error loading departments:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load units (static data)
    const loadUnits = () => {
        setCurrentUnits(DEPARTMENT_UNITS);
    };

    // Load players for selected unit
    const loadPlayers = async (prefecture: string, department: string, unit: string) => {
        setLoading(true);
        setError(null);
        try {
            const players = await getPlayersByUnit(prefecture, department, unit);
            // Sort by level descending, then by reputation
            players.sort((a, b) => {
                if (b.level !== a.level) return b.level - a.level;
                return b.reputation - a.reputation;
            });
            setCurrentPlayers(players);
        } catch (err) {
            setError('Viga mängijate laadimisel');
            console.error('Error loading players:', err);
        } finally {
            setLoading(false);
        }
    };

    // Navigate to different level
    const navigateToLevel = (item: BreadcrumbItem) => {
        setCurrentView(item.level);

        if (item.prefecture) {
            setSelectedPrefecture(item.prefecture);
        } else {
            setSelectedPrefecture('');
        }

        if (item.department) {
            setSelectedDepartment(item.department);
        } else {
            setSelectedDepartment('');
        }

        if (item.unit) {
            setSelectedUnit(item.unit);
        } else {
            setSelectedUnit('');
        }

        // Load appropriate data
        if (item.level === 'prefectures') {
            loadPrefectures();
        } else if (item.level === 'departments' && item.prefecture) {
            loadDepartments(item.prefecture);
        } else if (item.level === 'units') {
            loadUnits();
        } else if (item.level === 'players' && item.prefecture && item.department && item.unit) {
            loadPlayers(item.prefecture, item.department, item.unit);
        }
    };

    // Handle prefecture click
    const handlePrefectureClick = (prefecture: string) => {
        setSelectedPrefecture(prefecture);
        setCurrentView('departments');
        loadDepartments(prefecture);
    };

    // Handle department click
    const handleDepartmentClick = (department: string) => {
        setSelectedDepartment(department);
        setCurrentView('units');
        loadUnits();
    };

    // Handle unit click
    const handleUnitClick = (unitId: string) => {
        setSelectedUnit(unitId);
        setCurrentView('players');
        loadPlayers(selectedPrefecture, selectedDepartment, unitId);
    };

    // Initial load
    useEffect(() => {
        loadPrefectures();
    }, []);

    return (
        <div className="department-hierarchy">
            {/* Breadcrumb Navigation */}
            <div className="hierarchy-breadcrumb">
                {getBreadcrumb().map((item, index) => (
                    <React.Fragment key={index}>
                        <button
                            className={`breadcrumb-item ${
                                index === getBreadcrumb().length - 1 ? 'active' : ''
                            }`}
                            onClick={() => navigateToLevel(item)}
                            disabled={index === getBreadcrumb().length - 1}
                        >
                            {item.label}
                        </button>
                        {index < getBreadcrumb().length - 1 && (
                            <span className="breadcrumb-separator">›</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Error Display */}
            {error && (
                <div className="hierarchy-error">
                    {error}
                    <button onClick={() => window.location.reload()}>
                        Proovi uuesti
                    </button>
                </div>
            )}

            {/* Loading Display */}
            {loading && (
                <div className="hierarchy-loading">
                    <div className="loading-spinner"></div>
                    Laadin andmeid...
                </div>
            )}

            {/* Content Area */}
            <div className="hierarchy-content">
                {/* Prefectures View */}
                {currentView === 'prefectures' && !loading && !error && (
                    <div className="hierarchy-grid">
                        {prefectureStats.map((prefecture) => (
                            <div
                                key={prefecture.name}
                                className="hierarchy-card prefecture-card"
                                onClick={() => handlePrefectureClick(prefecture.name)}
                            >
                                <div className="card-icon">🏛️</div>
                                <div className="card-content">
                                    <div className="card-title">{prefecture.name}</div>
                                    <div className="card-stats">
                                        <span className="stat-item">
                                            {prefecture.totalPlayers} politseiametnikku
                                        </span>
                                        <span className="stat-item">
                                            {prefecture.departments.length} osakonda
                                        </span>
                                    </div>
                                </div>
                                <div className="card-arrow">→</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Departments View */}
                {currentView === 'departments' && !loading && !error && (
                    <div className="hierarchy-grid">
                        {currentDepartments.map((department) => (
                            <div
                                key={department.name}
                                className="hierarchy-card department-card"
                                onClick={() => handleDepartmentClick(department.name)}
                            >
                                <div className="card-icon">🏢</div>
                                <div className="card-content">
                                    <div className="card-title">{department.name}</div>
                                    <div className="card-stats">
                                        <span className="stat-item">
                                            {department.playerCount} politseiametnikku
                                        </span>
                                    </div>
                                </div>
                                <div className="card-arrow">→</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Units View */}
                {currentView === 'units' && !loading && !error && (
                    <div className="hierarchy-grid">
                        {currentUnits.map((unit) => (
                            <div
                                key={unit.id}
                                className="hierarchy-card unit-card"
                                onClick={() => handleUnitClick(unit.id)}
                            >
                                <div className="card-icon">⚙️</div>
                                <div className="card-content">
                                    <div className="card-title">{unit.name}</div>
                                    <div className="card-description">{unit.description}</div>
                                    {unit.requirements && (
                                        <div className="card-requirements">
                                            {unit.requirements.minimumLevel && (
                                                <span className="requirement-badge">
                                                    Tase {unit.requirements.minimumLevel}+
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="card-arrow">→</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Players View */}
                {currentView === 'players' && !loading && !error && (
                    <div className="players-list">
                        {currentPlayers.length === 0 ? (
                            <div className="no-players">
                                <div className="no-players-icon">👮‍♂️</div>
                                <div className="no-players-text">
                                    Selles üksuses pole veel politseiametnikke
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="players-header">
                                    <h3>
                                        {getUnitById(selectedUnit)?.name} ({currentPlayers.length} politseiametnikku)
                                    </h3>
                                </div>
                                <div className="players-table-container">
                                    <table className="players-table">
                                        <thead>
                                        <tr>
                                            <th>Nimi</th>
                                            <th>Auaste</th>
                                            <th>Märk</th>
                                            <th>Ametitõend</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {currentPlayers.map((player) => (
                                            <tr key={player.uid} className="player-row">
                                                <td className="player-name-cell">
                                                    <div className="player-name-content">
                                                        <div className="player-avatar-small">👮‍♂️</div>
                                                        <span className="player-name-text">{player.username}</span>
                                                    </div>
                                                </td>
                                                <td className="player-rank-cell">
                                                    <span className="rank-badge">{player.rank}</span>
                                                </td>
                                                <td className="player-rank-image-cell">
                                                    {getRankImagePath(player.rank) ? (
                                                        <div className="rank-image-container">
                                                            <img
                                                                src={getRankImagePath(player.rank)!}
                                                                alt={`${player.rank} märk`}
                                                                className="rank-image-table"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="no-rank-image">—</span>
                                                    )}
                                                </td>
                                                <td className="player-badge-cell">
                                                    <span className="badge-number">#{player.badgeNumber}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};