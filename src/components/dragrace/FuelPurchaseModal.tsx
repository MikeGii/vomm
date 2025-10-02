// src/components/dragrace/FuelPurchaseModal.tsx (Updated with quantity selection)
import React, { useState } from 'react';
import { FuelPurchaseOption, FUEL_CONSTANTS } from '../../types/dragRace';
import { PlayerStats } from '../../types';
import { formatMoney, formatPollid } from '../../utils/currencyUtils';
import '../../styles/components/dragrace/FuelPurchaseModal.css'

interface FuelPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchase: (purchaseType: 'money' | 'pollid', quantity: number) => void;
    purchaseOptions: FuelPurchaseOption[];
    playerStats: PlayerStats;
    playerPollid: number;
}

export const FuelPurchaseModal: React.FC<FuelPurchaseModalProps> = ({
                                                                        isOpen,
                                                                        onClose,
                                                                        onPurchase,
                                                                        purchaseOptions,
                                                                        playerStats,
                                                                        playerPollid
                                                                    }) => {
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    if (!isOpen) return null;

    const moneyOption = purchaseOptions.find(opt => opt.type === 'money');
    const pollidOption = purchaseOptions.find(opt => opt.type === 'pollid');

    // Calculate costs for selected quantity
    const moneyTotalCost = moneyOption ? moneyOption.cost * selectedQuantity : 0;
    const pollidTotalCost = pollidOption ? pollidOption.cost * selectedQuantity : 0;

    // Check if player can afford the selected quantity
    const canAffordMoney = moneyOption && playerStats.money >= moneyTotalCost;
    const canAffordPollid = pollidOption && playerPollid >= pollidTotalCost;

    // Check remaining money purchases availability
    const moneyPurchasesLeft = moneyOption?.remaining || 0;

    return (
        <div className="dr-modal-overlay" onClick={onClose}>
            <div className="dr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dr-modal-header">
                    <h2 className="dr-modal-title">
                        <span className="dr-modal-icon">⛽</span>
                        Osta kütust
                    </h2>
                    <button className="dr-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="dr-modal-content">
                    <div className="dr-fuel-purchase-info">
                        <p className="dr-purchase-description">
                            Sul on kütus otsas! Osta lisaks või oota järgmist tundi tasuta täiendust.
                        </p>

                        <div className="dr-current-currency">
                            <div className="dr-currency-item">
                                <span className="dr-currency-icon">💰</span>
                                <span className="dr-currency-amount">{formatMoney(playerStats.money)}</span>
                            </div>
                            <div className="dr-currency-item">
                                <span className="dr-currency-icon">🔹</span>
                                <span className="dr-currency-amount">{formatPollid(playerPollid)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="dr-quantity-section">
                        <h3 className="dr-quantity-title">Vali kogus:</h3>
                        <div className="dr-quantity-selector">
                            {[1, 2, 3, 4, 5].map(quantity => (
                                <button
                                    key={quantity}
                                    className={`dr-quantity-button ${selectedQuantity === quantity ? 'dr-selected' : ''}`}
                                    onClick={() => setSelectedQuantity(quantity)}
                                >
                                    {quantity}
                                </button>
                            ))}
                        </div>
                        <p className="dr-quantity-info">
                            Valitud: <strong>{selectedQuantity}</strong> katset
                        </p>
                    </div>

                    <div className="dr-purchase-options">
                        {/* Money Purchase Option */}
                        {moneyOption && (
                            <div className={`dr-purchase-option ${!moneyOption.available || !canAffordMoney || selectedQuantity > moneyPurchasesLeft ? 'dr-disabled' : ''}`}>
                                <div className="dr-option-header">
                                    <span className="dr-option-icon">💰</span>
                                    <h3 className="dr-option-title">Osta rahaga</h3>
                                </div>

                                <div className="dr-option-details">
                                    <div className="dr-option-price">
                                        <span className="dr-price-amount">{formatMoney(moneyTotalCost)}</span>
                                        <span className="dr-price-unit">
                                            {selectedQuantity} katse kohta ({formatMoney(moneyOption.cost)}/katse)
                                        </span>
                                    </div>

                                    <div className="dr-option-limit">
                                        <span className="dr-limit-text">
                                            Järelejäänud: {moneyPurchasesLeft}/{FUEL_CONSTANTS.MAX_PAID_ATTEMPTS}
                                        </span>
                                    </div>

                                    {selectedQuantity > moneyPurchasesLeft && (
                                        <div className="dr-option-warning">
                                            Saad osta ainult {moneyPurchasesLeft} katset rahaga
                                        </div>
                                    )}

                                    {!canAffordMoney && selectedQuantity <= moneyPurchasesLeft && (
                                        <div className="dr-option-unavailable">
                                            Pole piisavalt raha (vajad {formatMoney(moneyTotalCost)})
                                        </div>
                                    )}
                                </div>

                                <button
                                    className={`dr-purchase-button ${!moneyOption.available || !canAffordMoney || selectedQuantity > moneyPurchasesLeft ? 'dr-disabled' : ''}`}
                                    onClick={() => onPurchase('money', Math.min(selectedQuantity, moneyPurchasesLeft))}
                                    disabled={!moneyOption.available || !canAffordMoney || selectedQuantity > moneyPurchasesLeft}
                                >
                                    Osta {Math.min(selectedQuantity, moneyPurchasesLeft)} katset ({formatMoney(moneyOption.cost * Math.min(selectedQuantity, moneyPurchasesLeft))})
                                </button>
                            </div>
                        )}

                        {/* Pollid Purchase Option */}
                        {pollidOption && (
                            <div className={`dr-purchase-option ${!pollidOption.available || !canAffordPollid ? 'dr-disabled' : ''}`}>
                                <div className="dr-option-header">
                                    <span className="dr-option-icon">🔹</span>
                                    <h3 className="dr-option-title">Osta pollidega</h3>
                                </div>

                                <div className="dr-option-details">
                                    <div className="dr-option-price">
                                        <span className="dr-price-amount">{pollidTotalCost}</span>
                                        <span className="dr-price-unit">
                                            {selectedQuantity} katse kohta ({pollidOption.cost} pollid/katse)
                                        </span>
                                    </div>

                                    <div className="dr-option-note">
                                        <span className="dr-note-text">
                                            Saadaval alles pärast rahaga ostmise limiidi täitmist
                                        </span>
                                    </div>

                                    {!canAffordPollid && pollidOption.available && (
                                        <div className="dr-option-unavailable">
                                            Pole piisavalt pollid (vajad {pollidTotalCost})
                                        </div>
                                    )}

                                    {!pollidOption.available && (
                                        <div className="dr-option-unavailable">
                                            Kasuta esmalt rahaga ostmine ära
                                        </div>
                                    )}
                                </div>

                                <button
                                    className={`dr-purchase-button ${!pollidOption.available || !canAffordPollid ? 'dr-disabled' : ''}`}
                                    onClick={() => onPurchase('pollid', selectedQuantity)}
                                    disabled={!pollidOption.available || !canAffordPollid}
                                >
                                    Osta {selectedQuantity} katset ({pollidTotalCost} pollid)
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="dr-fuel-reset-info">
                        <span className="dr-reset-icon">🔄</span>
                        <span className="dr-reset-text">
                            Tasuta kütus täieneb iga tunni alguses (5 katset)
                        </span>
                    </div>
                </div>

                <div className="dr-modal-footer">
                    <button
                        className="dr-modal-button dr-secondary"
                        onClick={onClose}
                    >
                        Sulge
                    </button>
                </div>
            </div>
        </div>
    );
};