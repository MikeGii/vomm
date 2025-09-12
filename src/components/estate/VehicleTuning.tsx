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
import {calculateCarStats, getTuningBasePrice} from '../../utils/vehicleCalculations';
import '../../styles/components/estate/VehicleTuning.css';
import { useToast } from '../../contexts/ToastContext';

interface VehicleTuningProps {
    car: PlayerCar;
    model: CarModel;
    playerStats: PlayerStats;
    onTuningUpdate: (carId: string, category: UniversalTuningCategory, newLevel: number) => Promise<void>;
    onClose: () => void;
}

const VehicleTuning: React.FC<VehicleTuningProps> = ({
                                                         car,
                                                         model,
                                                         playerStats,
                                                         onTuningUpdate,
                                                         onClose
                                                     }) => {
    const { showToast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
    const [localTuning] = useState(car.universalTuning || createDefaultUniversalTuning());

    // Use local tuning state for immediate updates
    const currentTuning = localTuning;

    // Recalculate stats based on local tuning state
    const currentStats = calculateCarStats({ ...car, universalTuning: localTuning }, model);

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
                showToast(`Nõuded ei ole täidetud: ${reqCheck.missingRequirements.join(', ')}`, 'error');
                return;
            }
        }

        // Calculate upgrade cost
        const config = UNIVERSAL_TUNING_CONFIG[category];
        const stage = config.stages[newLevel];
        const tuningBasePrice = getTuningBasePrice(model);
        const upgradeCost = Math.floor(tuningBasePrice * (stage.pricePercent / 100));

        if (newLevel > currentTuning[category] && playerStats.money < upgradeCost) {
            showToast(`Sul pole piisavalt raha! Vajad ${upgradeCost.toLocaleString()}€, sul on ${playerStats.money.toLocaleString()}€`, 'error');
            return;
        }

        setIsUpdating(true);
        setUpdatingCategory(category);
        try {
            await onTuningUpdate(car.id, category, newLevel);
            showToast('Varuosad edukalt uuendatud!', 'success');
        } catch (error) {
            console.error('Tuning update failed:', error);
            showToast('Varuosade uuendamine ebaõnnestus', 'error');
        } finally {
            setIsUpdating(false);
            setUpdatingCategory(null);
        }
    };

    const calculatePreviewStats = (category: UniversalTuningCategory, newLevel: number) => {
        const previewTuning = { ...currentTuning, [category]: newLevel };
        const previewCar = { ...car, universalTuning: previewTuning };
        return calculateCarStats(previewCar, model);
    };

    const renderTuningCategory = (category: UniversalTuningCategory) => {
        const config = UNIVERSAL_TUNING_CONFIG[category];
        const currentLevel = currentTuning[category];
        const isUpdatingThis = updatingCategory === category;

        // Map category to icon filename
        const getIconPath = (category: UniversalTuningCategory): string => {
            const iconMap: Record<UniversalTuningCategory, string> = {
                'injectors': 'injector.png',
                'intake': 'intake.png',
                'turbo': 'turbo.png',
                'exhaust': 'exhaust.png',
                'ecu': 'ecu.png',
                'fuel_pump': 'injector.png', // Reuse injector icon for fuel pump
                'differential': 'differential.png',
                'tires': 'tire.png'
            };
            return `images/${iconMap[category]}`;
        };

        return (
            <div key={category} className="vehicle-tuning-category">
                <div className="vehicle-tuning-category-header">
                    <img
                        src={getIconPath(category)}
                        alt={config.name}
                        className="vehicle-tuning-category-icon"
                    />
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
                        const tuningBasePrice = getTuningBasePrice(model);
                        const upgradeCost = Math.floor(tuningBasePrice * (stage.pricePercent / 100));

                        // NEW: Calculate preview stats
                        const previewStats = index !== currentLevel ? calculatePreviewStats(category, index) : null;

                        return (
                            <div key={index} className={`vehicle-tuning-stage ${isCurrentLevel ? 'vehicle-tuning-stage-current' : ''} ${!canUpgrade && index > currentLevel ? 'vehicle-tuning-stage-locked' : ''}`}>
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
                                            {stage.gripModifier > 0 ? '+' : ''}{(stage.gripModifier * 100).toFixed(0)}% haarduvus
                                        </span>
                                        )}
                                    </div>
                                    {index > 0 && (
                                        <div className="vehicle-tuning-stage-cost">
                                            {upgradeCost.toLocaleString()}€
                                        </div>
                                    )}
                                </div>

                                {/* NEW: Preview stats when hovering upgrade button */}
                                {previewStats && canUpgrade && index > currentLevel && (
                                    <div className="vehicle-tuning-stage-preview">
                                        <span className="vehicle-tuning-preview-label">Eelvaade:</span>
                                        <span className="vehicle-tuning-preview-power">{previewStats.power} kW</span>
                                        <span className="vehicle-tuning-preview-accel">{previewStats.acceleration.toFixed(1)}s</span>
                                        <span className="vehicle-tuning-preview-grip">{previewStats.grip.toFixed(2)}</span>
                                    </div>
                                )}

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
                                <span className="vehicle-tuning-stat-text">Haarduvus: {currentStats.grip.toFixed(2)}</span>
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

export { VehicleTuning };

