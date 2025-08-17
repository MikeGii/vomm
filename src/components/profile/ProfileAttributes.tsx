// src/components/profile/ProfileAttributes.tsx
import React from 'react';
import { PlayerAttributes } from '../../types';
import { CharacterEquipment } from '../../types/equipment';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
import '../../styles/components/profile/ProfileAttributes.css';

interface ProfileAttributesProps {
    attributes: PlayerAttributes;
    equipment?: CharacterEquipment;
}

export const ProfileAttributes: React.FC<ProfileAttributesProps> = ({ attributes, equipment }) => {

    const equipmentBonuses = equipment ? calculateEquipmentBonuses(equipment) : null;

    const getAttributeName = (key: string): string => {
        const names: { [key: string]: string } = {
            strength: 'Jõud',
            agility: 'Kiirus',
            dexterity: 'Osavus',
            intelligence: 'Intelligentsus',
            endurance: 'Vastupidavus'
        };
        return names[key] || key;
    };

    const getAttributeIcon = (key: string): string => {
        const icons: { [key: string]: string } = {
            strength: '💪',
            agility: '🏃',
            dexterity: '🎯',
            intelligence: '🧠',
            endurance: '🏋️'
        };
        return icons[key] || '📊';
    };

    return (
        <div className="profile-attributes">
            <h2 className="attributes-title">Omadused</h2>
            <div className="attributes-grid">
                {Object.entries(attributes).map(([key, data]) => {
                    const bonus = equipmentBonuses ? equipmentBonuses[key as keyof typeof equipmentBonuses] : 0;
                    const totalLevel = data.level + bonus;

                    return (
                        <div key={key} className="attribute-card">
                            <div className="attribute-header">
                                <span className="attribute-emoji">{getAttributeIcon(key)}</span>
                                <span className="attribute-name">{getAttributeName(key)}</span>
                            </div>
                            <div className="attribute-level">
                                <span className="level-label">Tase:</span>
                                <span className="level-value">
                                    <span className="base-level">{data.level}</span>
                                    {bonus > 0 && (
                                        <>
                                            <span className="equipment-bonus"> +{bonus}</span>
                                            <span className="total-level"> = {totalLevel}</span>
                                        </>
                                    )}
                                </span>
                            </div>
                            <div className="attribute-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(data.experience / data.experienceForNextLevel) * 100}%` }}
                                    />
                                </div>
                                <span className="progress-text">
                                    {data.experience} / {data.experienceForNextLevel} XP
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show total equipment bonuses summary */}
            {equipmentBonuses && Object.values(equipmentBonuses).some(v => v > 0) && (
                <div className="equipment-summary">
                    <h3>Varustuse boonused kokku:</h3>
                    <div className="bonus-summary">
                        {Object.entries(equipmentBonuses).map(([attr, bonus]) =>
                            bonus > 0 ? (
                                <span key={attr} className="bonus-pill">
                                    {getAttributeName(attr)}: +{bonus}
                                </span>
                            ) : null
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};