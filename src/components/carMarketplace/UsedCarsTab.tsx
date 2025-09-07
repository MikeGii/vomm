// src/components/carMarketplace/UsedCarsTab.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import { getCarsForSale, purchaseUsedCar } from '../../services/VehicleService';
import { getCarModelById } from '../../data/vehicles';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import { PlayerCar } from '../../types/vehicles';
import '../../styles/components/carMarketplace/UsedCarsTab.css';

const UsedCarsTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats, refreshStats } = usePlayerStats();
    const { showToast } = useToast();

    // State muutujad
    const [usedCars, setUsedCars] = useState<Array<PlayerCar & { sellerName?: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'price' | 'date' | 'mileage' | 'power'>('date');
    const [filterBrand, setFilterBrand] = useState<string>('all');

    const loadUsedCars = useCallback(async () => {
        setLoading(true);
        try {
            const cars = await getCarsForSale();
            console.log('Received cars:', cars);

            const filteredCars = cars;

            console.log('Showing all cars:', filteredCars);

            setUsedCars(filteredCars);
        } catch (error) {
            console.error('Error loading used cars:', error);
            showToast('Viga autode laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

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
            .map(car => getCarModelById(car.carModelId)?.brand)
            .filter(Boolean)
    )];

    // Filtreeri autod brändi järgi
    const filteredByBrand = filterBrand === 'all'
        ? usedCars
        : usedCars.filter(car => {
            const model = getCarModelById(car.carModelId);
            return model?.brand === filterBrand;
        });

    // Sorteeri autod
    const sortedCars = [...filteredByBrand].sort((a, b) => {
        const modelA = getCarModelById(a.carModelId);
        const modelB = getCarModelById(b.carModelId);

        if (!modelA || !modelB) return 0;

        switch (sortBy) {
            case 'price':
                return (a.salePrice || 0) - (b.salePrice || 0);
            case 'mileage':
                return a.mileage - b.mileage;
            case 'power':
                const statsA = calculateCarStats(a, modelA);
                const statsB = calculateCarStats(b, modelB);
                return statsB.power - statsA.power; // Võimsam enne
            case 'date':
            default:
                // listedAt võib olla Date või Timestamp
                const dateA = a.listedAt instanceof Date ? a.listedAt.getTime() :
                    // @ts-ignore
                    (a.listedAt?.toDate?.() || new Date()).getTime();
                const dateB = b.listedAt instanceof Date ? b.listedAt.getTime() :
                    // @ts-ignore
                    (b.listedAt?.toDate?.() || new Date()).getTime();
                return dateB - dateA; // Uuemad enne
        }
    });

    // Tuuningu badge'i funktsioon
    const getTuningBadges = (car: PlayerCar) => {
        const badges = [];

        if (car.engine.turbo !== 'stock') {
            badges.push(`Turbo ${car.engine.turbo}`);
        }
        if (car.engine.ecu !== 'stock') {
            badges.push(`ECU ${car.engine.ecu}`);
        }
        if (car.engine.intake !== 'stock') {
            badges.push(`${car.engine.intake} intake`);
        }
        if (car.engine.exhaust !== 'stock') {
            badges.push(`${car.engine.exhaust} exhaust`);
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
                            ${playerStats?.money.toLocaleString() || 0}
                        </span>
                    </div>
                </div>

                <div className="cars-count">
                    Müügis: {sortedCars.length} autot
                </div>
            </div>

            {/* Autode nimekiri */}
            {/* Autode tabel */}
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
                            const carModel = getCarModelById(car.carModelId);
                            if (!carModel) return null;

                            const canAfford = (playerStats?.money || 0) >= (car.salePrice || 0);
                            const isPurchasingThis = isPurchasing === car.id;
                            const carStats = calculateCarStats(car, carModel);
                            const tuningBadges = getTuningBadges(car);

                            return (
                                <tr key={car.id} className={`car-row ${!canAfford ? 'unaffordable' : ''}`}>
                                    <td className="car-brand">{carModel.brand}</td>
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
                                                ${car.salePrice?.toLocaleString()}
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