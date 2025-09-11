// src/components/estate/VehicleTuning.tsx - COMPACT VERSION
import React, { useState } from 'react';
import { PlayerStats } from '../../types';
import {
    PlayerCar,
    CarModel,
    UNIVERSAL_TUNING_CONFIG,
    UniversalTuningCategory,
    checkTuningRequirements,
    createDefaultUniversalTuning
} from '../../types/vehicles';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import '../../styles/components/estate/VehicleTuning.css';

interface VehicleTuningProps {
    car: PlayerCar;
    model: CarModel;
    playerStats: PlayerStats;
    onTuningUpdate: (carId: string, category: UniversalTuningCategory, newLevel: number) => Promise<void>;
    onClose: () => void;
}

export const VehicleTuning: React.FC<VehicleTuningProps> = ({
                                                                car,
                                                                model,
                                                                playerStats,
                                                                onTuningUpdate,
                                                                onClose
                                                            }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);

    // Get current tuning or create default
    const currentTuning = car.universalTuning || createDefaultUniversalTuning();

    // Calculate current stats
    const currentStats = calculateCarStats(car, model);

    // Get player driving attributes
    const playerAttributes = {
        handling: playerStats.attributes?.handling?.level || 0,
        reactionTime: playerStats.attributes?.reactionTime?.level || 0,
        gearShifting: playerStats.attributes?.gearShifting?.level || 0
    };

    const handleTuningChange = async (category: UniversalTuningCategory, newLevel: number) => {
        // Check requirements for upgrade
        if (newLevel > currentTuning[category]) {
            const reqCheck = checkTuningRequirements(
                category,
                newLevel,
                playerStats.level,
                playerAttributes
            );

            if (!reqCheck.canUpgrade) {
                alert(`Ei saa uuendada: ${reqCheck.missingRequirements.join(', ')}`);
                return;
            }
        }

        // Calculate upgrade cost
        const config = UNIVERSAL_TUNING_CONFIG[category];
        const stage = config.stages[newLevel];
        const upgradeCost = Math.floor(model.basePrice * (stage.pricePercent / 100));

        if (newLevel > currentTuning[category] && playerStats.money < upgradeCost) {
            alert(`Sul pole piisavalt raha! Vajad ${upgradeCost.toLocaleString()}€, sul on ${playerStats.money.toLocaleString()}€`);
            return;
        }

        setIsUpdating(true);
        setUpdatingCategory(category);
        try {
            await onTuningUpdate(car.id, category, newLevel);
        } catch (error) {
            console.error('Tuning update failed:', error);
            alert('Tuuningu uuendamine ebaõnnestus');
        } finally {
            setIsUpdating(false);
            setUpdatingCategory(null);
        }
    };

    const renderTuningCategory = (category: UniversalTuningCategory) => {
        const config = UNIVERSAL_TUNING_CONFIG[category];
        const currentLevel = currentTuning[category];
        const isUpdatingThis = updatingCategory === category;

        return (
            <div key={category} className="vehicle-tuning-category">
                <div className="vehicle-tuning-category-header">
                    <span className="vehicle-tuning-emoji">{config.emoji}</span>
                    <h4 className="vehicle-tuning-category-title">{config.name}</h4>
                    <span className="vehicle-tuning-description">{config.description}</span>
                </div>

                <div className="vehicle-tuning-stages">
                    {config.stages.map((stage, index) => {
                        const isCurrentLevel = index === currentLevel;
                        const canUpgrade = index > currentLevel ?
                            checkTuningRequirements(category, index, playerStats.level, playerAttributes).canUpgrade :
                            true;
                        const reqCheck = checkTuningRequirements(category, index, playerStats.level, playerAttributes);
                        const upgradeCost = Math.floor(model.basePrice * (stage.pricePercent / 100));

                        return (
                            <div key={index} className={`vehicle-tuning-stage ${isCurrentLevel ? 'vehicle-tuning-stage-current' : ''} ${!canUpgrade && index > currentLevel ? 'vehicle-tuning-stage-locked' : ''}`}>
                                {/* COMPACT: Horizontal stage info */}
                                <div className="vehicle-tuning-stage-info">
                                    <div className="vehicle-tuning-stage-name">
                                        {index === 0 ? 'Stock' : `Stage ${index}`}
                                    </div>
                                    <div className="vehicle-tuning-stage-benefits">
                                        {stage.powerBoost > 0 && (
                                            <span className="vehicle-tuning-stage-power">+{stage.powerBoost}% võimsus</span>
                                        )}
                                        {stage.gripModifier !== 0 && (
                                            <span className={`vehicle-tuning-stage-grip ${stage.gripModifier > 0 ? 'vehicle-tuning-grip-positive' : 'vehicle-tuning-grip-negative'}`}>
                                                {stage.gripModifier > 0 ? '+' : ''}{(stage.gripModifier * 100).toFixed(0)}% haare
                                            </span>
                                        )}
                                    </div>
                                    {index > 0 && (
                                        <div className="vehicle-tuning-stage-cost">
                                            {upgradeCost.toLocaleString()}€
                                        </div>
                                    )}
                                </div>

                                {/* COMPACT: Actions and requirements in one row */}
                                <div className="vehicle-tuning-stage-actions">
                                    {!canUpgrade && index > currentLevel ? (
                                        <div className="vehicle-tuning-stage-requirements">
                                            {reqCheck.missingRequirements.map((req, i) => (
                                                <span key={i} className="vehicle-tuning-missing-req">{req}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <button
                                            className={`vehicle-tuning-stage-button ${isCurrentLevel ? 'vehicle-tuning-button-current' : ''}`}
                                            disabled={isUpdating || isCurrentLevel}
                                            onClick={() => handleTuningChange(category, index)}
                                        >
                                            {isUpdatingThis ? 'Uuendamine...' :
                                                isCurrentLevel ? 'Praegune' :
                                                    index > currentLevel ? 'Uuenda' : 'Allu'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="vehicle-tuning-overlay">
            <div className="vehicle-tuning-modal">
                <div className="vehicle-tuning-header">
                    <h3 className="vehicle-tuning-title">🔧 {model.brand} {model.model} - Tuning</h3>
                    <button className="vehicle-tuning-close-button" onClick={onClose}>✕</button>
                </div>

                {/* COMPACT: Combined Info Section */}
                <div className="vehicle-tuning-info-section">
                    <div className="vehicle-tuning-info-grid">
                        <div className="vehicle-tuning-skills-group">
                            <h4 className="vehicle-tuning-group-title">Autojuhtimise oskused</h4>
                            <div className="vehicle-tuning-driving-skill">
                                <img src="images/handling.png" alt="Käsitsemine" className="vehicle-tuning-skill-icon" />
                                <span className="vehicle-tuning-skill-text">Käsitsemine: {playerAttributes.handling}</span>
                            </div>
                            <div className="vehicle-tuning-driving-skill">
                                <img src="images/reaction.png" alt="Reaktsiooniaeg" className="vehicle-tuning-skill-icon" />
                                <span className="vehicle-tuning-skill-text">Reaktsiooniaeg: {playerAttributes.reactionTime}</span>
                            </div>
                            <div className="vehicle-tuning-driving-skill">
                                <img src="images/gearshifting.png" alt="Käiguvahetus" className="vehicle-tuning-skill-icon" />
                                <span className="vehicle-tuning-skill-text">Käiguvahetus: {playerAttributes.gearShifting}</span>
                            </div>
                        </div>

                        <div className="vehicle-tuning-stats-group">
                            <h4 className="vehicle-tuning-group-title">Auto näitajad</h4>
                            <div className="vehicle-tuning-stat-item">
                                <span className="vehicle-tuning-stat-text">Võimsus: {currentStats.power} kW</span>
                            </div>
                            <div className="vehicle-tuning-stat-item">
                                <span className="vehicle-tuning-stat-text">Kiirendus: {currentStats.acceleration.toFixed(1)}s</span>
                            </div>
                            <div className="vehicle-tuning-stat-item">
                                <span className="vehicle-tuning-stat-text">Haare: {currentStats.grip.toFixed(2)}</span>
                            </div>
                            <div className="vehicle-tuning-stat-item">
                                <span className="vehicle-tuning-stat-text">Läbisõit: {Math.round(car.mileage).toLocaleString()} km</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tuning Categories */}
                <div className="vehicle-tuning-categories">
                    {(Object.keys(UNIVERSAL_TUNING_CONFIG) as UniversalTuningCategory[]).map(renderTuningCategory)}
                </div>
            </div>
        </div>
    );
};