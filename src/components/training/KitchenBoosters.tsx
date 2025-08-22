// src/components/training/KitchenBoosters.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '../../types';
import { consumeKitchenBooster } from '../../services/TrainingBoosterService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/training/TrainingBoosters.css';

interface KitchenBoostersProps {
    boosters: InventoryItem[];
    currentClicks: number;
    maxClicks: number;
    onBoosterUsed: () => void;
}

export const KitchenBoosters: React.FC<KitchenBoostersProps> = ({
                                                                    boosters,
                                                                    currentClicks,
                                                                    maxClicks,
                                                                    onBoosterUsed
                                                                }) => {
    const [selectedQuantities, setSelectedQuantities] = useState<{ [key: string]: number }>({});
    const [isUsing, setIsUsing] = useState(false);
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const getSelectedQuantity = (boosterId: string): number => {
        return selectedQuantities[boosterId] || 1;
    };

    const handleQuantityChange = (boosterId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setSelectedQuantities(prev => ({
            ...prev,
            [boosterId]: newQuantity
        }));
    };

    const handleUseBooster = async (booster: InventoryItem) => {
        if (!currentUser) {
            showToast('Sa pead olema sisse logitud!', 'error');
            return;
        }

        if (currentClicks >= maxClicks) {
            showToast('Sul on juba maksimaalne arv köök/labor klõpse!', 'info');
            return;
        }

        const quantity = getSelectedQuantity(booster.id);

        setIsUsing(true);
        try {
            const result = await consumeKitchenBooster(currentUser.uid, booster.id, quantity);

            if (result.success) {
                showToast(result.message, 'success');
                onBoosterUsed();
                // Reset quantity selection for this item
                setSelectedQuantities(prev => ({
                    ...prev,
                    [booster.id]: 1
                }));
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga köögitarbe kasutamisel', 'error');
        } finally {
            setIsUsing(false);
        }
    };

    return (
        <div className="training-boosters">
            <h3 className="boosters-title">Köök & Labor tarbed</h3>

            <div className="boosters-info">
                <p>
                    Köök/Labor klõpsud: <strong>{currentClicks}/{maxClicks}</strong>
                </p>
            </div>

            {boosters.length === 0 ? (
                <div className="boosters-empty-state">
                    <p className="empty-state-message">
                        Köök/labor korduste kiiremaks taastamiseks osta poest VIP tarbeid!
                    </p>
                    <button
                        className="go-to-shop-button"
                        onClick={() => navigate('/shop')}
                    >
                        Mine poodi
                    </button>
                </div>
            ) : (
                <div className="boosters-grid">
                    {boosters.map((booster) => {
                        const selectedQuantity = getSelectedQuantity(booster.id);
                        const clicksPerItem = booster.consumableEffect?.value || 0;
                        const totalClicksPreview = clicksPerItem * selectedQuantity;

                        return (
                            <div key={booster.id} className="booster-card">
                                <div className="booster-header">
                                    <h4 className="booster-name">{booster.name}</h4>
                                </div>

                                <p className="booster-description">{booster.description}</p>

                                <div className="booster-quantity-section">
                                    <div className="quantity-info">
                                        <span>Kogus: {booster.quantity}</span>
                                    </div>

                                    <div className="quantity-selector">
                                        <button
                                            className="quantity-btn"
                                            onClick={() => handleQuantityChange(booster.id, selectedQuantity - 1)}
                                            disabled={selectedQuantity <= 1}
                                        >
                                            −
                                        </button>
                                        <span className="quantity-display">{selectedQuantity}</span>
                                        <button
                                            className="quantity-btn"
                                            onClick={() => handleQuantityChange(booster.id, selectedQuantity + 1)}
                                            disabled={selectedQuantity >= booster.quantity}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="clicks-preview">
                                        Taastab: +{totalClicksPreview} klõpsu
                                    </div>
                                </div>

                                <button
                                    className="booster-use-button"
                                    onClick={() => handleUseBooster(booster)}
                                    disabled={isUsing || currentClicks >= maxClicks}
                                >
                                    {isUsing ? 'Kasutan...' : 'Kasuta'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};