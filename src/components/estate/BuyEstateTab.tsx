// src/components/estate/BuyEstateTab.tsx
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
    const [expandedEstate, setExpandedEstate] = useState<string | null>(null);

    const handlePurchaseEstate = async (estateId: string) => {
        if (!currentUser?.uid || !playerStats) return;

        const newEstate = AVAILABLE_ESTATES.find(e => e.id === estateId);
        if (!newEstate) return;

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

    const renderEstateRow = (estate: any) => {
        const transaction = calculateEstateTransaction(estate, playerEstate?.currentEstate || null);
        const canAfford = playerStats ? playerStats.money >= transaction.finalPrice : false;
        const isCurrentEstate = playerEstate?.currentEstate?.id === estate.id;
        const isExpanded = expandedEstate === estate.id;

        return (
            <div key={estate.id} className={`estate-list-item ${!canAfford ? 'unaffordable' : ''} ${isCurrentEstate ? 'current-estate' : ''}`}>
                {/* Main Row - Always Visible */}
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
                    </div>

                    <div className="estate-price-action">
                        <div className="estate-price">
                            <span className="price-label">Hind:</span>
                            <span className="price-amount">💰 {transaction.finalPrice.toLocaleString()}</span>
                        </div>

                        {!isCurrentEstate && (
                            <button
                                className={`purchase-btn ${!canAfford ? 'disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchaseEstate(estate.id);
                                }}
                                disabled={!canAfford || purchasingEstate === estate.id}
                            >
                                {purchasingEstate === estate.id ? '...' :
                                    transaction.currentEstate ?
                                        (transaction.finalPrice < 0 ? 'Vaheta' : 'Uuenda') :
                                        'Osta'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable Details */}
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
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="buy-estate-tab">
            <div className="tab-header">
                <h2>🏪 Saadaolevad kinnisvarad</h2>
                <div className="player-money">
                    💰 {playerStats?.money?.toLocaleString() || 0}
                </div>
            </div>

            <div className="estates-list">
                {AVAILABLE_ESTATES.map(renderEstateRow)}
            </div>
        </div>
    );
};