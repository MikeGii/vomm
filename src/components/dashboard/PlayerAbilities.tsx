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
        return null;
    }

    const formatBonus = (percentage: number): string => {
        return `+${(percentage * 100).toFixed(0)}%`;
    };

    const getAttributeEstonian = (attr: string): string => {
        const translations: { [key: string]: string } = {
            'strength': 'Jõud',
            'agility': 'Kiirus',
            'dexterity': 'Osavus',
            'intelligence': 'Intelligentsus',
            'endurance': 'Vastupidavus'
        };
        return translations[attr] || attr;
    };

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
                                {ability.trainingBonuses && ability.trainingBonuses.length > 0 && (
                                    <div className="ability-bonuses">
                                        {ability.trainingBonuses.map((bonus, index) => (
                                            <span key={index} className="bonus-tag">
                                                {getAttributeEstonian(bonus.attribute)} {formatBonus(bonus.percentage)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};