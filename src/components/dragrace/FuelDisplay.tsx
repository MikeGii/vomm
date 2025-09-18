// src/components/dragrace/FuelDisplay.tsx
import React from 'react';
import { FuelSystem } from '../../types/dragRace';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import '../../styles/components/dragrace/FuelDisplay.css'

interface FuelDisplayProps {
    fuelSystem: FuelSystem | null;
    onPurchaseFuel: () => void;
}

export const FuelDisplay: React.FC<FuelDisplayProps> = ({ fuelSystem, onPurchaseFuel }) => {
    const { playerStats } = usePlayerStats();
    const isVip = playerStats?.isVip || false;

    if (!fuelSystem) {
        return (
            <div className="dr-fuel-display dr-loading">
                <span className="dr-fuel-icon">⛽</span>
                <span>Laen kütuse andmeid...</span>
            </div>
        );
    }

    const timeUntilReset = fuelSystem.nextResetTime.getTime() - Date.now();
    const minutesUntilReset = Math.max(0, Math.ceil(timeUntilReset / (1000 * 60)));

    return (
        <div className={`dr-fuel-display ${isVip ? 'vip-fuel' : ''}`}>
            <div className="dr-fuel-header">
                <span className="dr-fuel-icon">⛽</span>
                <h3 className="dr-fuel-title">
                    Kütus
                    {isVip && <span className="vip-badge">VIP</span>}
                </h3>
            </div>

            <div className="dr-fuel-info">
                <div className="dr-fuel-current">
                    <span className="dr-fuel-amount">{fuelSystem.currentFuel}</span>
                    <span className="dr-fuel-label">
                        / {fuelSystem.maxFreeFuel} katset
                        {isVip && <span className="vip-bonus"> (2x)</span>}
                    </span>
                </div>

                {fuelSystem.currentFuel < fuelSystem.maxFreeFuel && (
                    <div className="dr-fuel-reset-info">
                        <span className="dr-reset-time">
                            Täiendumine: {minutesUntilReset} min
                        </span>
                    </div>
                )}

                {fuelSystem.currentFuel === 0 && (
                    <button
                        className="dr-fuel-purchase-button"
                        onClick={onPurchaseFuel}
                    >
                        Osta kütust
                    </button>
                )}
            </div>
        </div>
    );
};