// src/components/training/AttributesDisplay.tsx
import React from 'react';
import { PlayerAttributes } from '../../types';
import '../../styles/components/training/AttributesDisplay.css';

interface AttributesDisplayProps {
    attributes: PlayerAttributes;
}

export const AttributesDisplay: React.FC<AttributesDisplayProps> = ({ attributes }) => {
    const attributesList = [
        { key: 'strength', name: 'Jõud', icon: '💪', data: attributes.strength },
        { key: 'agility', name: 'Kiirus', icon: '🏃', data: attributes.agility },
        { key: 'dexterity', name: 'Osavus', icon: '🎯', data: attributes.dexterity },
        { key: 'intelligence', name: 'Intelligentsus', icon: '🧠', data: attributes.intelligence },
        { key: 'endurance', name: 'Vastupidavus', icon: '❤️', data: attributes.endurance }
    ];

    return (
        <div className="attributes-container">
            <h3 className="attributes-title">Sinu omadused</h3>
            <div className="attributes-grid">
                {attributesList.map(attr => (
                    <div key={attr.key} className="attribute-card">
                        <div className="attribute-header">
                            <span className="attribute-icon">{attr.icon}</span>
                            <span className="attribute-name">{attr.name}</span>
                        </div>
                        <div className="attribute-level">Tase {attr.data.level}</div>
                        <div className="attribute-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${(attr.data.experience / attr.data.experienceForNextLevel) * 100}%`
                                    }}
                                />
                            </div>
                            <span className="progress-text">
                                {attr.data.experience} / {attr.data.experienceForNextLevel} XP
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};