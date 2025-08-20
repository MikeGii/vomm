// src/components/training/AttributesDisplay.tsx
import React from 'react';
import { PlayerAttributes } from '../../types';
import '../../styles/components/training/AttributesDisplay.css';

interface AttributeConfig {
    key: keyof PlayerAttributes;
    name: string;
    icon: string;
}

interface AttributesDisplayProps {
    attributes: PlayerAttributes;
    title?: string;
    displayAttributes: AttributeConfig[];
}

export const AttributesDisplay: React.FC<AttributesDisplayProps> = ({
                                                                        attributes,
                                                                        title = 'Sinu omadused',
                                                                        displayAttributes
                                                                    }) => {
    return (
        <div className="attributes-container">
            <h3 className="attributes-title">{title}</h3>
            <div className="attributes-grid">
                {displayAttributes.map(attr => {
                    const data = attributes[attr.key];
                    if (!data) return null;

                    return (
                        <div key={attr.key} className="attribute-card">
                            <div className="attribute-header">
                                <span className="attribute-icon">{attr.icon}</span>
                                <span className="attribute-name">{attr.name}</span>
                            </div>
                            <div className="attribute-level">Tase {data.level}</div>
                            <div className="attribute-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${(data.experience / data.experienceForNextLevel) * 100}%`
                                        }}
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
        </div>
    );
};