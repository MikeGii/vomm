// src/components/patrol/HealthDisplay.tsx
import React from 'react';
import { PlayerHealth } from '../../types';
import '../../styles/components/patrol/HealthDisplay.css';

interface HealthDisplayProps {
    health?: PlayerHealth;
}

export const HealthDisplay: React.FC<HealthDisplayProps> = ({ health }) => {
    if (!health) {
        return (
            <div className="health-display">
                <h3>Tervis</h3>
                <p className="no-health">Tervise andmed puuduvad</p>
            </div>
        );
    }

    const healthPercentage = (health.current / health.max) * 100;

    const getHealthColor = () => {
        if (healthPercentage >= 75) return '#4caf50';
        if (healthPercentage >= 50) return '#ff9800';
        if (healthPercentage >= 25) return '#ff6b6b';
        return '#d32f2f';
    };

    return (
        <div className="health-display">
            <div className="health-header">
                <h3>Tervis</h3>
                <span className="health-value">
                    {health.current} / {health.max}
                </span>
            </div>

            <div className="health-bar">
                <div
                    className="health-fill"
                    style={{
                        width: `${healthPercentage}%`,
                        backgroundColor: getHealthColor()
                    }}
                />
            </div>

            <div className="health-details">
                <span>Baastervis: {health.baseHealth}</span>
                <span>Jõu boonus: +{health.strengthBonus}</span>
                <span>Vastupidavuse boonus: +{health.enduranceBonus}</span>
            </div>

            {health.current < 50 && (
                <div className="health-warning">
                    ⚠️ Tervis on liiga madal töötamiseks! Minimaalne tervis on 50.
                </div>
            )}
        </div>
    );
};