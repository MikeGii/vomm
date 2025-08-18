// src/components/dashboard/PlayerStatsCard.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { getExpProgress } from '../../services/PlayerService';
import { Timestamp } from 'firebase/firestore';
import {calculateEquipmentBonuses} from "../../services/EquipmentBonusService";
import { HealthModal } from '../health/HealthModal';
import '../../styles/components/PlayerStatsCard.css';

interface PlayerStatsCardProps {
    stats: PlayerStats;
    username: string;
    onHealthUpdate?: () => void;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ stats, username, onHealthUpdate }) => {
    const expProgress = getExpProgress(stats.experience);
    const expPercentage = expProgress.percentage;
    const [healthRecoveryTime, setHealthRecoveryTime] = useState<string>('');
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

    // Calculate health recovery timer
    useEffect(() => {
        if (!stats.health || stats.health.current >= stats.health.max) {
            setHealthRecoveryTime('');
            return;
        }

        const calculateTimeToNextRecovery = () => {
            // If no lastHealthUpdate, initialize it
            if (!stats.lastHealthUpdate) {
                setHealthRecoveryTime('60:00');
                return;
            }

            // Convert to Date
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

            // Calculate time until next 5 HP recovery (1 hour = 5 HP)
            const msPerHour = 60 * 60 * 1000;
            const timeToNextRecovery = msPerHour - (timeSinceLastUpdate % msPerHour);

            // Format time
            const minutes = Math.floor(timeToNextRecovery / 60000);
            const seconds = Math.floor((timeToNextRecovery % 60000) / 1000);

            setHealthRecoveryTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateTimeToNextRecovery();
        const interval = setInterval(calculateTimeToNextRecovery, 1000);

        return () => clearInterval(interval);
    }, [stats.health, stats.lastHealthUpdate]);

    // Handle health update from modal
    const handleHealthModalUpdate = () => {
        // Call parent's onHealthUpdate if provided
        if (onHealthUpdate) {
            onHealthUpdate();
        }
    };

    // Check if player is a Kadett (in academy)
    const isKadett = stats.completedCourses?.includes('sisekaitseakadeemia_entrance');
    // TODO: In future, check if graduated (when graduation course is implemented)
    // const hasGraduated = stats.completedCourses?.includes('sisekaitseakadeemia_graduation');

    // Determine what to show for location
    const getLocationInfo = () => {
        // Check if graduated from academy
        if (stats.completedCourses?.includes('lopueksam')) {
            // Graduated officer
            return {
                icon: '🏛️',
                title: 'Prefektuur',
                value: stats.department ?
                    `${stats.prefecture} - ${stats.department}` :
                    stats.prefecture || 'Määramata'
            };
        } else if (stats.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            // Kadett in academy
            return {
                icon: '🎓',
                title: 'Akadeemia',
                value: 'Sisekaitseakadeemia'
            };
        } else {
            // Regular officer or abipolitseinik
            return {
                icon: '🏛️',
                title: 'Prefektuur',
                value: stats.prefecture || 'Määramata'
            };
        }
    };

    const equipmentBonuses = stats.equipment ? calculateEquipmentBonuses(stats.equipment) : null;
    const hasEquipmentBonuses = equipmentBonuses && Object.values(equipmentBonuses).some(v => v > 0);

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
    const locationInfo = getLocationInfo();

    return (
        <div className="player-stats-card">
            {/* Header Section */}
            <div className="stats-header-section">
                <div className="player-info">
                    <h2 className="player-username">{username}</h2>
                    <div className="player-badges">
                        {stats.badgeNumber && (
                            <span className="badge-display">
                                Ametitõend #{stats.badgeNumber}
                            </span>
                        )}
                        {stats.rank && (
                            <span className="rank-display">{stats.rank}</span>
                        )}
                    </div>
                </div>
                <div className="level-display">
                    <span className="level-number">{stats.level}</span>
                    <span className="level-label">TASE</span>
                </div>
            </div>

            {/* Experience Bar */}
            <div className="experience-section">
                <div className="exp-info">
                    <span className="exp-label">Kogemus</span>
                    <span className="exp-numbers">{expProgress.current} / {expProgress.needed} XP</span>
                </div>
                <div className="exp-bar-large">
                    <div
                        className="exp-progress-large"
                        style={{ width: `${expPercentage}%` }}
                    />
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="stats-main-grid">
                <div className={`stat-card ${isKadett ? 'academy-highlight' : ''}`}>
                    <span className="stat-icon">{locationInfo.icon}</span>
                    <div className="stat-content">
                        <span className="stat-title">{locationInfo.title}</span>
                        <span className="stat-value">{locationInfo.value}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">🏢</span>
                    <div className="stat-content">
                        <span className="stat-title">Osakond</span>
                        <span className="stat-value">
                            {isKadett ? 'Politsei- ja Piirivalvekolledž' : (stats.department || 'Määramata')}
                        </span>
                    </div>
                </div>

                <div
                    className="stat-card health-card clickable"
                    onClick={() => setIsHealthModalOpen(true)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                >
                    <span className="stat-icon">❤️</span>
                    <div className="stat-content">
                        <span className="stat-title">Tervis</span>
                        <span className={`stat-value ${healthStatus.color}`}>
                            {healthStatus.text}
                        </span>
                        {healthStatus.showRecovery && healthRecoveryTime && (
                            <span className="health-recovery-timer">
                                +5 HP: {healthRecoveryTime}
                            </span>
                        )}
                    </div>
                    <div className="click-hint">Kliki ravimiseks</div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">⏱️</span>
                    <div className="stat-content">
                        <span className="stat-title">Töötunnid</span>
                        <span className="stat-value">{stats.totalWorkedHours || 0}h</span>
                    </div>
                </div>
            </div>

            {/* Achievement Stats */}
            {stats.hasCompletedTraining && (
                <div className="achievements-section">
                    <h3 className="section-title">Saavutused</h3>
                    <div className="achievements-grid">
                        <div className="achievement-stat">
                            <span className="achievement-number">{stats.casesCompleted}</span>
                            <span className="achievement-label">Lahendatud juhtumit</span>
                        </div>
                        <div className="achievement-stat">
                            <span className="achievement-number">{stats.criminalsArrested}</span>
                            <span className="achievement-label">Kinni peetud kurjategijat</span>
                        </div>
                        <div className="achievement-stat">
                            <span className="achievement-number">{stats.completedCourses?.length || 0}</span>
                            <span className="achievement-label">Läbitud koolitust</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Attributes Section with Equipment Bonuses */}
            {stats.attributes && (
                <div className="attributes-section">
                    <h3 className="section-title">Omadused</h3>
                    <div className="attributes-compact-grid">
                        <div className="attribute-compact">
                            <span className="attribute-emoji">💪</span>
                            <span className="attribute-name">Jõud</span>
                            <span className="attribute-value">
                    {stats.attributes.strength.level}
                                {equipmentBonuses?.strength ? (
                                    <span className="equipment-bonus"> +{equipmentBonuses.strength}</span>
                                ) : null}
                </span>
                        </div>
                        <div className="attribute-compact">
                            <span className="attribute-emoji">🏃</span>
                            <span className="attribute-name">Kiirus</span>
                            <span className="attribute-value">
                    {stats.attributes.agility.level}
                                {equipmentBonuses?.agility ? (
                                    <span className="equipment-bonus"> +{equipmentBonuses.agility}</span>
                                ) : null}
                </span>
                        </div>
                        <div className="attribute-compact">
                            <span className="attribute-emoji">🎯</span>
                            <span className="attribute-name">Osavus</span>
                            <span className="attribute-value">
                    {stats.attributes.dexterity.level}
                                {equipmentBonuses?.dexterity ? (
                                    <span className="equipment-bonus"> +{equipmentBonuses.dexterity}</span>
                                ) : null}
                </span>
                        </div>
                        <div className="attribute-compact">
                            <span className="attribute-emoji">🧠</span>
                            <span className="attribute-name">Intelligentsus</span>
                            <span className="attribute-value">
                    {stats.attributes.intelligence.level}
                                {equipmentBonuses?.intelligence ? (
                                    <span className="equipment-bonus"> +{equipmentBonuses.intelligence}</span>
                                ) : null}
                </span>
                        </div>
                        <div className="attribute-compact">
                            <span className="attribute-emoji">🏋️</span>
                            <span className="attribute-name">Vastupidavus</span>
                            <span className="attribute-value">
                    {stats.attributes.endurance.level}
                                {equipmentBonuses?.endurance ? (
                                    <span className="equipment-bonus"> +{equipmentBonuses.endurance}</span>
                                ) : null}
                </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {!stats.hasCompletedTraining && (
                <div className="status-message warning">
                    <span className="status-icon">⚠️</span>
                    <div>
                        <p className="status-title">Alusta karjääri</p>
                        <p className="status-text">Läbi abipolitseiniku baaskoolitus, et astuda politseiteenistusse!</p>
                    </div>
                </div>
            )}

            {isKadett && (
                <div className="status-message academy">
                    <span className="status-icon">🎓</span>
                    <div>
                        <p className="status-title">Sisekaitseakadeemia kadett</p>
                        <p className="status-text">Õpid Sisekaitseakadeemias, et saada politseiametnikuks.</p>
                    </div>
                </div>
            )}

            {stats.activeCourse && (
                <div className="status-message info">
                    <span className="status-icon">📚</span>
                    <div>
                        <p className="status-title">Koolitus käib</p>
                        <p className="status-text">Oled hetkel koolitusel. Oota kuni see lõppeb.</p>
                    </div>
                </div>
            )}

            {stats.activeWork && (
                <div className="status-message info">
                    <span className="status-icon">🚓</span>
                    <div>
                        <p className="status-title">Töö käib</p>
                        <p className="status-text">Oled hetkel tööl. Oota kuni vahetus lõppeb.</p>
                    </div>
                </div>
            )}

            {/* Health Modal */}
            <HealthModal
                isOpen={isHealthModalOpen}
                onClose={() => setIsHealthModalOpen(false)}
                playerStats={stats}
                onHealthUpdate={handleHealthModalUpdate}
            />
        </div>
    );
};