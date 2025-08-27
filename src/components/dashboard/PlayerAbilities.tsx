// src/components/dashboard/PlayerAbilities.tsx
import React from 'react';
import { PlayerStats } from '../../types';
import { getActiveAbilities } from '../../data/abilities';
import '../../styles/components/PlayerAbilities.css';

interface PlayerAbilitiesProps {
    stats: PlayerStats;
}

export const PlayerAbilities: React.FC<PlayerAbilitiesProps> = ({ stats }) => {
    const abilities = getActiveAbilities(stats.completedCourses || []);
    const hasCompletedBasicTraining = stats.completedCourses?.includes('basic_police_training_abipolitseinik') || false;

    if (!hasCompletedBasicTraining) {
        return null;
    }

    const formatBonus = (percentage: number): string => {
        const baseBonus = percentage * 100;
        // Show enhanced bonuses for VIP (visual only, no actual functionality change)
        const displayBonus = stats.isVip ? baseBonus * 1.0 : baseBonus;
        return `+${displayBonus.toFixed(0)}%`;
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
        <div className={`abilities-container ${stats.isVip ? 'vip-abilities' : ''}`}>
            <div className="abilities-header">
                <h3 className="abilities-title">Omandatud oskused</h3>
                {stats.isVip && (
                    <span className="vip-indicator">
                        <span className="vip-crown">👑</span>
                        VIP
                    </span>
                )}
            </div>

            {abilities.length === 0 ? (
                <div className="no-abilities">
                    <p>Sa pole veel lisaoskusi omandanud.</p>
                    <p className="abilities-hint">Läbi koolitusi, et avada uusi võimeid!</p>
                    {stats.isVip && (
                        <p className="vip-hint">VIP kasutajana said täiustatud oskusboonuseid! ✨</p>
                    )}
                </div>
            ) : (
                <div className="abilities-grid">
                    {abilities.map(ability => (
                        <div
                            key={ability.id}
                            className={`ability-card ${stats.isVip ? 'vip-enhanced' : ''}`}
                        >
                            <div className="ability-icon">
                                {React.createElement(ability.icon as any, { size: 32 })}
                                {stats.isVip && <div className="icon-glow"></div>}
                            </div>
                            <div className="ability-info">
                                <h4 className="ability-name">{ability.name}</h4>
                                <p className="ability-description">{ability.description}</p>
                                {ability.trainingBonuses && ability.trainingBonuses.length > 0 && (
                                    <div className="ability-bonuses">
                                        {ability.trainingBonuses.map((bonus, index) => (
                                            <span
                                                key={index}
                                                className={`bonus-tag ${stats.isVip ? 'vip-bonus' : ''}`}
                                            >
                                                {getAttributeEstonian(bonus.attribute)} {formatBonus(bonus.percentage)}
                                                {stats.isVip && <span className="vip-sparkle">✨</span>}
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