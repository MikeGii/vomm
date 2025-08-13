// src/components/dashboard/PlayerStatsCard.tsx
import React from 'react';
import { PlayerStats } from '../../types';
import '../../styles/components/PlayerStatsCard.css';

interface PlayerStatsCardProps {
    stats: PlayerStats;
    username: string;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ stats, username }) => {
    // Calculate progress to next level (simple formula for now)
    const expForNextLevel = stats.level * 100;
    const expProgress = (stats.experience / expForNextLevel) * 100;

    return (
        <div className="stats-card">
            <div className="stats-header">
                <h2 className="stats-username">{username}</h2>
                {stats.badgeNumber && (
                    <div className="stats-badge">
                        <span className="badge-label">Märk</span>
                        <span className="badge-number">#{stats.badgeNumber}</span>
                    </div>
                )}
            </div>

            <div className="stats-grid">
                <div className="stat-item stat-level">
                    <span className="stat-label">Tase</span>
                    <span className="stat-value">{stats.level}</span>
                    <div className="exp-bar">
                        <div
                            className="exp-progress"
                            style={{ width: `${expProgress}%` }}
                        />
                    </div>
                    <span className="exp-text">
                        {stats.experience} / {expForNextLevel} XP
                    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Staatus</span>
                    <span className={`stat-value ${stats.isEmployed ? 'stat-employed' : 'stat-unemployed'}`}>
                        {stats.isEmployed ? 'Politseinik' : 'Töötu'}
                    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Auaste</span>
                    <span className="stat-value stat-rank">
                        {stats.rank || 'Puudub'}
                    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Osakond</span>
                    <span className="stat-value">
                        {stats.department || 'Puudub'}
                    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Maine</span>
                    <span className="stat-value">{stats.reputation}</span>
                </div>
            </div>

            {stats.isEmployed && (
                <div className="stats-achievements">
                    <div className="achievement-item">
                        <span className="achievement-value">{stats.casesCompleted}</span>
                        <span className="achievement-label">Lahendatud juhtumit</span>
                    </div>
                    <div className="achievement-item">
                        <span className="achievement-value">{stats.criminalsArrested}</span>
                        <span className="achievement-label">Kinni peetud kurjategijat</span>
                    </div>
                </div>
            )}

            {!stats.isEmployed && (
                <div className="unemployed-message">
                    <p>Sa ei ole veel politseiteenistusse astunud.</p>
                    <p>Kandideeri tööle, et alustada oma karjääri korrakaitsjana!</p>
                </div>
            )}
        </div>
    );
};