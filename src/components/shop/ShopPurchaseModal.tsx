// src/components/shop/ShopPurchaseModal.tsx
import React, { useState, useEffect } from 'react';
import { ShopItem } from '../../types/shop';
import '../../styles/components/shop/ShopPurchaseModal.css';

interface ShopPurchaseModalProps {
    item: ShopItem | null;
    isOpen: boolean;
    playerMoney: number;
    playerPollid?: number; // Add pollid support
    currentStock: number;
    onConfirm: (quantity: number) => void;
    onCancel: () => void;
}

export const ShopPurchaseModal: React.FC<ShopPurchaseModalProps> = ({
                                                                        item,
                                                                        isOpen,
                                                                        playerMoney,
                                                                        playerPollid = 0, // Default to 0
                                                                        currentStock,
                                                                        onConfirm,
                                                                        onCancel
                                                                    }) => {
    const [quantity, setQuantity] = useState(1);

    // Reset quantity when modal opens with new item
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
        }
    }, [isOpen, item]);

    if (!isOpen || !item) return null;

    // Determine which currency is being used
    const isPollidPurchase = item.currency === 'pollid';
    const unitPrice = isPollidPurchase ? (item.pollidPrice || 0) : item.price;
    const totalPrice = unitPrice * quantity;
    const playerBalance = isPollidPurchase ? playerPollid : playerMoney;
    const canAfford = playerBalance >= totalPrice;
    const maxAffordable = Math.floor(playerBalance / unitPrice);
    const maxPurchasable = Math.min(maxAffordable, currentStock);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= maxPurchasable) {
            setQuantity(newQuantity);
        }
    };

    const handleConfirm = () => {
        onConfirm(quantity);
    };

    // Format currency display
    const formatCurrency = (amount: number) => {
        if (isPollidPurchase) {
            return `💎 ${amount}`;
        } else {
            return `€${amount.toFixed(2)}`;
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className={`purchase-modal ${isPollidPurchase ? 'vip-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">
                    {isPollidPurchase ? '💎 VIP Ost' : 'Kinnita ost'}
                </h2>

                <div className="modal-item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>

                    {/* Show stats for equipment */}
                    {item.stats && (
                        <div className="item-stats">
                            {item.stats.strength && <span className="stat">+{item.stats.strength} Jõud</span>}
                            {item.stats.agility && <span className="stat">+{item.stats.agility} Kiirus</span>}
                            {item.stats.dexterity && <span className="stat">+{item.stats.dexterity} Osavus</span>}
                            {item.stats.intelligence && <span className="stat">+{item.stats.intelligence} Intel</span>}
                            {item.stats.endurance && <span className="stat">+{item.stats.endurance} Vastup</span>}
                        </div>
                    )}

                    {/* Show consumable effects */}
                    {item.consumableEffect && (
                        <div className="item-effects">
                            <div className="effect-badge">
                                {item.consumableEffect.type === 'workTimeReduction' && (
                                    <span className="vip-effect">-{item.consumableEffect.value}% tööaeg</span>
                                )}
                                {item.consumableEffect.type === 'trainingClicks' && (
                                    <span className="effect">+{item.consumableEffect.value} klõpsu</span>
                                )}
                                {item.consumableEffect.type === 'heal' && (
                                    <span className="effect">
                                        +{item.consumableEffect.value === 9999 ? 'Täielik' : item.consumableEffect.value} HP
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quantity Selector */}
                <div className="quantity-selector">
                    <label className="quantity-label">Kogus:</label>
                    <div className="quantity-controls">
                        <button
                            className="quantity-btn decrease"
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                        >
                            −
                        </button>
                        <input
                            type="number"
                            className="quantity-input"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                            min="1"
                            max={maxPurchasable}
                        />
                        <button
                            className="quantity-btn increase"
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={quantity >= maxPurchasable}
                        >
                            +
                        </button>
                    </div>
                    <span className="quantity-info">
                        Max: {maxPurchasable} (Laos: {currentStock})
                    </span>
                </div>

                <div className="modal-price-info">
                    <div className="price-row">
                        <span>Ühiku hind:</span>
                        <span className={`price ${isPollidPurchase ? 'pollid-price' : 'money-price'}`}>
                            {formatCurrency(unitPrice)}
                        </span>
                    </div>
                    {quantity > 1 && (
                        <div className="price-row">
                            <span>Kogus:</span>
                            <span>{quantity} tk</span>
                        </div>
                    )}
                    <div className="price-row total">
                        <span>Kokku:</span>
                        <span className={`price ${isPollidPurchase ? 'pollid-price' : 'money-price'}`}>
                            {formatCurrency(totalPrice)}
                        </span>
                    </div>
                    <div className="price-row">
                        <span>{isPollidPurchase ? 'Sinu Pollid:' : 'Sinu raha:'}</span>
                        <span className={`${canAfford ? 'balance' : 'balance insufficient'} ${isPollidPurchase ? 'pollid-balance' : ''}`}>
                            {formatCurrency(playerBalance)}
                        </span>
                    </div>
                    <div className="price-row">
                        <span>Peale ostu:</span>
                        <span className={`${canAfford ? 'remaining' : 'remaining insufficient'} ${isPollidPurchase ? 'pollid-balance' : ''}`}>
                            {formatCurrency(playerBalance - totalPrice)}
                        </span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="cancel-button" onClick={onCancel}>
                        Tühista
                    </button>
                    <button
                        className={`confirm-button ${isPollidPurchase ? 'vip-confirm' : ''}`}
                        onClick={handleConfirm}
                        disabled={!canAfford || quantity < 1 || quantity > maxPurchasable}
                    >
                        {!canAfford
                            ? (isPollidPurchase ? 'Ebapiisav Pollide' : 'Ebapiisav raha')
                            : `Osta ${quantity > 1 ? quantity + ' tk' : ''}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};