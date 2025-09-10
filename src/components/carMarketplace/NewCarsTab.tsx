import React, { useState, useMemo } from 'react';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getBrands, getCarsByBrand, ALL_CAR_MODELS } from '../../data/vehicles';
import CarListItem from './CarListItem';
import { CarModel } from '../../types/vehicles';
import { purchaseNewCar } from '../../services/VehicleService';
import '../../styles/components/carMarketplace/NewCarsTab.css';

const NewCarsTab: React.FC = () => {
    const { playerStats, refreshStats } = usePlayerStats();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price' | 'power' | 'brand'>('price');
    const [isPurchasing, setIsPurchasing] = useState(false);

    const brands = useMemo(() => getBrands(), []);

    const filteredCars = useMemo(() => {
        let cars = selectedBrand === 'all'
            ? ALL_CAR_MODELS
            : getCarsByBrand(selectedBrand);

        // Sorteeri
        return cars.sort((a, b) => {
            if (sortBy === 'price') {
                return a.basePrice - b.basePrice;
            } else if (sortBy === 'brand') {
                return a.brand.localeCompare(b.brand);
            } else {
                // TODO: Power sorting
                return 0;
            }
        });
    }, [selectedBrand, sortBy]);

    const handlePurchase = async (carModel: CarModel) => {
        if (!currentUser || !playerStats) {
            showToast('Palun logi sisse', 'error');
            return;
        }

        setIsPurchasing(true);
        try {
            const result = await purchaseNewCar(currentUser.uid, carModel);

            if (result.success) {
                showToast(result.message, 'success');
                // Värskenda mängija andmed (raha, garaaž)
                await refreshStats();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Purchase failed:', error);
            showToast('Viga auto ostmisel', 'error');
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <div className="new-cars-tab">
            <div className="filters-section">
                <div className="filter-group">
                    <label>Bränd:</label>
                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="brand-filter"
                    >
                        <option value="all">Kõik brändid</option>
                        {brands.map(brand => (
                            <option key={brand} value={brand}>
                                {brand}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Sorteeri:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="sort-filter"
                    >
                        <option value="price">Hind</option>
                        <option value="brand">Bränd</option>
                        <option value="power">Võimsus</option>
                    </select>
                </div>

                <div className="money-display">
                    <span>Sinu raha: </span>
                    <span className="money-amount">
                        €{playerStats?.money?.toLocaleString() || 0}
                    </span>
                </div>
            </div>

            <div className="cars-table-container">
                <table className="cars-table">
                    <thead>
                    <tr>
                        <th>Bränd</th>
                        <th>Mudel</th>
                        <th>Mootor</th>
                        <th>Võimsus</th>
                        <th>Mass</th>
                        <th>0-100</th>
                        <th>Hind</th>
                        <th>Tegevus</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredCars.map(carModel => (
                        <CarListItem
                            key={carModel.id}
                            carModel={carModel}
                            onPurchase={handlePurchase}
                            playerMoney={playerStats?.money || 0}
                            isPurchasing={isPurchasing}
                        />
                    ))}
                    </tbody>
                </table>
                {filteredCars.length === 0 && (
                    <div className="no-cars-message">
                        Ühtegi autot ei leitud
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewCarsTab;