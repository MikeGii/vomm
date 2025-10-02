// src/components/estate/GarageTab.tsx - Updated with tuning integration and proper class names

import React, {useCallback, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import {
    getUserCars,
    listCarForSale,
    unlistCarFromSale,
    updateCarUniversalTuning
} from '../../services/VehicleService';
import { getVehicleModelById } from '../../services/VehicleDatabaseService';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import {PlayerCar, UniversalTuningCategory,} from '../../types/vehicles';
import { VehicleModel } from '../../types/vehicleDatabase';
import { cacheManager } from '../../services/CacheManager';
import { VehicleTuning } from './VehicleTuning';
import { calculateTotalGarageSlots, canBuyExtraGarageSlots, GARAGE_SLOT_CONSTANTS } from '../../utils/garageUtils';
import { purchaseExtraGarageSlot } from '../../services/EstateService';
import '../../styles/components/estate/GarageTab.css';

// Cache duration for car models
const MODEL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const GarageTab: React.FC = () => {
    const { playerEstate } = useEstate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { playerStats, pollid } = usePlayerStats();
    const navigate = useNavigate();

    const [userCars, setUserCars] = useState<PlayerCar[]>([]);
    const [carModels, setCarModels] = useState<Map<string, VehicleModel>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
    const [salePrice, setSalePrice] = useState<string>('');
    const [isListing, setIsListing] = useState(false);
    const [tuningCarId, setTuningCarId] = useState<string | null>(null);
    const [isPurchasingSlot, setIsPurchasingSlot] = useState(false);

    // Check if player has garage access
    const hasGarageAccess = playerEstate?.currentEstate?.hasGarage &&
        (playerEstate?.currentEstate?.garageCapacity || 0) > 0;

    // Helper function to get car model (with caching)
    const getCarModel = useCallback(async (carModelId: string): Promise<VehicleModel | null> => {
        if (carModels.has(carModelId)) {
            return carModels.get(carModelId) || null;
        }

        const cacheKey = `car_model_${carModelId}`;
        const cachedModel = cacheManager.get<VehicleModel>(cacheKey, MODEL_CACHE_DURATION);

        if (cachedModel) {
            setCarModels(prev => new Map(prev).set(carModelId, cachedModel));
            return cachedModel;
        }

        try {
            const model = await getVehicleModelById(carModelId);
            if (model) {
                cacheManager.set(cacheKey, model, MODEL_CACHE_DURATION);
                setCarModels(prev => new Map(prev).set(carModelId, model));
                return model;
            }
        } catch (error) {
            console.error(`Failed to load car model ${carModelId}:`, error);
        }

        return null;
    }, [carModels]);

    // Load user cars
    const loadUserCars = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const cars = await getUserCars(currentUser.uid);
            setUserCars(cars);

            // Preload car models
            const uniqueModelIds = [...new Set(cars.map(car => car.carModelId))];
            await Promise.all(uniqueModelIds.map(id => getCarModel(id)));
        } catch (error) {
            console.error('Viga autode laadimisel:', error);
            showToast('Viga autode laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, getCarModel, showToast]);

    useEffect(() => {
        loadUserCars();
    }, [loadUserCars]);

    const handlePurchaseGarageSlot = async () => {
        if (!currentUser || isPurchasingSlot) return;

        setIsPurchasingSlot(true);
        try {
            const result = await purchaseExtraGarageSlot(currentUser.uid);

            if (result.success) {
                showToast(result.message, 'success');
                // Refresh estate data to show updated slots
                // The estate context should automatically update through Firebase listener
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error purchasing garage slot:', error);
            showToast('Viga garaaž koha ostmisel!', 'error');
        } finally {
            setIsPurchasingSlot(false);
        }
    };

    // Handle tuning update
    const handleTuningUpdate = async (carId: string, category: UniversalTuningCategory, newLevel: number) => {
        if (!currentUser || !playerStats) return;

        try {
            const result = await updateCarUniversalTuning(currentUser.uid, carId, category, newLevel);
            if (result.success) {
                showToast(result.message, 'success');
                await loadUserCars(); // Reload to get updated stats
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            console.error('Tuning update failed:', error);
            throw error; // Let the VehicleTuning component handle the error display
        }
    };
    const handleListCar = async (carId: string, price: number) => {
        if (!currentUser) return;

        setIsListing(true);
        try {
            await listCarForSale(currentUser.uid, carId, price);
            showToast('Auto müügile pandud!', 'success');
            await loadUserCars();
            setSelectedCarId(null);
            setSalePrice('');
        } catch (error: any) {
            showToast(error.message || 'Viga auto müügile panemisel', 'error');
        } finally {
            setIsListing(false);
        }
    };

    const handleUnlistCar = async (carId: string) => {
        if (!currentUser) return;

        setIsListing(true);
        try {
            await unlistCarFromSale(currentUser.uid, carId);
            showToast('Auto müügilt maha võetud!', 'success');
            await loadUserCars();
            setSelectedCarId(null);
        } catch (error: any) {
            showToast(error.message || 'Viga auto müügilt mahavõtmisel', 'error');
        } finally {
            setIsListing(false);
        }
    };

    if (loading) {
        return (
            <div className="garage-estate-tab">
                <div className="garage-estate-loading">Laen garaaži andmeid...</div>
            </div>
        );
    }

    if (!hasGarageAccess) {
        return (
            <div className="garage-estate-tab">
                <div className="garage-estate-no-access">
                    <div className="garage-estate-no-access-icon">🏠</div>
                    <h3>Garaaž pole saadaval</h3>
                    <p>
                        Sul pole veel garaažiga kinnisasja. Osta garaažiga kinnisvara,
                        et saaksid autosid hoida ja neid tuunida.
                    </p>
                </div>
            </div>
        );
    }

    const garageCapacity = calculateTotalGarageSlots(playerEstate);
    const estateGarageSlots = playerEstate?.currentEstate?.garageCapacity || 0;
    const extraGarageSlots = playerEstate?.extraGarageSlots || 0;
    const usedSlots = userCars.length;
    const freeSlots = garageCapacity - usedSlots;

    // Get tuning car and model for modal
    const tuningCar = tuningCarId ? userCars.find(car => car.id === tuningCarId) : null;
    const tuningModel = tuningCar ? carModels.get(tuningCar.carModelId) : null;

    return (
        <div className="garage-estate-tab">
            <div className="garage-estate-header">
                <h2 className="garage-estate-title">Garaaž</h2>
                <div className="garage-estate-info">
                    <div className="garage-estate-capacity-display">
                        <span className="garage-estate-capacity-used">Kasutatud kohad: {usedSlots}/{garageCapacity}</span>
                        <span className="garage-estate-capacity-free">Vabu kohti: {freeSlots}</span>
                    </div>
                </div>
            </div>

            <div className="garage-estate-content">
                {/* Cars Section */}
                <div className="garage-estate-cars-section">
                    <h3 className="garage-estate-section-title">🚗 Sinu autod</h3>

                    {userCars.length === 0 ? (
                        <div className="garage-estate-no-vehicles">
                            <div className="garage-estate-empty-icon">🏗️</div>
                            <h3>Garaaž on tühi</h3>
                            <p>Sul pole veel ühtegi autot. Mine automüügiplatsile ja osta endale sõiduk!</p>
                            <button
                                className="garage-estate-btn-marketplace"
                                onClick={() => navigate('/car-marketplace')}
                            >
                                Mine automüügiplatsile
                            </button>
                        </div>
                    ) : (
                        <div className="garage-estate-vehicles-grid">
                            {userCars.map(car => {
                                const model = carModels.get(car.carModelId);
                                if (!model) return null;

                                // Convert to legacy format for calculateCarStats
                                const legacyModel = {
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

                                const stats = calculateCarStats(car, legacyModel);

                                return (
                                    <div key={car.id} className="garage-estate-vehicle-card">
                                        <div className="garage-estate-vehicle-header">
                                            <h4 className="garage-estate-vehicle-name">{model.brandName} {model.model}</h4>
                                            <span className="garage-estate-vehicle-engine">{car.engine.code}</span>
                                        </div>

                                        <div className="garage-estate-vehicle-stats">
                                            <div className="garage-estate-vehicle-stat-item">
                                                <span className="garage-estate-stat-label">Võimsus:</span>
                                                <span className="garage-estate-stat-value">{stats.power} kW</span>
                                            </div>
                                            <div className="garage-estate-vehicle-stat-item">
                                                <span className="garage-estate-stat-label">Kiirendus:</span>
                                                <span className="garage-estate-stat-value">{stats.acceleration.toFixed(1)}s</span>
                                            </div>
                                            <div className="garage-estate-vehicle-stat-item">
                                                <span className="garage-estate-stat-label">Haarduvus:</span>
                                                <span className="garage-estate-stat-value">{stats.grip.toFixed(2)}</span>
                                            </div>
                                            <div className="garage-estate-vehicle-stat-item">
                                                <span className="garage-estate-stat-label">Läbisõit:</span>
                                                <span className="garage-estate-stat-value">{Math.round(car.mileage).toLocaleString()} km</span>
                                            </div>
                                        </div>

                                        <div className="garage-estate-vehicle-actions">
                                            {/* Tuning Button */}
                                            <button
                                                className="garage-estate-btn-tune"
                                                onClick={() => setTuningCarId(car.id)}
                                            >
                                                🔧 Konfigureeri
                                            </button>

                                            {car.isForSale ? (
                                                <div className="garage-estate-sale-status">
                                                    <p className="garage-estate-sale-info">
                                                        Müügis hinnaga: <strong>{car.salePrice?.toLocaleString()} €</strong>
                                                    </p>
                                                    <button
                                                        className="garage-estate-btn-unlist"
                                                        onClick={() => handleUnlistCar(car.id)}
                                                        disabled={isListing}
                                                    >
                                                        {isListing ? 'Eemaldamine...' : 'Võta müügilt maha'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="garage-estate-sell-controls">
                                                    <input
                                                        type="number"
                                                        placeholder="Müügihind (€)"
                                                        value={selectedCarId === car.id ? salePrice : ''}
                                                        onChange={(e) => {
                                                            setSelectedCarId(car.id);
                                                            setSalePrice(e.target.value);
                                                        }}
                                                        className="garage-estate-price-input"
                                                    />
                                                    <button
                                                        className="garage-estate-btn-list"
                                                        onClick={() => {
                                                            const price = parseInt(salePrice);
                                                            if (price > 0) {
                                                                handleListCar(car.id, price);
                                                            } else {
                                                                showToast('Sisesta kehtiv hind', 'error');
                                                            }
                                                        }}
                                                        disabled={!salePrice || isListing || selectedCarId !== car.id}
                                                    >
                                                        {isListing ? 'Paneme müüki...' : 'Pane müüki'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add vehicle card (if there's space) */}
                            {freeSlots > 0 && (
                                <div className="garage-estate-add-vehicle-card">
                                    <div className="garage-estate-add-vehicle-icon">🏗️</div>
                                    <h4>Lisa auto</h4>
                                    <p>Sul on veel {freeSlots} vaba garaažikohta</p>
                                    <button
                                        className="garage-estate-btn-add-car"
                                        onClick={() => navigate('/car-marketplace')}
                                    >
                                        Mine automüügiplatsile
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Extra Garage Slots Section */}
                {canBuyExtraGarageSlots(playerEstate) && (
                    <div className="garage-estate-extra-slots-section">
                        <h3 className="garage-estate-section-title">🛒 Lisa garaaži kohad</h3>

                        <div className="garage-estate-slots-info">
                            <div className="garage-estate-slots-breakdown">
                                <div className="garage-estate-slots-item">
                                    <span className="garage-estate-slots-label">Kinnisvara kohad:</span>
                                    <span className="garage-estate-slots-value">{estateGarageSlots}</span>
                                </div>
                                <div className="garage-estate-slots-item">
                                    <span className="garage-estate-slots-label">Ostetud kohad:</span>
                                    <span className="garage-estate-slots-value">{extraGarageSlots}</span>
                                </div>
                                <div className="garage-estate-slots-item garage-estate-slots-total">
                                    <span className="garage-estate-slots-label">Kokku:</span>
                                    <span className="garage-estate-slots-value">{garageCapacity}</span>
                                </div>
                            </div>
                        </div>

                        <div className="garage-estate-purchase-section">
                            <div className="garage-estate-purchase-info">
                                <div className="garage-estate-purchase-price">
                                    <span className="garage-estate-price-label">Hind:</span>
                                    <span className="garage-estate-price-value">{GARAGE_SLOT_CONSTANTS.COST_PER_SLOT} pollid</span>
                                </div>
                                <div className="garage-estate-purchase-balance">
                                    <span className="garage-estate-balance-label">Sinu pollid:</span>
                                    <span className="garage-estate-balance-value">{pollid}</span>
                                </div>
                            </div>

                            <button
                                className="garage-estate-btn-purchase-slot"
                                onClick={handlePurchaseGarageSlot}
                                disabled={
                                    isPurchasingSlot ||
                                    pollid < GARAGE_SLOT_CONSTANTS.COST_PER_SLOT ||
                                    extraGarageSlots >= GARAGE_SLOT_CONSTANTS.MAX_EXTRA_SLOTS
                                }
                            >
                                {isPurchasingSlot ? 'Ostmine...' :
                                    extraGarageSlots >= GARAGE_SLOT_CONSTANTS.MAX_EXTRA_SLOTS ? 'Maksimum saavutatud' :
                                        pollid < GARAGE_SLOT_CONSTANTS.COST_PER_SLOT ? 'Pole piisavalt pollide' :
                                            'Osta lisa garaaž koht'}
                            </button>

                            {extraGarageSlots >= GARAGE_SLOT_CONSTANTS.MAX_EXTRA_SLOTS && (
                                <p className="garage-estate-max-notice">
                                    Oled ostnud maksimaalse arvu lisakohti ({GARAGE_SLOT_CONSTANTS.MAX_EXTRA_SLOTS})
                                </p>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Tuning Modal */}
            {tuningCarId && tuningCar && tuningModel && playerStats && (
                <VehicleTuning
                    car={tuningCar}
                    model={{
                        id: tuningModel.id,
                        brand: tuningModel.brandName,
                        model: tuningModel.model,
                        mass: tuningModel.mass,
                        compatibleEngines: tuningModel.compatibleEngineIds,
                        defaultEngine: tuningModel.defaultEngineId,
                        basePrice: tuningModel.basePrice,
                        basePollidPrice: tuningModel.basePollidPrice,
                        currency: tuningModel.currency
                    }}
                    playerStats={playerStats}
                    onTuningUpdate={handleTuningUpdate}
                    onClose={() => setTuningCarId(null)}
                />
            )}
        </div>
    );
};