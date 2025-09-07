// src/components/dashboard/PlayerStatsCard.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { getExpProgress } from '../../services/PlayerService';
import { Timestamp } from 'firebase/firestore';
import { calculateEquipmentBonuses } from "../../services/EquipmentBonusService";
import { getRankImagePath } from "../../utils/rankUtils";
import { getPositionName } from '../../data/policePositions';
import { isPoliceOfficer } from "../../utils/playerStatus";
import { formatMoney, formatPollid } from '../../utils/currencyUtils';
import '../../styles/components/PlayerStatsCard.css';

interface PlayerStatsCardProps {
    stats: PlayerStats;
    username: string;
    onHealthUpdate?: () => void;
    onHealthModalOpen?: () => void;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({
                                                                    stats,
                                                                    username,
                                                                    onHealthUpdate,
                                                                    onHealthModalOpen
                                                                }) => {
    const expProgress = getExpProgress(stats.experience);
    const expPercentage = expProgress.percentage;
    const [healthRecoveryTime, setHealthRecoveryTime] = useState<string>('');

    const equipmentBonuses = stats.equipment ? calculateEquipmentBonuses(stats.equipment) : null;

    // Calculate health recovery timer
    useEffect(() => {
        if (!stats.health || stats.health.current >= stats.health.max) {
            setHealthRecoveryTime('');
            return;
        }

        const calculateTimeToNextRecovery = () => {
            if (!stats.lastHealthUpdate) {
                setHealthRecoveryTime('60:00');
                return;
            }

            let lastUpdateDate: Date;
            if (stats.lastHealthUpdate instanceof Timestamp) {
                lastUpdateDate = stats.lastHealthUpdate.toDate();
            } else if (stats.lastHealthUpdate && typeof stats.lastHealthUpdate === 'object' && 'seconds' in stats.lastHealthUpdate) {
                lastUpdateDate = new Date((stats.lastHealthUpdate as any).seconds * 1000);
            } else {
                lastUpdateDate = new Date(stats.lastHealthUpdate);
            }

            const now = new Date();
            const timeSinceLastUpdate = now.getTime() - lastUpdateDate.getTime();
            const msPerHour = 60 * 60 * 1000;
            const timeToNextRecovery = msPerHour - (timeSinceLastUpdate % msPerHour);

            const minutes = Math.floor(timeToNextRecovery / 60000);
            const seconds = Math.floor((timeToNextRecovery % 60000) / 1000);

            setHealthRecoveryTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateTimeToNextRecovery();
        const interval = setInterval(calculateTimeToNextRecovery, 1000);
        return () => clearInterval(interval);
    }, [stats.health, stats.lastHealthUpdate]);

    // Player status helpers
    const isKadett = stats.policePosition === 'kadett';
    const isAbipolitseinik = stats.policePosition === 'abipolitseinik';

    const getPrefectureDisplay = () => {
        if (isKadett) {
            return 'Sisekaitseakadeemia';
        }
        return stats.prefecture || 'Määramata';
    };

    const getDepartmentDisplay = () => {
        if (isKadett) {
            return 'Politsei- ja Piirivalvekolledž';
        }
        if (isAbipolitseinik) {
            return '—';
        }
        if (isPoliceOfficer(stats)) {
            return stats.department || 'Määramata';
        }
        return '—';
    };

    const getHealthStatus = () => {
        if (!stats.health) return { text: '—', color: '', showRecovery: false };
        const percentage = (stats.health.current / stats.health.max) * 100;
        const showRecovery = stats.health.current < stats.health.max;

        if (percentage >= 75) return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-good', showRecovery };
        if (percentage >= 50) return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-medium', showRecovery };
        if (percentage >= 25) return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-low', showRecovery };
        return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-critical', showRecovery };
    };

    const healthStatus = getHealthStatus();

    return (
        <div className={`player-stats-card ${stats.isVip ? 'vip-player' : ''}`}>
            {/* Header Section */}
            <div className="stats-header">
                <div className="player-identity">
                    <div className="rank-section">
                        <div className="rank-image-container">
                            <img
                                src={getRankImagePath(stats.rank) || ''}
                                alt={`${stats.rank || stats.policePosition || 'kadett'} märk`}
                                className="rank-image-playerstats"
                            />
                        </div>
                        <div className="rank-info">
                            <h2 className="player-username">{username}</h2>
                            <div className="player-badges">
                                <span className="badge-number">#{stats.badgeNumber || 'N/A'}</span>
                                <span className="police-rank">{getPositionName(stats.policePosition)}</span>
                                {stats.isVip && <span className="vip-badge-playerstats">VIP</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="level-section">
                    <div className="level-circle">
                        <span className="level-number">{stats.level || 1}</span>
                        <span className="level-label">TASE</span>
                    </div>
                </div>

                {/* Mobile-only money and pollid */}
                <div className="mobile-currency">
                    <div className="currency-item">
                        <span className="currency-icon">💰</span>
                        <span className="currency-value">{formatMoney(stats.money || 0)}</span>
                    </div>
                    <div className="currency-item">
                        <span className="currency-icon">💎</span>
                        <span className="currency-value">{formatPollid(stats.pollid || 0, false)}</span>
                    </div>
                </div>
            </div>

            {/* Experience Bar */}
            <div className="experience-section">
                <div className="exp-info">
                    <span className="exp-label">Kogemus</span>
                    <span className="exp-numbers">{expProgress.current} / {expProgress.needed} XP</span>
                </div>
                <div className="exp-bar">
                    <div className="exp-progress" style={{ width: `${expPercentage}%` }}></div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="main-stats-grid">
                <div className="stat-item">
                    <span className="stat-icon">🏛️</span>
                    <div className="stat-content">
                        <span className="stat-label">Prefektuur</span>
                        <span className="stat-value">{getPrefectureDisplay()}</span>
                    </div>
                </div>

                <div className="stat-item">
                    <span className="stat-icon">👮</span>
                    <div className="stat-content">
                        <span className="stat-label">Osakond</span>
                        <span className="stat-value">{getDepartmentDisplay()}</span>
                    </div>
                </div>

                <div
                    className="stat-item clickable health-card"
                    onClick={() => onHealthModalOpen?.()}
                >
                    <span className="stat-icon">❤️</span>
                    <div className="stat-content">
                        <span className="stat-label">Tervis</span>
                        <span className={`stat-value ${healthStatus.color}`}>
                            {healthStatus.text}
                            {healthStatus.showRecovery && healthRecoveryTime && (
                                <span className="recovery-timer">+5 HP: {healthRecoveryTime}</span>
                            )}
                        </span>
                    </div>
                    <div className="click-hint">Kliki ravimiseks</div>
                </div>

                <div className="stat-item">
                    <span className="stat-icon">⏱️</span>
                    <div className="stat-content">
                        <span className="stat-label">Töötunnid</span>
                        <span className="stat-value">{stats.totalWorkedHours || 0}h</span>
                    </div>
                </div>

                <div className="stat-item">
                    <span className="stat-icon">📚</span>
                    <div className="stat-content">
                        <span className="stat-label">Kursused</span>
                        <span className="stat-value">{stats.completedCourses?.length || 0}</span>
                    </div>
                </div>
            </div>

            {/* All Attributes Section - Icons Only */}
            {stats.attributes && (
                <div className="attributes-section">
                    <h3 className="section-title">Omadused</h3>
                    <div className="attributes-grid">
                        {/* Physical Attributes - WITH equipment bonuses */}
                        <div className="attribute-item">
                            <span className="attribute-icon">💪</span>
                            <span className="attribute-level">
                    {stats.attributes.strength.level}
                                {equipmentBonuses && equipmentBonuses.strength > 0 && (
                                    <span className="equipment-bonus">+{equipmentBonuses.strength}</span>
                                )}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🏃</span>
                            <span className="attribute-level">
                    {stats.attributes.agility.level}
                                {equipmentBonuses && equipmentBonuses.agility > 0 && (
                                    <span className="equipment-bonus">+{equipmentBonuses.agility}</span>
                                )}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🎯</span>
                            <span className="attribute-level">
                    {stats.attributes.dexterity.level}
                                {equipmentBonuses && equipmentBonuses.dexterity > 0 && (
                                    <span className="equipment-bonus">+{equipmentBonuses.dexterity}</span>
                                )}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🧠</span>
                            <span className="attribute-level">
                    {stats.attributes.intelligence.level}
                                {equipmentBonuses && equipmentBonuses.intelligence > 0 && (
                                    <span className="equipment-bonus">+{equipmentBonuses.intelligence}</span>
                                )}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🏋️</span>
                            <span className="attribute-level">
                    {stats.attributes.endurance.level}
                                {equipmentBonuses && equipmentBonuses.endurance > 0 && (
                                    <span className="equipment-bonus">+{equipmentBonuses.endurance}</span>
                                )}
                </span>
                        </div>

                        {/* Kitchen & Lab Attributes - NO equipment bonuses */}
                        <div className="attribute-item">
                            <span className="attribute-icon">🍳</span>
                            <span className="attribute-level">
                    {stats.attributes.cooking.level}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🥤</span>
                            <span className="attribute-level">
                    {stats.attributes.brewing.level}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🧪</span>
                            <span className="attribute-level">
                    {stats.attributes.chemistry.level}
                </span>
                        </div>

                        {/* Handicraft Attributes - NO equipment bonuses */}
                        <div className="attribute-item">
                            <span className="attribute-icon">🪡</span>
                            <span className="attribute-level">
                    {stats.attributes.sewing.level}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🏥</span>
                            <span className="attribute-level">
                    {stats.attributes.medicine.level}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">🖨️</span>
                            <span className="attribute-level">
                    {stats.attributes.printing.level}
                </span>
                        </div>

                        <div className="attribute-item">
                            <span className="attribute-icon">✂️</span>
                            <span className="attribute-level">
                    {stats.attributes.lasercutting.level}
                </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};