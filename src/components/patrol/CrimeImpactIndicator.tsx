// src/components/patrol/CrimeImpactIndicator.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { getAllDepartmentData, findDepartmentCrimeStats } from '../../services/DepartmentLeaderboardService';
import { DepartmentCrimeDisplay } from '../../types/crimeActivity';
import '../../styles/components/patrol/CrimeImpactIndicator.css';

interface CrimeImpactIndicatorProps {
    playerStats: PlayerStats;
    selectedHours: number;
}

// Crime reduction calculation (same logic as in CrimeService)
const calculateCrimeReduction = (workHours: number, departmentPlayerCount: number): number => {
    const playerCount = Math.max(departmentPlayerCount, 1);
    const baseReduction = 1; // BASE_REDUCTION_FOR_10_PLAYERS
    const hourMultiplier = workHours / 12;
    const playerMultiplier = 10 / playerCount;
    const reduction = baseReduction * hourMultiplier * playerMultiplier;
    return Math.round(reduction * 100) / 100;
};

export const CrimeImpactIndicator: React.FC<CrimeImpactIndicatorProps> = ({
                                                                              playerStats,
                                                                              selectedHours
                                                                          }) => {
    const [crimeStats, setCrimeStats] = useState<DepartmentCrimeDisplay | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCrimeData();
    }, [playerStats.department]);

    const loadCrimeData = async () => {
        if (!playerStats.department ||
            playerStats.department === 'Sisekaitseakadeemia' ||
            !playerStats.prefecture) {
            setLoading(false);
            return;
        }

        try {
            const data = await getAllDepartmentData();
            const departmentCrime = findDepartmentCrimeStats(data, playerStats.department);
            setCrimeStats(departmentCrime);
        } catch (error) {
            console.error('Error loading crime data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Don't show for Sisekaitseakadeemia
    if (!playerStats.department ||
        playerStats.department === 'Sisekaitseakadeemia' ||
        !playerStats.prefecture ||
        loading ||
        !crimeStats ||
        selectedHours === 0) {
        return null;
    }

    const reductionAmount = calculateCrimeReduction(selectedHours, crimeStats.playerCount);
    const newCrimeLevel = Math.max(0, crimeStats.currentCrimeLevel - reductionAmount);

    const getCrimeColor = (level: number): string => {
        if (level >= 80) return '#ff3838';
        if (level >= 60) return '#ffa502';
        if (level >= 40) return '#f39c12';
        if (level >= 20) return '#2ecc71';
        return '#27ae60';
    };

    return (
        <div className="crime-impact-indicator">
            <div className="crime-impact-header">
                <span className="crime-icon">🚨</span>
                <span className="crime-title">Kuritegevuse mõju</span>
            </div>

            <div className="crime-impact-details">
                <div className="crime-before-after">
                    <div className="crime-current">
                        <span className="crime-label">Praegu:</span>
                        <span
                            className="crime-percentage"
                            style={{ color: getCrimeColor(crimeStats.currentCrimeLevel) }}
                        >
                            {crimeStats.currentCrimeLevel.toFixed(1)}%
                        </span>
                    </div>

                    <div className="crime-arrow">→</div>

                    <div className="crime-after">
                        <span className="crime-label">Pärast:</span>
                        <span
                            className="crime-percentage"
                            style={{ color: getCrimeColor(newCrimeLevel) }}
                        >
                            {newCrimeLevel.toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div className="crime-reduction">
                    <span className="reduction-amount">-{reductionAmount}%</span>
                    <span className="reduction-label">kuritegevus</span>
                </div>
            </div>

            <div className="crime-department-info">
                <span className="department-name">{playerStats.department}</span>
                <span className="player-count">({crimeStats.playerCount} ametnikku)</span>
            </div>
        </div>
    );
};