import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { useNavigate } from 'react-router-dom';
import { consumeHandicraftBooster } from '../../services/TrainingBoosterService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/training/TrainingBoosters.css';

interface HandicraftBoostersProps {
    boosters: InventoryItem[];
    currentClicks: number;
    maxClicks: number;
    onBoosterUsed: () => void;
}

export const HandicraftBoosters: React.FC<HandicraftBoostersProps> = ({
                                                                          boosters,
                                                                          currentClicks,
                                                                          maxClicks,
                                                                          onBoosterUsed
                                                                      }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [isUsing, setIsUsing] = useState(false);
    const [selectedQuantities, setSelectedQuantities] = useState<{ [itemId: string]: number }>({});

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
        if (!currentUser || isUsing) return;

        setIsUsing(true);
        try {
            const selectedQuantity = getSelectedQuantity(booster.id);
            const result = await consumeHandicraftBooster(currentUser.uid, booster.id, selectedQuantity);

            if (result.success) {
                showToast(result.message, 'success');
                onBoosterUsed();

                // Reset selected quantity for this booster
                setSelectedQuantities(prev => ({
                    ...prev,
                    [booster.id]: 1
                }));
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Käsitöötarbe kasutamine ebaõnnestus', 'error');
        } finally {
            setIsUsing(false);
        }
    };

    return (
        <div className="training-boosters">
            <h3 className="boosters-title">
                Käsitöö tarbikud ({currentClicks}/{maxClicks} klõpsu)
            </h3>

            {boosters.length === 0 ? (
                <div className="boosters-empty-state">
                    <p className="empty-state-message">
                        Käsitöö korduste kiiremaks taastamiseks osta poest VIP tarbeid!
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
                                    {isUsing ? 'Kasutan...' : 'Kasuta tarbekaupa'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};