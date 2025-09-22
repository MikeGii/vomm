// src/components/department/tabs/PlayerInfoTab.tsx
import React from 'react';
import { PlayerStats } from '../../../types';
import { getPositionName } from '../../../data/policePositions';
import { getUnitById } from '../../../data/departmentUnits';
import { getRankImagePath } from '../../../utils/rankUtils';
import '../../../styles/components/department/tabs/PlayerInfoTab.css';

interface PlayerInfoTabProps {
    playerStats: PlayerStats;
}

export const PlayerInfoTab: React.FC<PlayerInfoTabProps> = ({ playerStats }) => {
    const unitName = playerStats.departmentUnit ?
        getUnitById(playerStats.departmentUnit)?.name || 'Määramata' : 'Määramata';

    return (
        <div className="player-info-tab">
            <div className="player-info-card">
                <div className="player-header">
                    <div className="player-avatar">
                        👮‍♂️
                    </div>
                    <div className="player-basic-info">
                        <h2 className="player-name">{playerStats.username}</h2>
                        <div className="player-level">Tase {playerStats.level}</div>
                    </div>
                </div>

                <div className="player-details">
                    <div className="detail-section">
                        <h3>Ametikoht ja auaste</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Ametikoht:</span>
                                <span className="detail-value">
                                    {getPositionName(playerStats.policePosition)}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Auaste:</span>
                                <div className="rank-display">
                                    <span className="rank-text">
                                        {playerStats.rank || 'Määramata'}
                                    </span>
                                    {playerStats.rank && getRankImagePath(playerStats.rank) && (
                                        <img
                                            src={getRankImagePath(playerStats.rank)!}
                                            alt={playerStats.rank}
                                            className="rank-image"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Teenistuskoht</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Prefektuur:</span>
                                <span className="detail-value">
                                    {playerStats.prefecture || 'Määramata'}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Osakond:</span>
                                <span className="detail-value">
                                    {playerStats.department || 'Määramata'}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Üksus:</span>
                                <span className="detail-value">{unitName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Töö statistika</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Töötunnid:</span>
                                <span className="detail-value">
                                    {Math.floor(playerStats.totalWorkedHours || 0)} tundi
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Maine:</span>
                                <span className="detail-value">
                                    {playerStats.reputation || 0}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Ametimärk:</span>
                                <span className="detail-value">
                                    {playerStats.badgeNumber || 'Määramata'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};