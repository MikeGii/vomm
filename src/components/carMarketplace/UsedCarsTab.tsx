// src/components/carMarketplace/UsedCarsTab.tsx - UPDATED: Universal tuning system

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import { getCarsForSale, purchaseUsedCar } from '../../services/VehicleService';
import { getVehicleModelById } from '../../services/VehicleDatabaseService';
import { calculateCarStats, hasUniversalTuningUpgrades } from '../../utils/vehicleCalculations';
import { PlayerCar, UNIVERSAL_TUNING_CONFIG } from '../../types/vehicles';
import { VehicleModel } from '../../types/vehicleDatabase';
import { cacheManager } from '../../services/CacheManager';
import '../../styles/components/carMarketplace/UsedCarsTab.css';

// Cache for car models to avoid repeated database calls
const MODEL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const UsedCarsTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats, refreshStats } = usePlayerStats();
    const { showToast } = useToast();

    // State muutujad
    const [usedCars, setUsedCars] = useState<Array<PlayerCar & { sellerName?: string }>>([]);
    const [carModels, setCarModels] = useState<Map<string, VehicleModel>>(new Map()); // Cache car models
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'price' | 'date' | 'mileage' | 'power'>('date');
    const [filterBrand, setFilterBrand] = useState<string>('all');

    // Helper function to get car model (with caching)
    const getCarModel = useCallback(async (carModelId: string): Promise<VehicleModel | null> => {
        // Check memory cache first
        if (carModels.has(carModelId)) {
            return carModels.get(carModelId) || null;
        }

        // Check persistent cache
        const cacheKey = `car_model_${carModelId}`;
        const cachedModel = cacheManager.get<VehicleModel>(cacheKey, MODEL_CACHE_DURATION);

        if (cachedModel) {
            // Update memory cache
            setCarModels(prev => new Map(prev).set(carModelId, cachedModel));
            return cachedModel;
        }

        // Load from database
        try {
            const model = await getVehicleModelById(carModelId);
            if (model) {
                // Update both caches
                cacheManager.set(cacheKey, model, MODEL_CACHE_DURATION);
                setCarModels(prev => new Map(prev).set(carModelId, model));
                return model;
            }
        } catch (error) {
            console.error(`Error loading car model ${carModelId}:`, error);
        }

        return null;
    }, [carModels]);

    const loadUsedCars = useCallback(async () => {
        setLoading(true);
        try {
            const cars = await getCarsForSale();
            console.log('Received cars:', cars);

            // Preload all unique car models
            const uniqueModelIds = [...new Set(cars.map(car => car.carModelId))];
            await Promise.all(uniqueModelIds.map(id => getCarModel(id)));

            setUsedCars(cars);
        } catch (error) {
            console.error('Error loading used cars:', error);
            showToast('Viga autode laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast, getCarModel]);

    useEffect(() => {
        loadUsedCars();
    }, [loadUsedCars]);

    // Funktsioon auto ostmiseks
    const handlePurchase = async (car: PlayerCar) => {
        if (!currentUser || !playerStats) {
            showToast('Palun logi sisse', 'error');
            return;
        }

        // Kontrolli raha
        if (playerStats.money < (car.salePrice || 0)) {
            showToast('Sul pole piisavalt raha selle auto ostmiseks', 'error');
            return;
        }

        setIsPurchasing(car.id);

        try {
            const result = await purchaseUsedCar(currentUser.uid, car.id);

            if (result.success) {
                showToast(result.message, 'success');

                // Värskenda andmed
                await refreshStats();
                await loadUsedCars();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error purchasing car:', error);
            showToast('Viga auto ostmisel', 'error');
        } finally {
            setIsPurchasing(null);
        }
    };

    // Saa unikaalsed brändid filtri jaoks
    const availableBrands = [...new Set(
        usedCars
            .map(car => carModels.get(car.carModelId)?.brandName)
            .filter(Boolean)
    )];

    // Filtreeri autod brändi järgi
    const filteredByBrand = filterBrand === 'all'
        ? usedCars
        : usedCars.filter(car => {
            const model = carModels.get(car.carModelId);
            return model?.brandName === filterBrand;
        });

    // Sorteeri autod
    const sortedCars = [...filteredByBrand].sort((a, b) => {
        const modelA = carModels.get(a.carModelId);
        const modelB = carModels.get(b.carModelId);

        if (!modelA || !modelB) return 0;

        // Convert VehicleModel to CarModel format for calculateCarStats
        const carModelA = {
            id: modelA.id,
            brand: modelA.brandName,
            model: modelA.model,
            mass: modelA.mass,
            compatibleEngines: modelA.compatibleEngineIds,
            defaultEngine: modelA.defaultEngineId,
            basePrice: modelA.basePrice,
            imageUrl: modelA.imageUrl
        };

        const carModelB = {
            id: modelB.id,
            brand: modelB.brandName,
            model: modelB.model,
            mass: modelB.mass,
            compatibleEngines: modelB.compatibleEngineIds,
            defaultEngine: modelB.defaultEngineId,
            basePrice: modelB.basePrice,
            imageUrl: modelB.imageUrl
        };

        switch (sortBy) {
            case 'price':
                return (a.salePrice || 0) - (b.salePrice || 0);
            case 'mileage':
                return a.mileage - b.mileage;
            case 'power':
                const statsA = calculateCarStats(a, carModelA);
                const statsB = calculateCarStats(b, carModelB);
                return statsB.power - statsA.power; // Võimsam enne
            case 'date':
            default:
                const dateA = a.listedAt instanceof Date ? a.listedAt.getTime() :
                    // @ts-ignore
                    (a.listedAt?.toDate?.() || new Date()).getTime();
                const dateB = b.listedAt instanceof Date ? b.listedAt.getTime() :
                    // @ts-ignore
                    (b.listedAt?.toDate?.() || new Date()).getTime();
                return dateB - dateA; // Uuemad enne
        }
    });

    // NEW: Universal tuning badge function
    const getTuningBadges = (car: PlayerCar): string[] => {
        const badges: string[] = [];

        if (car.universalTuning && hasUniversalTuningUpgrades(car.universalTuning)) {
            // Show highest tuning levels for each category
            Object.entries(car.universalTuning).forEach(([category, level]) => {
                if (level > 0) {
                    const config = UNIVERSAL_TUNING_CONFIG[category as keyof typeof UNIVERSAL_TUNING_CONFIG];
                    if (config) {
                        badges.push(`${config.emoji} ${config.name} ${level}`);
                    }
                }
            });
        }

        return badges;
    };

    // Kui laeb
    if (loading) {
        return (
            <div className="used-cars-tab">
                <div className="loading-message">
                    Laadin müügis olevaid autosid...
                </div>
            </div>
        );
    }

    // Põhivaade
    return (
        <div className="used-cars-tab">
            {/* Filtrid ja info */}
            <div className="tab-header">
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Bränd:</label>
                        <select
                            className="brand-filter"
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                        >
                            <option value="all">Kõik brändid</option>
                            {availableBrands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Sorteeri:</label>
                        <select
                            className="sort-filter"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="date">Kuupäeva järgi (uuemad enne)</option>
                            <option value="price">Hinna järgi (odavamad enne)</option>
                            <option value="mileage">Läbisõidu järgi</option>
                            <option value="power">Võimsuse järgi</option>
                        </select>
                    </div>

                    <div className="money-display">
                        <span className="money-label">Sinu raha:</span>
                        <span className="money-amount">
                            €{playerStats?.money.toLocaleString() || 0}
                        </span>
                    </div>
                </div>

                <div className="cars-count">
                    Müügis: {sortedCars.length} autot
                </div>
            </div>

            {/* Autode nimekiri */}
            {sortedCars.length === 0 ? (
                <div className="no-cars-message">
                    <h3>Hetkel pole ühtegi kasutatud autot müügis</h3>
                    <p>Vaata hiljem uuesti või pane ise auto müüki!</p>
                </div>
            ) : (
                <div className="used-cars-table-container">
                    <table className="used-cars-table">
                        <thead>
                        <tr>
                            <th>Bränd</th>
                            <th>Mudel</th>
                            <th>Mootor</th>
                            <th>Võimsus</th>
                            <th>Läbisõit</th>
                            <th>Tuuning</th>
                            <th>Müüja</th>
                            <th>Hind</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedCars.map(car => {
                            const carModel = carModels.get(car.carModelId);
                            if (!carModel) return null;

                            const canAfford = (playerStats?.money || 0) >= (car.salePrice || 0);
                            const isPurchasingThis = isPurchasing === car.id;

                            // Convert to CarModel format for calculateCarStats
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

                            const carStats = calculateCarStats(car, legacyCarModel);
                            const tuningBadges = getTuningBadges(car);

                            return (
                                <tr key={car.id} className={`car-row ${!canAfford ? 'unaffordable' : ''}`}>
                                    <td className="car-brand">{carModel.brandName}</td>
                                    <td className="car-model">{carModel.model}</td>
                                    <td className="car-engine">
                                        <span className="engine-code">{car.engine.code}</span>
                                    </td>
                                    <td className="car-power">
                                        <span className="power-value">
                                            {Math.round(carStats.power)} kW
                                        </span>
                                        <span className="horsepower">
                                            ({Math.round(carStats.power * 1.341)} hp)
                                        </span>
                                    </td>
                                    <td className="car-mileage">
                                        {car.mileage.toLocaleString()} km
                                    </td>
                                    <td className="car-tuning">
                                        {tuningBadges.length > 0 ? (
                                            <div className="tuning-badges-inline">
                                                {tuningBadges.map(badge => (
                                                    <span key={badge} className="tuning-badge-small">
                                                        {badge}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="stock-badge">Stock</span>
                                        )}
                                    </td>
                                    <td className="car-seller">
                                        {car.sellerName || 'Kasutaja'}
                                    </td>
                                    <td className="car-price">
                                        <span className={`price ${!canAfford ? 'price-unaffordable' : ''}`}>
                                            €{car.salePrice?.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="car-action">
                                        <button
                                            className={`btn-purchase-table ${!canAfford ? 'disabled' : ''} ${isPurchasingThis ? 'purchasing' : ''}`}
                                            onClick={() => handlePurchase(car)}
                                            disabled={!canAfford || isPurchasingThis}
                                        >
                                            {isPurchasingThis ? '...' :
                                                !canAfford ? '💰' : 'Osta'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UsedCarsTab;