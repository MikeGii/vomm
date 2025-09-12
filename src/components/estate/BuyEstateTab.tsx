// src/components/estate/BuyEstateTab.tsx (UPDATED for database)
import React, { useState, useEffect, useCallback } from 'react';
import { useEstate } from '../../contexts/EstateContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableEstates } from '../../services/EstateDatabaseService';
import { calculateEstateTransaction, purchaseEstate } from '../../services/EstateService';
import { getUserCars } from '../../services/VehicleService';
import { PlayerCar } from '../../types/vehicles';
import { EstateProperty } from '../../types/estate';
import '../../styles/components/estate/BuyEstateTab.css';

export const BuyEstateTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerEstate, refreshEstate } = useEstate();
    const { playerStats, refreshStats } = usePlayerStats();
    const { showToast } = useToast();
    const [purchasingEstate, setPurchasingEstate] = useState<string | null>(null);
    const [expandedEstate, setExpandedEstate] = useState<string | null>(null);

    const [availableEstates, setAvailableEstates] = useState<EstateProperty[]>([]);
    const [estatesLoading, setEstatesLoading] = useState(true);

    // Existing state for user cars
    const [userCars, setUserCars] = useState<PlayerCar[]>([]);
    const [carsLoading, setCarsLoading] = useState(true);

    const [sortBy, setSortBy] = useState<'price' | 'name'>('price');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // ✅ NEW: Load estates from database
    const loadAvailableEstates = useCallback(async () => {
        setEstatesLoading(true);
        try {
            const estates = await getAvailableEstates(sortBy, sortOrder);
            setAvailableEstates(estates);
        } catch (error) {
            console.error('Error loading estates:', error);
            showToast('Viga kinnisvarade laadimisel', 'error');
        } finally {
            setEstatesLoading(false);
        }
    }, [sortBy, sortOrder, showToast]);

    // Load user cars (unchanged)
    const loadUserCars = useCallback(async () => {
        if (!currentUser) return;

        setCarsLoading(true);
        try {
            const cars = await getUserCars(currentUser.uid);
            setUserCars(cars);
        } catch (error) {
            console.error('Viga autode laadimisel:', error);
        } finally {
            setCarsLoading(false);
        }
    }, [currentUser]);

    // ✅ UPDATED: Load both estates and cars
    useEffect(() => {
        loadAvailableEstates();
        loadUserCars();
    }, [loadAvailableEstates, loadUserCars]);

    // Function to check if garage capacity is problematic (unchanged)
    const checkGarageCapacityIssue = (estate: EstateProperty) => {
        if (carsLoading) return null;

        const currentEstate = playerEstate?.currentEstate;
        const userCarCount = userCars.length;

        if (currentEstate?.hasGarage && !estate.hasGarage && userCarCount > 0) {
            return {
                type: 'no-garage' as const,
                message: `⚠️ Sul on ${userCarCount} autot, kuid sellel kinnisvaral pole garaaži!`
            };
        }

        if (currentEstate?.hasGarage && estate.hasGarage) {
            const currentCapacity = currentEstate.garageCapacity || 0;
            const newCapacity = estate.garageCapacity || 0;

            if (newCapacity < currentCapacity && userCarCount > newCapacity) {
                const carsToSell = userCarCount - newCapacity;
                return {
                    type: 'downsize' as const,
                    message: `⚠️ Sul on ${userCarCount} autot, kuid uues garaažis on ainult ${newCapacity} kohta! Müü ${carsToSell} autot ära.`
                };
            }
        }

        return null;
    };

    // ✅ UPDATED: Purchase estate using database data
    const handlePurchaseEstate = async (estateId: string) => {
        if (!currentUser?.uid || !playerStats) return;

        // ✅ CHANGED: Find estate from database instead of hardcoded array
        const newEstate = availableEstates.find(e => e.id === estateId);
        if (!newEstate) {
            showToast('Kinnisvara ei leitud!', 'error');
            return;
        }

        const transaction = calculateEstateTransaction(newEstate, playerEstate?.currentEstate || null);

        if (playerStats.money < transaction.finalPrice) {
            showToast('Sul pole piisavalt raha selle kinnisvara ostmiseks!', 'error');
            return;
        }

        setPurchasingEstate(estateId);

        try {
            const result = await purchaseEstate(currentUser.uid, estateId);

            if (result.success) {
                await refreshEstate();
                await refreshStats();
                await loadUserCars();
                showToast(result.message, 'success');
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Ostu sooritamine ebaõnnestus', 'error');
        } finally {
            setPurchasingEstate(null);
        }
    };

    const toggleExpanded = (estateId: string) => {
        setExpandedEstate(expandedEstate === estateId ? null : estateId);
    };

    // Render estate row (unchanged logic, just typed properly)
    const renderEstateRow = (estate: EstateProperty) => {
        const transaction = calculateEstateTransaction(estate, playerEstate?.currentEstate || null);
        const canAfford = playerStats ? playerStats.money >= transaction.finalPrice : false;
        const isCurrentEstate = playerEstate?.currentEstate?.id === estate.id;
        const isExpanded = expandedEstate === estate.id;

        const garageIssue = checkGarageCapacityIssue(estate);
        const hasGarageIssue = garageIssue !== null;

        return (
            <div key={estate.id} className={`estate-list-item ${!canAfford ? 'unaffordable' : ''} ${isCurrentEstate ? 'current-estate' : ''} ${hasGarageIssue ? 'garage-issue' : ''}`}>
                <div className="estate-main-row" onClick={() => toggleExpanded(estate.id)}>
                    <div className="estate-expand-icon">
                        {isExpanded ? '▼' : '▶'}
                    </div>

                    <div className="estate-info">
                        <div className="estate-name-section">
                            <span className="estate-list-name">{estate.name}</span>
                            {isCurrentEstate && (
                                <span className="current-badge">Praegune</span>
                            )}
                        </div>

                        <div className="estate-features-row">
                            <span className={`feature-badge ${estate.hasGarage ? 'active' : 'inactive'}`}>
                                {estate.hasGarage ? `🚗 ${estate.garageCapacity} kohta` : '🚗 ❌'}
                            </span>
                            <span className={`feature-badge ${estate.hasWorkshop ? 'active' : 'inactive'}`}>
                                {estate.hasWorkshop ? '🔧 ✓' : '🔧 ❌'}
                            </span>
                            <span className="feature-badge active">
                                🍳 {estate.kitchenSpace === 'small' ? 'S' : estate.kitchenSpace === 'medium' ? 'M' : 'L'}
                            </span>
                        </div>

                        {garageIssue && (
                            <div className="garage-warning">
                                {garageIssue.message}
                            </div>
                        )}
                    </div>

                    <div className="estate-price-action">
                        <div className="estate-price">
                            <span className="price-label">Hind:</span>
                            <span className="price-amount">💰 {transaction.finalPrice.toLocaleString()}</span>
                        </div>

                        {!isCurrentEstate && (
                            <button
                                className={`purchase-btn ${!canAfford || hasGarageIssue ? 'disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchaseEstate(estate.id);
                                }}
                                disabled={!canAfford || hasGarageIssue || purchasingEstate === estate.id}
                            >
                                {purchasingEstate === estate.id ? '...' :
                                    transaction.currentEstate ?
                                        (transaction.finalPrice < 0 ? 'Vaheta' : 'Uuenda') :
                                        'Osta'}
                            </button>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="estate-details">
                        <p className="estate-description">{estate.description}</p>

                        {transaction.currentEstate && (
                            <div className="price-breakdown-compact">
                                <span>Kinnisvara hind: 💰 {estate.price.toLocaleString()}</span>
                                <span>Omandatud kinnisvara väärtus: -💰 {transaction.currentEstateValue.toLocaleString()}</span>
                                <span className="final-price">
                                    Lõplik hind: {transaction.finalPrice < 0 ? '+' : ''}💰 {Math.abs(transaction.finalPrice).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {!canAfford && !isCurrentEstate && (
                            <div className="insufficient-funds-compact">
                                Puudub: 💰 {(transaction.finalPrice - (playerStats?.money || 0)).toLocaleString()}
                            </div>
                        )}

                        {garageIssue && (
                            <div className="garage-warning-details">
                                <strong>Garaažiprobleem:</strong>
                                <p>{garageIssue.message}</p>
                                {garageIssue.type === 'downsize' && (
                                    <p className="suggestion">💡 Mine "Garaaž" lehele ja müü mõned autod enne kinnisvara ostmist.</p>
                                )}
                                {garageIssue.type === 'no-garage' && (
                                    <p className="suggestion">💡 Mine "Garaaž" lehele ja müü kõik autod enne kinnisvara ostmist.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ✅ UPDATED: Handle loading states
    if (estatesLoading) {
        return (
            <div className="buy-estate-tab">
                <div className="tab-header">
                    <h2>🏪 Saadaolevad kinnisvarad</h2>
                    <div className="player-money">
                        💰 {playerStats?.money?.toLocaleString() || 0}
                    </div>
                </div>

                {/* ✅ ADD THIS SORTING SECTION */}
                <div className="estates-sort-controls">
                    <div className="sort-group">
                        <label htmlFor="sort-by">Sorteeri:</label>
                        <select
                            id="sort-by"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'price' | 'name')}
                            className="sort-select"
                        >
                            <option value="price">Hinna järgi</option>
                            <option value="name">Nime järgi</option>
                        </select>
                    </div>
                    <div className="sort-group">
                        <label htmlFor="sort-order">Järjekord:</label>
                        <select
                            id="sort-order"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className="sort-select"
                        >
                            <option value="asc">{sortBy === 'price' ? 'Odavam enne' : 'A-Z'}</option>
                            <option value="desc">{sortBy === 'price' ? 'Kallim enne' : 'Z-A'}</option>
                        </select>
                    </div>
                </div>

                <div className="estates-list">
                    {availableEstates.map(renderEstateRow)}
                </div>
            </div>
        );
    }

    // ✅ UPDATED: Handle empty estates
    if (availableEstates.length === 0) {
        return (
            <div className="buy-estate-tab">
                <div className="tab-header">
                    <h2>🏪 Saadaolevad kinnisvarad</h2>
                    <div className="player-money">
                        💰 {playerStats?.money?.toLocaleString() || 0}
                    </div>
                </div>
                <div className="no-estates-message" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>❌ Praegu pole saadaolevaid kinnisvarasid</p>
                    <button onClick={loadAvailableEstates} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                        🔄 Proovi uuesti
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="buy-estate-tab">
            <div className="tab-header">
                <h2>🏪 Saadaolevad kinnisvarad</h2>
                <div className="player-money">
                    💰 {playerStats?.money?.toLocaleString() || 0}
                </div>
            </div>

            <div className="estates-list">
                {/* ✅ CHANGED: Use database estates instead of hardcoded */}
                {availableEstates.map(renderEstateRow)}
            </div>
        </div>
    );
};