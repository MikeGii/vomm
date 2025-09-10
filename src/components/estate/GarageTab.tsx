// src/components/estate/GarageTab.tsx
import React, {useCallback, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getUserCars, listCarForSale, unlistCarFromSale } from '../../services/VehicleService';
import { getVehicleModelById } from '../../services/VehicleDatabaseService'; // Changed import
import { calculateCarStats } from '../../utils/vehicleCalculations';
import CarTuningSelector from './CarTuningSelector';
import SparePartsInventory from './SparePartsInventory';
import { PlayerCar } from '../../types/vehicles';
import { VehicleModel } from '../../types/vehicleDatabase'; // Added import
import { cacheManager } from '../../services/CacheManager'; // Added import
import '../../styles/components/estate/GarageTab.css';

// Cache duration for car models
const MODEL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const GarageTab: React.FC = () => {
    const { playerEstate } = useEstate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [userCars, setUserCars] = useState<PlayerCar[]>([]);
    const [carModels, setCarModels] = useState<Map<string, VehicleModel>>(new Map()); // Cache car models
    const [loading, setLoading] = useState(true);
    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
    const [salePrice, setSalePrice] = useState<string>('');
    const [isListing, setIsListing] = useState(false);

    const [selectedTuningCarId, setSelectedTuningCarId] = useState<string | null>(null);

    // Check if player has garage access
    const hasGarageAccess = playerEstate?.currentEstate?.hasGarage || false;
    const garageCapacity = playerEstate?.currentEstate?.garageCapacity || 0;

    // Helper function to get car model (with caching and fallback)
    const getCarModel = useCallback(async (carModelId: string): Promise<VehicleModel | null> => {
        // Check memory cache first
        if (carModels.has(carModelId)) {
            return carModels.get(carModelId) || null;
        }

        // Check persistent cache
        const cacheKey = `car_model_${carModelId}`;
        const cachedModel = cacheManager.get<VehicleModel>(cacheKey, MODEL_CACHE_DURATION);

        if (cachedModel) {
            setCarModels(prev => new Map(prev).set(carModelId, cachedModel));
            return cachedModel;
        }

        // Try to load from database first
        try {
            const model = await getVehicleModelById(carModelId);
            if (model) {
                cacheManager.set(cacheKey, model, MODEL_CACHE_DURATION);
                setCarModels(prev => new Map(prev).set(carModelId, model));
                return model;
            }
        } catch (error) {
            console.log(`Database lookup failed for ${carModelId}, trying hardcoded fallback`);
        }

        // Fallback: Try hardcoded data for old cars
        try {
            const { getCarModelById: getHardcodedModel } = await import('../../data/vehicles');
            const hardcodedModel = getHardcodedModel(carModelId);

            if (hardcodedModel) {
                // Convert hardcoded CarModel to VehicleModel format
                const convertedModel: VehicleModel = {
                    id: hardcodedModel.id,
                    brandId: '',
                    brandName: hardcodedModel.brand,
                    model: hardcodedModel.model,
                    mass: hardcodedModel.mass,
                    basePrice: hardcodedModel.basePrice,
                    defaultEngineId: hardcodedModel.defaultEngine,
                    compatibleEngineIds: hardcodedModel.compatibleEngines,
                    imageUrl: hardcodedModel.imageUrl,
                    createdAt: { seconds: 0, nanoseconds: 0 } as any,
                    updatedAt: { seconds: 0, nanoseconds: 0 } as any,
                    createdBy: 'legacy'
                };

                cacheManager.set(cacheKey, convertedModel, MODEL_CACHE_DURATION);
                setCarModels(prev => new Map(prev).set(carModelId, convertedModel));
                return convertedModel;
            }
        } catch (error) {
            console.warn(`Could not load hardcoded model ${carModelId}:`, error);
        }

        return null;
    }, [carModels]);

    const loadUserCars = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const cars = await getUserCars(currentUser.uid);
            setUserCars(cars);

            // Preload all car models
            const uniqueModelIds = [...new Set(cars.map(car => car.carModelId))];
            await Promise.all(uniqueModelIds.map(id => getCarModel(id)));

        } catch (error) {
            console.error('Error loading cars:', error);
            showToast('Viga autode laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, showToast, getCarModel]);

    useEffect(() => {
        if (hasGarageAccess && currentUser) {
            loadUserCars();
        } else {
            setLoading(false);
        }
    }, [hasGarageAccess, currentUser, loadUserCars]);

    const handleListForSale = async (carId: string) => {
        if (!currentUser) return;

        const price = parseInt(salePrice);
        if (!price || price < 100) {
            showToast('Hind peab olema vähemalt $100', 'error');
            return;
        }

        setIsListing(true);
        try {
            const result = await listCarForSale(currentUser.uid, carId, price);
            if (result.success) {
                showToast(result.message, 'success');
                setSelectedCarId(null);
                setSalePrice('');
                await loadUserCars();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga auto müüki panemisel', 'error');
        } finally {
            setIsListing(false);
        }
    };

    const handleUnlistFromSale = async (carId: string) => {
        if (!currentUser) return;

        setIsListing(true);
        try {
            const result = await unlistCarFromSale(currentUser.uid, carId);
            if (result.success) {
                showToast(result.message, 'success');
                await loadUserCars();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga auto müügist eemaldamisel', 'error');
        } finally {
            setIsListing(false);
        }
    };

    const handlePartInstalled = () => {
        loadUserCars();
    };

    // If no garage access
    if (!hasGarageAccess) {
        return (
            <div className="garage-tab">
                <div className="garage-header">
                    <h2>🚗 Garaaž</h2>
                </div>
                <div className="garage-content">
                    <div className="no-garage-access">
                        <div className="no-garage-icon">🏠🚫</div>
                        <h3>Sul ei ole garaažiruumi</h3>
                        <p>Garaažiga kinnisvara ostmiseks külasta "Osta kinnisvara" vahekaarti.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="garage-tab">
                <div className="garage-header">
                    <h2>🚗 Sinu Garaaž</h2>
                </div>
                <div className="garage-content">
                    <div className="loading">Laadin garaaži...</div>
                </div>
            </div>
        );
    }

    const usedSlots = userCars.length;
    const freeSlots = garageCapacity - usedSlots;

    return (
        <div className="garage-tab">
            <div className="garage-header">
                <h2>🚗 Sinu Garaaž</h2>
                <div className="garage-info">
                    <div className="capacity-display">
                        <span>Kasutatud: {usedSlots}/{garageCapacity}</span>
                        <span className="free-slots">Vabad kohad: {freeSlots}</span>
                    </div>
                </div>
            </div>

            <div className="garage-content">
                {userCars.length === 0 ? (
                    <div className="no-vehicles">
                        <div className="empty-garage-icon">🚗💨</div>
                        <h3>Sul ei ole veel ühtegi sõidukit</h3>
                        <p>Sõidukeid saad osta autoturult.</p>
                        <button
                            className="btn-go-marketplace"
                            onClick={() => navigate('/car-marketplace')}
                        >
                            Mine autoturule
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="vehicles-grid">
                            {userCars.map((car) => {
                                const carModel = carModels.get(car.carModelId);

                                // Show placeholder for cars without model data
                                if (!carModel) {
                                    return (
                                        <div key={car.id} className="vehicle-card error">
                                            <div className="vehicle-header">
                                                <h4>Tundmatu mudel</h4>
                                                <span className="error-badge">Model ID: {car.carModelId}</span>
                                            </div>
                                            <p>Auto mudeli andmeid ei leitud. Võimalik, et see vajab migratsiooni.</p>
                                        </div>
                                    );
                                }

                                // Convert to legacy format for calculateCarStats
                                const legacyCarModel = {
                                    id: carModel.id,
                                    brand: carModel.brandName,
                                    model: carModel.model,
                                    mass: carModel.mass,
                                    compatibleEngines: carModel.compatibleEngineIds,
                                    defaultEngine: carModel.defaultEngineId,
                                    basePrice: carModel.basePrice,
                                    imageUrl: carModel.imageUrl
                                };

                                const stats = calculateCarStats(car, legacyCarModel);
                                const isSellingMode = selectedCarId === car.id;

                                return (
                                    <div key={car.id} className={`vehicle-card ${car.isForSale ? 'for-sale' : ''}`}>
                                        <div className="vehicle-header">
                                            <h4>{carModel.brandName} {carModel.model}</h4>
                                            {car.isForSale && (
                                                <span className="sale-badge">
                                                    Müügis: ${car.salePrice?.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="vehicle-stats">
                                            <div className="stat">
                                                <span className="label">Mootor:</span>
                                                <span className="value">{car.engine.code}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="label">Võimsus:</span>
                                                <span className="value">{stats.power} kW</span>
                                            </div>
                                            <div className="stat">
                                                <span className="label">Mass:</span>
                                                <span className="value">{stats.mass} kg</span>
                                            </div>
                                            <div className="stat">
                                                <span className="label">0-100:</span>
                                                <span className="value">{stats.acceleration}s</span>
                                            </div>
                                            <div className="stat">
                                                <span className="label">Läbisõit:</span>
                                                <span className="value">{car.mileage.toLocaleString()} km</span>
                                            </div>
                                        </div>

                                        <div className="vehicle-tuning">
                                            {car.engine.turbo !== 'stock' && (
                                                <span className="tuning-badge">Turbo: {car.engine.turbo}</span>
                                            )}
                                            {car.engine.ecu !== 'stock' && (
                                                <span className="tuning-badge">ECU: {car.engine.ecu}</span>
                                            )}
                                            {car.engine.intake !== 'stock' && (
                                                <span className="tuning-badge">Intake: {car.engine.intake}</span>
                                            )}
                                            {car.engine.exhaust !== 'stock' && (
                                                <span className="tuning-badge">Exhaust: {car.engine.exhaust}</span>
                                            )}
                                        </div>

                                        <div className="vehicle-actions">
                                            {!car.isForSale ? (
                                                <>
                                                    <button className="btn-tune" disabled>
                                                        Tuuni (varsti)
                                                    </button>
                                                    {!isSellingMode ? (
                                                        <button
                                                            className="btn-sell"
                                                            onClick={() => setSelectedCarId(car.id)}
                                                        >
                                                            Pane müüki
                                                        </button>
                                                    ) : (
                                                        <div className="sell-controls">
                                                            <input
                                                                type="number"
                                                                placeholder="Hind ($)"
                                                                value={salePrice}
                                                                onChange={(e) => setSalePrice(e.target.value)}
                                                                min="100"
                                                            />
                                                            <button
                                                                className="btn-confirm"
                                                                onClick={() => handleListForSale(car.id)}
                                                                disabled={isListing}
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                className="btn-cancel"
                                                                onClick={() => {
                                                                    setSelectedCarId(null);
                                                                    setSalePrice('');
                                                                }}
                                                                disabled={isListing}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <button
                                                    className="btn-unlist"
                                                    onClick={() => handleUnlistFromSale(car.id)}
                                                    disabled={isListing}
                                                >
                                                    Eemalda müügist
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {freeSlots > 0 && (
                                <div className="add-vehicle-card">
                                    <div className="add-icon">➕</div>
                                    <h4>Lisa uus auto</h4>
                                    <p>Sul on {freeSlots} vaba kohta</p>
                                    <button
                                        className="btn-add-car"
                                        onClick={() => navigate('/car-marketplace')}
                                    >
                                        Mine autoturule
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="tuning-section">
                            <CarTuningSelector
                                userCars={userCars}
                                onCarSelect={setSelectedTuningCarId}
                                selectedCarId={selectedTuningCarId}
                                onCarUpdated={handlePartInstalled}
                            />

                            <SparePartsInventory
                                selectedCarId={selectedTuningCarId}
                                onPartInstalled={handlePartInstalled}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};