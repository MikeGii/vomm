// src/components/shop/ShopPurchaseModal.tsx - UPDATED FOR HYBRID SYSTEM
import React, { useState, useEffect } from 'react';
import { ShopItem } from '../../types/shop';
import '../../styles/components/shop/ShopPurchaseModal.css';

interface ShopPurchaseModalProps {
    item: ShopItem | null;
    playerMoney: number;
    playerPollid?: number;
    currentStock: number;
    onConfirm: (quantity: number) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const ShopPurchaseModal: React.FC<ShopPurchaseModalProps> = ({
                                                                        item,
                                                                        playerMoney,
                                                                        playerPollid = 0,
                                                                        currentStock,
                                                                        onConfirm,
                                                                        onCancel,
                                                                        isLoading = false
                                                                    }) => {
    const [quantity, setQuantity] = useState(1);
    const [quantityInput, setQuantityInput] = useState('1');
    const [quantityError, setQuantityError] = useState<string | null>(null);

    // Reset quantity when modal opens with new item
    useEffect(() => {
        if (item) {
            setQuantity(1);
            setQuantityInput('1');
            setQuantityError(null);
        }
    }, [item]);

    if (!item) return null;

    // Check if item is player-craftable (limited stock)
    const isPlayerCraftableItem = item.maxStock === 0;
    const hasUnlimitedStock = !isPlayerCraftableItem;

    // Determine which currency is being used
    const isPollidPurchase = item.currency === 'pollid';
    const unitPrice = isPollidPurchase
        ? (item.basePollidPrice || item.pollidPrice || 0)
        : item.basePrice;
    const totalPrice = unitPrice * quantity;
    const playerBalance = isPollidPurchase ? playerPollid : playerMoney;
    const canAfford = playerBalance >= totalPrice;
    const maxAffordable = Math.floor(playerBalance / unitPrice);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
            setQuantityInput(newQuantity.toString());

            // Stock validation - only for player-craftable items
            if (isPlayerCraftableItem && newQuantity > currentStock) {
                setQuantityError(`Laos on ainult ${currentStock} tükki`);
                return;
            }

            // Balance validation
            if (newQuantity > maxAffordable) {
                const currencyName = isPollidPurchase ? 'pollide' : 'raha';
                setQuantityError(`Sul pole piisavalt ${currencyName}. Saad osta maksimaalselt ${maxAffordable} tükki`);
                return;
            }

            setQuantityError(null);
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
        if (!quantityError && quantity >= 1 && !isLoading) {
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

    // Determine max quantity for input validation
    const getMaxQuantity = () => {
        if (hasUnlimitedStock) {
            return maxAffordable; // Only limited by player's balance
        } else {
            return Math.min(currentStock, maxAffordable); // Limited by stock and balance
        }
    };

    // Determine if purchase is possible
    const canPurchase = !quantityError && quantity >= 1 && canAfford &&
        (hasUnlimitedStock || currentStock >= quantity);

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className={`purchase-modal ${isPollidPurchase ? 'vip-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">
                    {isPollidPurchase ? '💎 VIP Ost' : 'Ostu kinnitus'}
                </h2>

                {/* Item Info */}
                <div className="modal-item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>

                    {/* Item Stats */}
                    {item.stats && (
                        <div className="item-stats">
                            {item.stats.strength && <span className="stat">Jõud +{item.stats.strength}</span>}
                            {item.stats.agility && <span className="stat">Kiirus +{item.stats.agility}</span>}
                            {item.stats.dexterity && <span className="stat">Osavus +{item.stats.dexterity}</span>}
                            {item.stats.intelligence && <span className="stat">Intel +{item.stats.intelligence}</span>}
                            {item.stats.endurance && <span className="stat">Vastup +{item.stats.endurance}</span>}
                        </div>
                    )}

                    {/* Consumable Effects */}
                    {item.consumableEffect && (
                        <div className="item-effects">
                            <div className="effect-info">
                                {item.consumableEffect.type === 'trainingClicks' && (
                                    <span className="effect">+{item.consumableEffect.value} treening klick</span>
                                )}
                                {item.consumableEffect.type === 'kitchenClicks' && (
                                    <span className="effect">+{item.consumableEffect.value} köök klick</span>
                                )}
                                {item.consumableEffect.type === 'handicraftClicks' && (
                                    <span className="effect">+{item.consumableEffect.value} käsitöö klick</span>
                                )}
                                {item.consumableEffect.type === 'energy' && (
                                    <span className="effect">+{item.consumableEffect.value} energia</span>
                                )}
                                {item.consumableEffect.type === 'heal' && (
                                    <span className="effect">
                                        {item.consumableEffect.value === 100 ? 'Täielik' : item.consumableEffect.value} HP
                                    </span>
                                )}
                                {item.consumableEffect.type === 'workTimeReduction' && (
                                    <span className="vip-effect">-{item.consumableEffect.value}% tööaeg</span>
                                )}
                                {item.consumableEffect.type === 'courseTimeReduction' && (
                                    <span className="vip-effect">-{item.consumableEffect.value}% kursus</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stock type indicator */}
                    {isPlayerCraftableItem && (
                        <div className="stock-type-indicator">
                            ⚠ Mängijate poolt valmistatud - piiratud kogus
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
                            disabled={quantity <= 1 || isLoading}
                        >
                            −
                        </button>
                        <input
                            type="number"
                            className="quantity-input"
                            value={quantityInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            min="1"
                            max={getMaxQuantity()}
                            placeholder="1"
                            disabled={isLoading}
                        />
                        <button
                            className="quantity-btn increase"
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={isLoading}
                        >
                            +
                        </button>
                    </div>

                    {/* Stock Info */}
                    {quantityError ? (
                        <div className="quantity-error">
                            {quantityError}
                        </div>
                    ) : (
                        <div className="quantity-info">
                            {hasUnlimitedStock ? (
                                <span className="unlimited-stock">Alati saadaval</span>
                            ) : (
                                <span className="limited-stock">Laos: {currentStock} tükki</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Price Information */}
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
                        <span className={`${canAfford ? 'balance' : 'balance insufficient'} ${isPollidPurchase ? 'pollid-balance' : 'money-balance'}`}>
                            {formatCurrency(playerBalance)}
                        </span>
                    </div>
                    {canAfford && (
                        <div className="price-row">
                            <span>Jääb üle:</span>
                            <span className={`remaining ${isPollidPurchase ? 'pollid-balance' : 'money-balance'}`}>
                                {formatCurrency(playerBalance - totalPrice)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                    <button
                        className="cancel-button"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Tühista
                    </button>
                    <button
                        className={`confirm-button ${!canPurchase ? 'disabled' : ''}`}
                        onClick={handleConfirm}
                        disabled={!canPurchase || isLoading}
                    >
                        {isLoading ? 'Ostab...' : canPurchase ? 'Osta' : 'Ei saa osta'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShopPurchaseModal;