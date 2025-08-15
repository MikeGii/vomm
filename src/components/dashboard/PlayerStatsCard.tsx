// src/components/dashboard/PlayerStatsCard.tsx
import React from 'react';
import { PlayerStats } from '../../types';
import '../../styles/components/PlayerStatsCard.css';
import {getExpProgress} from "../../services/PlayerService";

interface PlayerStatsCardProps {
    stats: PlayerStats;
    username: string;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ stats, username }) => {
    // Calculate progress to next level (simple formula for now)
    const expProgress = getExpProgress(stats.experience);
    const expPercentage = expProgress.percentage;

    return (
        <div className="stats-card">
            <div className="stats-header">
                <h2 className="stats-username">{username}</h2>
                <div className="stats-badge">
                    <span className="badge-label">Ametitõend</span>
                    <span className="badge-number">
                        {stats.badgeNumber ? `#${stats.badgeNumber}` : '—'}
                    </span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-item stat-level">
                    <span className="stat-label">Tase</span>
                    <span className="stat-value">{stats.level}</span>
                    <div className="exp-bar">
                        <div
                            className="exp-progress"
                            style={{ width: `${expPercentage}%` }}
                        />
                    </div>
                    <span className="exp-text">
    {expProgress.current} / {expProgress.needed} XP
</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Staatus</span>
                    <span className={`stat-value ${
                        stats.hasCompletedTraining
                            ? 'stat-employed'
                            : 'stat-untrained'
                    }`}>
        {stats.completedCourses?.includes('sisekaitseakadeemia_entrance')
            ? 'Kadett'
            : stats.hasCompletedTraining
                ? 'Abipolitseinik'
                : '—'}
    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Auaste</span>
                    <span className={`stat-value ${stats.rank ? 'stat-rank' : 'stat-unavailable'}`}>
                        {stats.rank || '—'}
                    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Prefektuur</span>
                    <span className={`stat-value ${!stats.prefecture && 'stat-unavailable'}`}>
        {stats.prefecture || '—'}
    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Osakond</span>
                    <span className={`stat-value ${!stats.department && 'stat-unavailable'}`}>
        {stats.department || '—'}
    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Maine</span>
                    <span className="stat-value">{stats.reputation}</span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Raha</span>
                    <span className="stat-value">{stats.money || 0} €</span>
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

            {!stats.hasCompletedTraining && (
                <div className="unemployed-message">
                    <p>Sa ei ole veel läbinud abipolitseiniku koolitust.</p>
                    <p>Alusta koolitusega, et astuda politseiteenistusse!</p>
                </div>
            )}

            {stats.hasCompletedTraining && !stats.isEmployed && (
                <div className="unemployed-message">
                    <p>Sa ei ole hetkel politseiteenistuses.</p>
                    <p>Kandideeri tööle, et jätkata oma karjääri!</p>
                </div>
            )}
        </div>
    );
};