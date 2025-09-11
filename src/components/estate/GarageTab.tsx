// src/components/estate/GarageTab.tsx - FIXED: Use correct property names

import React, {useCallback, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getUserCars, listCarForSale, unlistCarFromSale } from '../../services/VehicleService';
import { getVehicleModelById } from '../../services/VehicleDatabaseService';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import { PlayerCar } from '../../types/vehicles';
import { VehicleModel } from '../../types/vehicleDatabase';
import { cacheManager } from '../../services/CacheManager';
import '../../styles/components/estate/GarageTab.css';

// Cache duration for car models
const MODEL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const GarageTab: React.FC = () => {
    const { playerEstate } = useEstate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [userCars, setUserCars] = useState<PlayerCar[]>([]);
    const [carModels, setCarModels] = useState<Map<string, VehicleModel>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
    const [salePrice, setSalePrice] = useState<string>('');
    const [isListing, setIsListing] = useState(false);

    // Check if player has garage access - FIXED: Use correct property names
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
            <div className="garage-tab">
                <div className="loading">Laen garaaži andmeid...</div>
            </div>
        );
    }

    if (!hasGarageAccess) {
        return (
            <div className="garage-tab">
                <div className="no-garage-access">
                    <div className="no-garage-icon">🏠</div>
                    <h3>Garaaž pole saadaval</h3>
                    <p>
                        Sul pole veel garaažiga kinnisasja. Osta garaažiga kinnisvara,
                        et saaksid autosid hoida ja neid tuunida.
                    </p>
                </div>
            </div>
        );
    }

    // FIXED: Use correct property name
    const garageCapacity = playerEstate?.currentEstate?.garageCapacity || 0;
    const usedSlots = userCars.length;
    const freeSlots = garageCapacity - usedSlots;

    return (
        <div className="garage-tab">
            <div className="garage-header">
                <h2>Garaaž</h2>
                <div className="garage-info">
                    <div className="garage-capacity-display">
                        <span>Kasutatud kohad: {usedSlots}/{garageCapacity}</span>
                        <span className="garage-free-slots">Vabu kohti: {freeSlots}</span>
                    </div>
                </div>
            </div>

            <div className="garage-content">
                {/* Temporary message about new tuning system */}
                <div className="garage-tuning-notice">
                    <div className="garage-notice-box">
                        <h4>🔧 Uus tuuningu süsteem tuleb varsti!</h4>
                        <p>
                            Töötame uue universaalse tuuningu süsteemi kallal.
                            Vana varuosade süsteem on ajutiselt välja lülitatud.
                        </p>
                    </div>
                </div>

                {/* Cars Section */}
                <div className="garage-cars-section">
                    <h3 className="garage-section-title">🚗 Sinu autod</h3>

                    {userCars.length === 0 ? (
                        <div className="garage-no-vehicles">
                            <div className="garage-empty-icon">🏗️</div>
                            <h3>Garaaž on tühi</h3>
                            <p>Sul pole veel ühtegi autot. Mine autobaazerisse ja osta endale sõiduk!</p>
                            <button
                                className="garage-btn-marketplace"
                                onClick={() => navigate('/car-marketplace')}
                            >
                                Mine autobaazerisse
                            </button>
                        </div>
                    ) : (
                        <div className="garage-vehicles-grid">
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
                                    imageUrl: model.imageUrl
                                };

                                const stats = calculateCarStats(car, legacyModel);

                                return (
                                    <div key={car.id} className="garage-vehicle-card">
                                        <div className="garage-vehicle-header">
                                            <h4>{model.brandName} {model.model}</h4>
                                            <span className="garage-vehicle-engine">{car.engine.code}</span>
                                        </div>

                                        <div className="garage-vehicle-stats">
                                            <div className="garage-vehicle-stat-item">
                                                <span className="garage-stat-label">Võimsus:</span>
                                                <span className="garage-stat-value">{stats.power} kW</span>
                                            </div>
                                            <div className="garage-vehicle-stat-item">
                                                <span className="garage-stat-label">Kiirendus:</span>
                                                <span className="garage-stat-value">{stats.acceleration.toFixed(1)}s</span>
                                            </div>
                                            <div className="garage-vehicle-stat-item">
                                                <span className="garage-stat-label">Läbisõit:</span>
                                                <span className="garage-stat-value">{Math.round(car.mileage).toLocaleString()} km</span>
                                            </div>
                                        </div>

                                        <div className="garage-vehicle-actions">
                                            {car.isForSale ? (
                                                <div className="garage-sale-status">
                                                    <p className="garage-sale-info">
                                                        Müügis hinnaga: <strong>{car.salePrice?.toLocaleString()} €</strong>
                                                    </p>
                                                    <button
                                                        className="garage-btn-unlist"
                                                        onClick={() => handleUnlistCar(car.id)}
                                                        disabled={isListing}
                                                    >
                                                        {isListing ? 'Eemaldamine...' : 'Võta müügilt maha'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="garage-sell-controls">
                                                    <input
                                                        type="number"
                                                        placeholder="Müügihind (€)"
                                                        value={selectedCarId === car.id ? salePrice : ''}
                                                        onChange={(e) => {
                                                            setSelectedCarId(car.id);
                                                            setSalePrice(e.target.value);
                                                        }}
                                                        className="garage-price-input"
                                                    />
                                                    <button
                                                        className="garage-btn-list"
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
                                <div className="garage-add-vehicle-card">
                                    <div className="garage-add-vehicle-icon">🏗️</div>
                                    <h4>Lisa auto</h4>
                                    <p>Sul on veel {freeSlots} vaba garaažikohta</p>
                                    <button
                                        className="garage-btn-add-car"
                                        onClick={() => navigate('/car-marketplace')}
                                    >
                                        Mine autobaazerisse
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};