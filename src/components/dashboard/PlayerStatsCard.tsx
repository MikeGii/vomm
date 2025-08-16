// src/components/dashboard/PlayerStatsCard.tsx
import React from 'react';
import { PlayerStats } from '../../types';
import { getExpProgress } from '../../services/PlayerService';
import '../../styles/components/PlayerStatsCard.css';

interface PlayerStatsCardProps {
    stats: PlayerStats;
    username: string;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ stats, username }) => {
    const expProgress = getExpProgress(stats.experience);
    const expPercentage = expProgress.percentage;

    // Check if player is a Kadett (in academy)
    const isKadett = stats.completedCourses?.includes('sisekaitseakadeemia_entrance');
    // TODO: In future, check if graduated (when graduation course is implemented)
    // const hasGraduated = stats.completedCourses?.includes('sisekaitseakadeemia_graduation');

    // Determine what to show for location
    const getLocationInfo = () => {
        if (isKadett) {
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

    const getHealthStatus = () => {
        if (!stats.health) return { text: '—', color: '' };
        const percentage = (stats.health.current / stats.health.max) * 100;

        if (percentage >= 75) return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-good' };
        if (percentage >= 50) return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-medium' };
        if (percentage >= 25) return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-low' };
        return { text: `${stats.health.current}/${stats.health.max}`, color: 'health-critical' };
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

                <div className="stat-card">
                    <span className="stat-icon">❤️</span>
                    <div className="stat-content">
                        <span className="stat-title">Tervis</span>
                        <span className={`stat-value ${healthStatus.color}`}>
                            {healthStatus.text}
                        </span>
                    </div>
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
        </div>
    );
};