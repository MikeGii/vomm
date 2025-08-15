// src/components/dashboard/PlayerAbilities.tsx
import React from 'react';
import { PlayerStats } from '../../types';
import { getAbilitiesByCompletedCourses } from '../../data/abilities';
import '../../styles/components/PlayerAbilities.css';

interface PlayerAbilitiesProps {
    stats: PlayerStats;
}

export const PlayerAbilities: React.FC<PlayerAbilitiesProps> = ({ stats }) => {
    const abilities = getAbilitiesByCompletedCourses(stats.completedCourses || []);

    if (!stats.hasCompletedTraining) {
        return null; // Don't show abilities section if not trained
    }

    return (
        <div className="abilities-container">
            <h3 className="abilities-title">Omandatud oskused</h3>

            {abilities.length === 0 ? (
                <div className="no-abilities">
                    <p>Sa pole veel lisaoskusi omandanud.</p>
                    <p className="abilities-hint">Läbi koolitusi, et avada uusi võimeid!</p>
                </div>
            ) : (
                <div className="abilities-grid">
                    {abilities.map(ability => (
                        <div key={ability.id} className="ability-card">
                            <div className="ability-icon">{ability.icon}</div>
                            <div className="ability-info">
                                <h4 className="ability-name">{ability.name}</h4>
                                <p className="ability-description">{ability.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};