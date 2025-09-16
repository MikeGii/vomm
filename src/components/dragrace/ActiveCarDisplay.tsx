// src/components/dragrace/ActiveCarDisplay.tsx (Updated)
import React from 'react';
import { PlayerCar } from '../../types/vehicles';
import { VehicleModel } from '../../types/vehicleDatabase';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import '../../styles/components/dragrace/ActiveCarDisplay.css'

interface ActiveCarDisplayProps {
    activeCar: { car: PlayerCar; model: VehicleModel } | null;
    onSelectCar: () => void;
}

export const ActiveCarDisplay: React.FC<ActiveCarDisplayProps> = ({ activeCar, onSelectCar }) => {
    if (!activeCar) {
        return (
            <div className="dr-active-car-display dr-no-car">
                <div className="dr-car-header">
                    <span className="dr-car-icon">🚗</span>
                    <h3 className="dr-car-title">Aktiivne auto</h3>
                </div>

                <div className="dr-car-info">
                    <p className="dr-no-car-text">Aktiivne auto määramata</p>
                    <button
                        className="dr-select-car-button"
                        onClick={onSelectCar}
                    >
                        Vali auto
                    </button>
                </div>
            </div>
        );
    }

    const carModelForStats = {
        id: activeCar.model.id,
        brand: activeCar.model.brandName,
        model: activeCar.model.model,
        mass: activeCar.model.mass,
        compatibleEngines: activeCar.model.compatibleEngineIds,
        defaultEngine: activeCar.model.defaultEngineId,
        basePrice: activeCar.model.basePrice,
        basePollidPrice: activeCar.model.basePollidPrice,
        currency: activeCar.model.currency
    };

    const stats = calculateCarStats(activeCar.car, carModelForStats);

    return (
        <div className="dr-active-car-display">
            <div className="dr-car-header">
                <span className="dr-car-icon">🚗</span>
                <h3 className="dr-car-title">Aktiivne auto</h3>
            </div>

            <div className="dr-car-info">
                <div className="dr-car-name">
                    <span className="dr-car-brand">{activeCar.model.brandName}</span>
                    <span className="dr-car-model">{activeCar.model.model}</span>
                </div>

                <div className="dr-car-stats">
                    <div className="dr-car-stat">
                        <span className="dr-stat-label">Võimsus:</span>
                        <span className="dr-stat-value">{stats.power} KW</span>
                    </div>
                    <div className="dr-car-stat">
                        <span className="dr-stat-label">Kaal:</span>
                        <span className="dr-stat-value">{stats.mass} kg</span>
                    </div>
                    <div className="dr-car-stat">
                        <span className="dr-stat-label">Läbisõit:</span>
                        <span className="dr-stat-value">{Math.round(activeCar.car.mileage)} km</span>
                    </div>
                </div>

                <button
                    className="dr-change-car-button"
                    onClick={onSelectCar}
                >
                    Vaheta autot
                </button>
            </div>
        </div>
    );
};