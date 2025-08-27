// src/components/department/DepartmentCrimeActivity.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { getDepartmentCrimeStats } from '../../services/CrimeService';
import { DepartmentCrimeStats } from '../../types/crimeActivity';
import '../../styles/components/department/DepartmentCrimeActivity.css';

interface DepartmentCrimeActivityProps {
    playerStats: PlayerStats;
}

export const DepartmentCrimeActivity: React.FC<DepartmentCrimeActivityProps> = ({
                                                                                    playerStats
                                                                                }) => {
    const [crimeStats, setCrimeStats] = useState<DepartmentCrimeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get crime level color based on percentage
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

    // Calculate days until next monthly reset
    const getDaysUntilReset = (): number => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Load crime stats for player's department
    useEffect(() => {
        const loadCrimeStats = async () => {
            if (!playerStats.department || !playerStats.prefecture) {
                setLoading(false);
                return;
            }

            // Skip if Sisekaitseakadeemia
            if (playerStats.department === 'Sisekaitseakadeemia') {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const stats = await getDepartmentCrimeStats(
                    playerStats.department,
                    playerStats.prefecture
                );

                setCrimeStats(stats);
            } catch (err) {
                console.error('Error loading crime stats:', err);
                setError('Viga kuritegevuse andmete laadimisel');
            } finally {
                setLoading(false);
            }
        };

        loadCrimeStats();
    }, [playerStats.department, playerStats.prefecture]);

    // Don't show for Sisekaitseakadeemia or if no department
    if (!playerStats.department ||
        playerStats.department === 'Sisekaitseakadeemia' ||
        !playerStats.prefecture) {
        return null;
    }

    if (loading) {
        return (
            <div className="crime-activity-container">
                <div className="crime-loading">
                    <div className="loading-spinner"></div>
                    <span>Laaditakse kuritegevuse andmeid...</span>
                </div>
            </div>
        );
    }

    if (error || !crimeStats) {
        return (
            <div className="crime-activity-container">
                <div className="crime-error">
                    <span className="error-icon">⚠️</span>
                    <span>{error || 'Kuritegevuse andmeid ei leitud'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="crime-activity-container">
            <div className="crime-header">
                <div className="crime-title">
                    <span className="crime-icon">🚨</span>
                    <h3>Kuritegevuse tase - {playerStats.department}</h3>
                </div>
                <div className="crime-reset-info">
                    Lähtestamine: {getDaysUntilReset()} päeva pärast
                </div>
            </div>

            <div className="crime-stats">
                <div className="crime-level-display">
                    <div className="crime-percentage">
                        <span
                            className="crime-number"
                            style={{ color: getCrimeColor(crimeStats.currentCrimeLevel) }}
                        >
                            {crimeStats.currentCrimeLevel.toFixed(1)}%
                        </span>
                        <span className="crime-label">
                            {getCrimeDescription(crimeStats.currentCrimeLevel)}
                        </span>
                    </div>

                    <div className="crime-progress-bar">
                        <div
                            className="crime-progress-fill"
                            style={{
                                width: `${crimeStats.currentCrimeLevel}%`,
                                backgroundColor: getCrimeColor(crimeStats.currentCrimeLevel)
                            }}
                        ></div>
                    </div>
                </div>

                <div className="crime-info">
                    <div className="crime-info-item">
                        <span className="info-icon">👮</span>
                        <span>Su töö vähendab kuritegevust</span>
                    </div>
                    <div className="crime-info-item">
                        <span className="info-icon">📈</span>
                        <span>Kuritegevus tõuseb 5% päevas</span>
                    </div>
                    <div className="crime-info-item">
                        <span className="info-icon">🔄</span>
                        <span>Lähtestamine iga kuu 1. kuupäeval</span>
                    </div>
                </div>
            </div>
        </div>
    );
};