// src/components/department/DepartmentCrimeInfo.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { getAllDepartmentData, findDepartmentCrimeStats } from '../../services/DepartmentLeaderboardService';
import { DepartmentCrimeDisplay } from '../../types/crimeActivity';
import '../../styles/components/department/DepartmentCrimeInfo.css';

interface DepartmentCrimeInfoProps {
    playerStats: PlayerStats;
}

export const DepartmentCrimeInfo: React.FC<DepartmentCrimeInfoProps> = ({
                                                                            playerStats
                                                                        }) => {
    const [crimeStats, setCrimeStats] = useState<DepartmentCrimeDisplay | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCrimeStats();
    }, [playerStats.department, playerStats.prefecture]);

    const loadCrimeStats = async () => {
        if (!playerStats.department ||
            playerStats.department === 'Sisekaitseakadeemia' ||
            !playerStats.prefecture) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Kasuta uut optimeeritud teenust (kasutab sama cache'i mis leaderboard)
            const data = await getAllDepartmentData();

            // Leia oma osakonna kuritegevuse andmed
            const departmentCrime = findDepartmentCrimeStats(data, playerStats.department);

            setCrimeStats(departmentCrime);
        } catch (error) {
            console.error('Error loading crime stats:', error);
            setCrimeStats(null);
        } finally {
            setLoading(false);
        }
    };

    const getCrimeColor = (crimeLevel: number): string => {
        if (crimeLevel >= 80) return '#ff3838';
        if (crimeLevel >= 60) return '#ffa502';
        if (crimeLevel >= 40) return '#f39c12';
        if (crimeLevel >= 20) return '#2ecc71';
        return '#27ae60';
    };

    if (!playerStats.department ||
        playerStats.department === 'Sisekaitseakadeemia' ||
        !playerStats.prefecture) {
        return null;
    }

    if (loading) {
        return (
            <div className="crime-info-compact loading">
                <div className="crime-info-content">
                    <div className="crime-info-icon">⏳</div>
                    <div className="crime-info-details">
                        <div className="crime-info-title">
                            Laaditakse kuritegevuse andmeid...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!crimeStats) {
        return null;
    }

    return (
        <div
            className="crime-info-compact"
            data-crime-level={crimeStats.currentCrimeLevel >= 80 ? 'high' :
                crimeStats.currentCrimeLevel <= 20 ? 'low' : 'medium'}
        >
            <div className="crime-info-content">
                <div className="crime-info-icon">🚨</div>
                <div className="crime-info-details">
                    <div className="crime-info-title">Kuritegevuse tase</div>
                    <div className="crime-info-percentage">
                        <span
                            className="crime-percentage-number"
                            style={{ color: getCrimeColor(crimeStats.currentCrimeLevel) }}
                        >
                            {Math.round(crimeStats.currentCrimeLevel)}%
                        </span>
                        <span className="crime-info-department">
                            {playerStats.department}
                        </span>
                    </div>
                </div>
                <div className="crime-info-progress">
                    <div
                        className="crime-progress-bar"
                        style={{
                            width: `${Math.min(crimeStats.currentCrimeLevel, 100)}%`,
                            backgroundColor: getCrimeColor(crimeStats.currentCrimeLevel)
                        }}
                    />
                </div>
            </div>
        </div>
    );
};