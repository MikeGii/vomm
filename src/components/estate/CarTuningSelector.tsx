// src/components/estate/CarTuningSelector.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PlayerCar } from '../../types/vehicles';
import { getCarModelById } from '../../data/vehicles';
import { calculateCarStats, calculateEnginePower } from '../../utils/vehicleCalculations';
import {
    getPlayerInventory,
    uninstallPartFromCar,
    InventoryItem
} from '../../services/InventoryService';
import { getBaseIdFromInventoryId } from '../../utils/inventoryUtils';
import '../../styles/components/estate/CarTuningSelector.css';

interface CarTuningSelectorProps {
    userCars: PlayerCar[];
    onCarSelect: (carId: string) => void;
    selectedCarId: string | null;
    onCarUpdated?: () => void;
}

const CarTuningSelector: React.FC<CarTuningSelectorProps> = ({
                                                                 userCars,
                                                                 onCarSelect,
                                                                 selectedCarId,
                                                                 onCarUpdated
                                                             }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [selectedCar, setSelectedCar] = useState<PlayerCar | null>(null);
    const [installedParts, setInstalledParts] = useState<InventoryItem[]>([]);
    const [removingPartCategory, setRemovingPartCategory] = useState<string | null>(null);

    useEffect(() => {
        if (selectedCarId) {
            const car = userCars.find(c => c.id === selectedCarId);
            setSelectedCar(car || null);
            if (car) {
                loadInstalledParts(car.id);
            }
        } else {
            setSelectedCar(null);
            setInstalledParts([]);
        }
    }, [selectedCarId, userCars]);

    const loadInstalledParts = async (carId: string) => {
        if (!currentUser) return;

        try {
            const inventory = await getPlayerInventory(currentUser.uid);
            const installed = inventory.filter(item => item.installedOn === carId);
            setInstalledParts(installed);
        } catch (error) {
            console.error('Viga paigaldatud osade laadimisel:', error);
        }
    };

    const isSlotEmpty = (category: string): boolean => {
        return selectedCar?.emptyPartSlots?.[category as keyof typeof selectedCar.emptyPartSlots] || false;
    };

    const handleRemovePart = async (category: string) => {
        if (!currentUser || !selectedCar) return;

        // Check if slot is already empty
        if (isSlotEmpty(category)) {
            showToast('Selles kategoorias ei ole ühtegi osa paigaldatud', 'error');
            return;
        }

        const currentLevel = selectedCar.engine[category as keyof typeof selectedCar.engine];

        let confirmMessage: string;
        if (currentLevel === 'stock') {
            confirmMessage = `Kas soovid eemaldada tehase ${category} osa? Saad selle oma inventaari.`;
        } else {
            confirmMessage = `Kas soovid eemaldada ${category} ${currentLevel} osa? Osa läheb tagasi inventaari ja saad ka tehase osa.`;
        }

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setRemovingPartCategory(category);

        try {
            await uninstallPartFromCar(
                currentUser.uid,
                selectedCar.id,
                category as 'turbo' | 'ecu' | 'intake' | 'exhaust'
            );

            const successMessage = currentLevel === 'stock'
                ? `Tehase ${category} osa lisatud inventaari.`
                : `${category} ${currentLevel} osa tagasi inventaaris! Tehase osa ka lisatud.`;

            showToast(successMessage, 'success');

            await loadInstalledParts(selectedCar.id);
            if (onCarUpdated) {
                onCarUpdated();
            }
        } catch (error: any) {
            console.error('Viga osa eemaldamisel:', error);
            showToast(error.message || 'Viga osa eemaldamisel', 'error');
        } finally {
            setRemovingPartCategory(null);
        }
    };

    const getPartIcon = (category: string): string => {
        return `/images/${category}.png`;
    };

    const getPartLevelName = (level: string): string => {
        if (level === 'stock') return 'Tehase';
        if (level === 'sport') return 'Sport';
        if (level === 'performance') return 'Performance';
        if (level === 'stage1') return 'Stage 1';
        if (level === 'stage2') return 'Stage 2';
        if (level === 'stage3') return 'Stage 3';
        return level.toUpperCase();
    };

    const getPartLevelColor = (level: string): string => {
        if (level === 'stock') return 'stock';
        if (level === 'stage1' || level === 'sport') return 'stage1';
        if (level === 'stage2') return 'stage2';
        if (level === 'stage3' || level === 'performance') return 'stage3';
        return '';
    };

    const getPartPowerBoost = (category: string, level: string): number => {
        const boosts: Record<string, Record<string, number>> = {
            turbo: { stock: 0, stage1: 40, stage2: 80, stage3: 200 },
            ecu: { stock: 0, stage1: 15, stage2: 25, stage3: 35 },
            intake: { stock: 0, sport: 8, performance: 15 },
            exhaust: { stock: 0, sport: 10, performance: 20 }
        };

        return boosts[category]?.[level] || 0;
    };

    const renderPartSlot = (category: string, level: string) => {
        const isEmpty = isSlotEmpty(category);
        const isRemoving = removingPartCategory === category;

        return (
            <div className={`part-item ${getPartLevelColor(level)} ${isEmpty ? 'empty-slot' : ''}`}>
                {isEmpty ? (
                    <div className="empty-slot-indicator">
                        <div className="empty-icon">⚫</div>
                        <div className="empty-text">
                            <span className="part-type">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                            <span className="empty-label">Tühi slot</span>
                            <span className="install-hint">Paigalda osa</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <img
                            src={getPartIcon(category)}
                            alt={category}
                            className="part-icon"
                        />
                        <div className="part-info">
                            <span className="part-type">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                            <span className="part-level">
                                {getPartLevelName(level)}
                            </span>
                            {level !== 'stock' && (
                                <span className="part-boost">
                                    +{getPartPowerBoost(category, level)}%
                                </span>
                            )}
                        </div>
                        <button
                            className="btn-remove-part"
                            onClick={() => handleRemovePart(category)}
                            disabled={isRemoving}
                            title="Eemalda osa"
                        >
                            {isRemoving ? '...' : '✕'}
                        </button>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="car-tuning-selector">
            <div className="selector-header">
                <h3>🔧 Auto tuunimine</h3>
                <p>Vali auto, mida soovid tuunida</p>
            </div>

            <div className="car-selector">
                <label htmlFor="car-select">Vali auto:</label>
                <select
                    id="car-select"
                    value={selectedCarId || ''}
                    onChange={(e) => onCarSelect(e.target.value)}
                    className="car-dropdown"
                >
                    <option value="">-- Vali auto --</option>
                    {userCars.map(car => {
                        const model = getCarModelById(car.carModelId);
                        if (!model) return null;
                        return (
                            <option key={car.id} value={car.id}>
                                {model.brand} {model.model} ({car.mileage.toLocaleString()} km)
                            </option>
                        );
                    })}
                </select>
            </div>

            {selectedCar && (
                <div className="current-parts">
                    <h4>Paigaldatud osad</h4>
                    <div className="parts-grid">
                        {renderPartSlot('turbo', selectedCar.engine.turbo)}
                        {renderPartSlot('ecu', selectedCar.engine.ecu)}
                        {renderPartSlot('intake', selectedCar.engine.intake)}
                        {renderPartSlot('exhaust', selectedCar.engine.exhaust)}
                    </div>

                    <div className="car-stats-preview">
                        {(() => {
                            const model = getCarModelById(selectedCar.carModelId);
                            if (!model) return null;
                            const stats = calculateCarStats(selectedCar, model);

                            const stockEngine = {
                                ...selectedCar.engine,
                                turbo: 'stock' as const,
                                ecu: 'stock' as const,
                                intake: 'stock' as const,
                                exhaust: 'stock' as const
                            };

                            const stockPower = calculateEnginePower(stockEngine);
                            const currentPower = calculateEnginePower(selectedCar.engine);
                            const boostPercentage = stockPower > 0 ? Math.round(((currentPower - stockPower) / stockPower) * 100) : 0;

                            return (
                                <>
                                    <div className="stat">
                                        <span>Võimsus:</span>
                                        <strong>{stats.power} kW ({Math.round(stats.power * 1.36)} hp)</strong>
                                    </div>
                                    <div className="stat">
                                        <span>Kiirendus 0-100:</span>
                                        <strong>{stats.acceleration.toFixed(1)} sek</strong>
                                    </div>
                                    <div className="stat">
                                        <span>Kogu boost:</span>
                                        <strong>
                                            {boostPercentage > 0 ? `+${boostPercentage}%` : '0%'}
                                        </strong>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {!selectedCar && userCars.length > 0 && (
                <div className="no-car-selected">
                    <p>Vali auto ülalt, et näha selle osi</p>
                </div>
            )}
        </div>
    );
};

export default CarTuningSelector;