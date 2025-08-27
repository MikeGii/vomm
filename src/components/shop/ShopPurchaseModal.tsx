// src/components/shop/ShopPurchaseModal.tsx
import React, { useState, useEffect } from 'react';
import { ShopItem } from '../../types/shop';
import '../../styles/components/shop/ShopPurchaseModal.css';

interface ShopPurchaseModalProps {
    item: ShopItem | null;
    isOpen: boolean;
    playerMoney: number;
    playerPollid?: number;
    currentStock: number;
    onConfirm: (quantity: number) => void;
    onCancel: () => void;
}

export const ShopPurchaseModal: React.FC<ShopPurchaseModalProps> = ({
                                                                        item,
                                                                        isOpen,
                                                                        playerMoney,
                                                                        playerPollid = 0,
                                                                        currentStock,
                                                                        onConfirm,
                                                                        onCancel
                                                                    }) => {
    const [quantity, setQuantity] = useState(1);
    const [quantityInput, setQuantityInput] = useState('1');
    const [quantityError, setQuantityError] = useState<string | null>(null);

    // Reset quantity when modal opens with new item
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setQuantityInput('1');
            setQuantityError(null);
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

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
            setQuantityInput(newQuantity.toString());

            // Check for errors and provide feedback
            if (newQuantity > currentStock) {
                setQuantityError(`Laos on ainult ${currentStock} tükki`);
            } else if (newQuantity > maxAffordable) {
                const currencyName = isPollidPurchase ? 'pollide' : 'raha';
                setQuantityError(`Sul pole piisavalt ${currencyName}. Saad osta maksimaalselt ${maxAffordable} tükki`);
            } else {
                setQuantityError(null);
            }
        }
    };

    const handleInputChange = (value: string) => {
        setQuantityInput(value);

        // Allow empty input temporarily
        if (value === '') {
            setQuantityError('Sisesta kogus');
            return;
        }

        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
            handleQuantityChange(numValue);
        } else if (numValue < 1) {
            setQuantityError('Kogus peab olema vähemalt 1');
        } else {
            setQuantityError('Sisesta kehtiv number');
        }
    };

    const handleConfirm = () => {
        if (!quantityError && quantity >= 1) {
            onConfirm(quantity);
        }
    };

    // Format currency display
    const formatCurrency = (amount: number) => {
        if (isPollidPurchase) {
            return `💎 ${amount}`;
        } else {
            return `€${amount.toFixed(2)}`;
        }
    };

    // Determine if purchase is possible
    const canPurchase = !quantityError && quantity >= 1;

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
                                {item.consumableEffect.type === 'kitchenClicks' && (
                                    <span className="effect">+{item.consumableEffect.value} köök/labor klõpsu</span>
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
                            value={quantityInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            min="1"
                            placeholder="1"
                        />
                        <button
                            className="quantity-btn increase"
                            onClick={() => handleQuantityChange(quantity + 1)}
                        >
                            +
                        </button>
                    </div>

                    {quantityError ? (
                        <div className="quantity-error">
                            {quantityError}
                        </div>
                    ) : (
                        <span className="quantity-info">
                            Laos: {currentStock} tükki
                        </span>
                    )}
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
                        disabled={!canPurchase}
                    >
                        {quantityError
                            ? 'Paranda kogus'
                            : !canAfford
                                ? (isPollidPurchase ? 'Ebapiisavalt Pollide' : 'Ebapiisavalt raha')
                                : `Osta ${quantity > 1 ? quantity + ' tk' : ''}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};