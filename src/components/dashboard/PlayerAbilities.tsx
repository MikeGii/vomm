// src/components/dashboard/PlayerAbilities.tsx
import React from 'react';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { PlayerStats } from '../../types';
import { getActiveAbilities } from '../../data/abilities';
import '../../styles/components/PlayerAbilities.css';

interface PlayerAbilitiesProps {
    stats: PlayerStats;
}

export const PlayerAbilities: React.FC<PlayerAbilitiesProps> = ({ stats }) => {
    const { isVip } = usePlayerStats();

    const abilities = getActiveAbilities(stats.completedCourses || []);
    const hasCompletedBasicTraining = stats.completedCourses?.includes('basic_police_training_abipolitseinik') || false;

    if (!hasCompletedBasicTraining) {
        return null;
    }

    const formatBonus = (percentage: number): string => {
        const baseBonus = percentage * 100;
        // Show enhanced bonuses for VIP (visual only, no actual functionality change)
        const displayBonus = isVip ? baseBonus : baseBonus;
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
        <div className={`abilities-container ${isVip ? 'vip-abilities' : ''}`}>
            <div className="abilities-header">
                <h3 className="section-title">Omandatud oskused</h3>
            </div>

            {abilities.length === 0 ? (
                <div className="no-abilities">
                    <div className="no-abilities-icon">🎯</div>
                    <div className="no-abilities-content">
                        <h4>Pole veel oskusi omandanud</h4>
                        <p>Läbi koolitusi, et avada uusi võimeid!</p>
                        {isVip && (
                            <p className="vip-hint">
                                <span className="vip-sparkle">✨</span>
                                VIP kasutajana saad täiustatud oskusboonuseid!
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="abilities-grid">
                    {abilities.map(ability => (
                        <div
                            key={ability.id}
                            className={`ability-card ${isVip ? 'vip-enhanced' : ''}`}
                        >
                            {isVip && <div className="vip-glow"></div>}

                            <div className="ability-content">
                                <div className="ability-icon">
                                    {React.createElement(ability.icon as any, { size: 32 })}
                                    {isVip && <div className="icon-glow"></div>}
                                </div>

                                <div className="ability-info">
                                    <h4 className="ability-name">{ability.name}</h4>
                                    <p className="ability-description">{ability.description}</p>

                                    {ability.trainingBonuses && ability.trainingBonuses.length > 0 && (
                                        <div className="ability-bonuses">
                                            {ability.trainingBonuses.map((bonus, index) => (
                                                <span
                                                    key={index}
                                                    className={`bonus-tag ${isVip ? 'vip-bonus' : ''}`}
                                                >
                                                    {getAttributeEstonian(bonus.attribute)} {formatBonus(bonus.percentage)}
                                                    {isVip && <span className="vip-sparkle">✨</span>}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};