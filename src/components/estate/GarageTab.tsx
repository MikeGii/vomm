import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getUserCars, listCarForSale, unlistCarFromSale } from '../../services/VehicleService';
import { getCarModelById } from '../../data/vehicles';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import { PlayerCar } from '../../types/vehicles';
import '../../styles/components/estate/GarageTab.css';

export const GarageTab: React.FC = () => {
    const { playerEstate } = useEstate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [userCars, setUserCars] = useState<PlayerCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
    const [salePrice, setSalePrice] = useState<string>('');
    const [isListing, setIsListing] = useState(false);

    // Check if player has garage access
    const hasGarageAccess = playerEstate?.currentEstate?.hasGarage || false;
    const garageCapacity = playerEstate?.currentEstate?.garageCapacity || 0;

    useEffect(() => {
        if (hasGarageAccess && currentUser) {
            loadUserCars();
        } else {
            setLoading(false);
        }
    }, [hasGarageAccess, currentUser]);

    const loadUserCars = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const cars = await getUserCars(currentUser.uid);
            setUserCars(cars);
        } catch (error) {
            console.error('Error loading cars:', error);
            showToast('Viga autode laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    };

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
                    <div className="vehicles-grid">
                        {userCars.map((car) => {
                            const carModel = getCarModelById(car.carModelId);
                            if (!carModel) return null;

                            const stats = calculateCarStats(car, carModel);
                            const isSellingMode = selectedCarId === car.id;

                            return (
                                <div key={car.id} className={`vehicle-card ${car.isForSale ? 'for-sale' : ''}`}>
                                    <div className="vehicle-header">
                                        <h4>{carModel.brand} {carModel.model}</h4>
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
                )}
            </div>
        </div>
    );
};