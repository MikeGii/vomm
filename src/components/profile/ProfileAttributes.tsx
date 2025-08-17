// src/components/profile/ProfileAttributes.tsx
import React from 'react';
import { PlayerAttributes } from '../../types';
import '../../styles/components/profile/ProfileAttributes.css';

interface ProfileAttributesProps {
    attributes: PlayerAttributes;
}

export const ProfileAttributes: React.FC<ProfileAttributesProps> = ({ attributes }) => {
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
                {Object.entries(attributes).map(([key, data]) => (
                    <div key={key} className="attribute-card">
                        <div className="attribute-header">
                            <span className="attribute-icon">{getAttributeIcon(key)}</span>
                            <span className="attribute-name">{getAttributeName(key)}</span>
                        </div>
                        <div className="attribute-level">Tase {data.level}</div>
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
                ))}
            </div>
        </div>
    );
};