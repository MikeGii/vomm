// src/components/dragrace/CarSelectionModal.tsx (Updated)
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerCar } from '../../types/vehicles';
import { VehicleModel } from '../../types/vehicleDatabase';
import { ActiveCarService } from '../../services/ActiveCarService';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import '../../styles/components/dragrace/CarSelectionModal.css'

interface CarSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCar: (carId: string) => void;
    currentUserId: string;
}

export const CarSelectionModal: React.FC<CarSelectionModalProps> = ({
                                                                        isOpen,
                                                                        onClose,
                                                                        onSelectCar,
                                                                        currentUserId
                                                                    }) => {
    const [cars, setCars] = useState<Array<{ car: PlayerCar; model: VehicleModel }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCarId, setSelectedCarId] = useState<string>('');

    // FIXED: Remove circular dependency in useCallback
    const loadPlayerCars = useCallback(async () => {
        try {
            setIsLoading(true);
            const playerCars = await ActiveCarService.getPlayerCars(currentUserId);
            setCars(playerCars);
        } catch (error) {
            console.error('Error loading cars:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        if (isOpen) {
            loadPlayerCars();
        }
    }, [isOpen, loadPlayerCars])

    const handleSelectCar = () => {
        if (selectedCarId) {
            onSelectCar(selectedCarId);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="dr-modal-overlay" onClick={onClose}>
            <div className="dr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dr-modal-header">
                    <h2 className="dr-modal-title">
                        <span className="dr-modal-icon">🚗</span>
                        Vali aktiivne auto
                    </h2>
                    <button className="dr-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="dr-modal-content">
                    {isLoading ? (
                        <div className="dr-modal-loading">
                            <div className="dr-loading-spinner"></div>
                            <span>Laen autosid...</span>
                        </div>
                    ) : cars.length === 0 ? (
                        <div className="dr-no-cars">
                            <span className="dr-no-cars-icon">🚫</span>
                            <p>Sul pole autosid garaažis</p>
                            <p className="dr-no-cars-hint">
                                Osta esmalt auto, et alustada drag race treeninguid
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="dr-selection-info">
                                Vali auto, mida soovid drag race treeningutes kasutada:
                            </p>

                            <div className="dr-cars-list">
                                {cars.map(({ car, model }) => {
                                    // Convert VehicleModel to the format expected by calculateCarStats
                                    const carModelForStats = {
                                        id: model.id,
                                        brand: model.brandName,
                                        model: model.model,
                                        mass: model.mass,
                                        compatibleEngines: model.compatibleEngineIds,
                                        defaultEngine: model.defaultEngineId,
                                        basePrice: model.basePrice,
                                        basePollidPrice: model.basePollidPrice,
                                        currency: model.currency
                                    };

                                    const stats = calculateCarStats(car, carModelForStats);
                                    const isSelected = selectedCarId === car.id;

                                    return (
                                        <div
                                            key={car.id}
                                            className={`dr-car-option ${isSelected ? 'dr-selected' : ''}`}
                                            onClick={() => setSelectedCarId(car.id)}
                                        >
                                            <div className="dr-car-option-header">
                                                <div className="dr-car-option-name">
                                                    <span className="dr-car-option-brand">{model.brandName}</span>
                                                    <span className="dr-car-option-model">{model.model}</span>
                                                </div>
                                                <div className="dr-selection-indicator">
                                                    {isSelected && <span className="dr-checkmark">✓</span>}
                                                </div>
                                            </div>

                                            <div className="dr-car-option-stats">
                                                <div className="dr-car-option-stat">
                                                    <span className="dr-stat-icon">⚡</span>
                                                    <span className="dr-stat-text">{stats.power} KW</span>
                                                </div>
                                                <div className="dr-car-option-stat">
                                                    <span className="dr-stat-icon">⚖️</span>
                                                    <span className="dr-stat-text">{stats.mass} kg</span>
                                                </div>
                                                <div className="dr-car-option-stat">
                                                    <span className="dr-stat-icon">📏</span>
                                                    <span className="dr-stat-text">{Math.round(car.mileage)} km</span>
                                                </div>
                                                <div className="dr-car-option-stat">
                                                    <span className="dr-stat-icon">🏁</span>
                                                    <span className="dr-stat-text">{stats.grip.toFixed(2)} haare</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {cars.length > 0 && (
                    <div className="dr-modal-footer">
                        <button
                            className="dr-modal-button dr-secondary"
                            onClick={onClose}
                        >
                            Tühista
                        </button>
                        <button
                            className={`dr-modal-button dr-primary ${!selectedCarId ? 'dr-disabled' : ''}`}
                            onClick={handleSelectCar}
                            disabled={!selectedCarId}
                        >
                            Vali see auto
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};