// src/components/estate/BuyEstateTab.tsx (NEW FILE)
import React, { useState } from 'react';
import { useEstate } from '../../contexts/EstateContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { AVAILABLE_ESTATES } from '../../data/estates';
import { calculateEstateTransaction, purchaseEstate } from '../../services/EstateService';
import '../../styles/components/estate/BuyEstateTab.css';

export const BuyEstateTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerEstate, refreshEstate } = useEstate();
    const { playerStats, refreshStats } = usePlayerStats();
    const { showToast } = useToast();
    const [purchasingEstate, setPurchasingEstate] = useState<string | null>(null);

    const handlePurchaseEstate = async (estateId: string) => {
        if (!currentUser?.uid || !playerStats) return;

        const newEstate = AVAILABLE_ESTATES.find(e => e.id === estateId);
        if (!newEstate) return;

        // Calculate transaction
        const transaction = calculateEstateTransaction(newEstate, playerEstate?.currentEstate || null);

        // Check if player has enough money
        if (playerStats.money < transaction.finalPrice) {
            showToast('Sul pole piisavalt raha selle kinnisvara ostmiseks!', 'error');
            return;
        }

        setPurchasingEstate(estateId);

        try {
            const result = await purchaseEstate(currentUser.uid, estateId, playerStats.money);

            if (result.success) {
                await refreshEstate();
                await refreshStats();
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

    const renderEstateCard = (estate: any) => {
        const transaction = calculateEstateTransaction(estate, playerEstate?.currentEstate || null);
        const canAfford = playerStats ? playerStats.money >= transaction.finalPrice : false;
        const isCurrentEstate = playerEstate?.currentEstate?.id === estate.id;

        return (
            <div key={estate.id} className={`estate-card ${!canAfford ? 'unaffordable' : ''} ${isCurrentEstate ? 'current-estate' : ''}`}>
                <div className="estate-card-header">
                    <h3 className="estate-name">{estate.name}</h3>
                    {isCurrentEstate && (
                        <div className="current-badge">Praegune kinnisvara</div>
                    )}
                </div>

                <div className="estate-description">
                    <p>{estate.description}</p>
                </div>

                <div className="estate-features">
                    <div className="features-grid">
                        <div className={`feature ${estate.hasGarage ? 'active' : 'inactive'}`}>
                            <span className="feature-icon">🚗</span>
                            <div className="feature-info">
                                <span className="feature-name">Garaaž</span>
                                <span className="feature-value">
                                    {estate.hasGarage ? `${estate.garageCapacity} kohta` : 'Puudub'}
                                </span>
                            </div>
                        </div>

                        <div className={`feature ${estate.hasWorkshop ? 'active' : 'inactive'}`}>
                            <span className="feature-icon">🔧</span>
                            <div className="feature-info">
                                <span className="feature-name">Töökoda</span>
                                <span className="feature-value">
                                    {estate.hasWorkshop ? 'Saadaval' : 'Puudub'}
                                </span>
                            </div>
                        </div>

                        <div className="feature active">
                            <span className="feature-icon">🍳</span>
                            <div className="feature-info">
                                <span className="feature-name">Köök</span>
                                <span className="feature-value">
                                    {estate.kitchenSpace === 'small' && 'Väike'}
                                    {estate.kitchenSpace === 'medium' && 'Keskmine'}
                                    {estate.kitchenSpace === 'large' && 'Suur'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pricing-section">
                    <div className="price-breakdown">
                        <div className="price-row">
                            <span>Kinnisvara hind:</span>
                            <span className="price-value">💰 {estate.price.toLocaleString()}</span>
                        </div>

                        {transaction.currentEstate && (
                            <div className="price-row credit">
                                <span>Praeguse väärtus (90%):</span>
                                <span className="price-value">-💰 {transaction.currentEstateValue.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="price-row final">
                            <span>Lõplik hind:</span>
                            <span className={`price-value ${transaction.finalPrice < 0 ? 'credit' : ''}`}>
                                {transaction.finalPrice < 0 ? '+' : ''}💰 {Math.abs(transaction.finalPrice).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="purchase-section">
                        {!isCurrentEstate && (
                            <button
                                className={`purchase-button ${!canAfford ? 'disabled' : ''}`}
                                onClick={() => handlePurchaseEstate(estate.id)}
                                disabled={!canAfford || purchasingEstate === estate.id}
                            >
                                {purchasingEstate === estate.id ? (
                                    'Ostan...'
                                ) : transaction.currentEstate ? (
                                    transaction.finalPrice < 0 ? 'Müü alla' : 'Uuenda'
                                ) : (
                                    'Osta'
                                )}
                            </button>
                        )}

                        {!canAfford && !isCurrentEstate && (
                            <div className="insufficient-funds">
                                Puudub: 💰 {(transaction.finalPrice - (playerStats?.money || 0)).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="buy-estate-tab">
            <div className="tab-header">
                <h2>🏪 Saadaolevad kinnisvarad</h2>
                <div className="player-money">
                    Sinu raha: 💰 {playerStats?.money?.toLocaleString() || 0}
                </div>
            </div>

            <div className="estates-grid">
                {AVAILABLE_ESTATES.map(renderEstateCard)}
            </div>
        </div>
    );
};