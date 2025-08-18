// src/components/shop/ShopPurchaseModal.tsx
import React, { useState, useEffect } from 'react';
import { ShopItem } from '../../types/shop';
import '../../styles/components/shop/ShopPurchaseModal.css';

interface ShopPurchaseModalProps {
    item: ShopItem | null;
    isOpen: boolean;
    playerMoney: number;
    currentStock: number;
    onConfirm: (quantity: number) => void;
    onCancel: () => void;
}

export const ShopPurchaseModal: React.FC<ShopPurchaseModalProps> = ({
                                                                        item,
                                                                        isOpen,
                                                                        playerMoney,
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

    const unitPrice = item.price;
    const totalPrice = unitPrice * quantity;
    const canAfford = playerMoney >= totalPrice;
    const maxAffordable = Math.floor(playerMoney / unitPrice);
    const maxPurchasable = Math.min(maxAffordable, currentStock);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= maxPurchasable) {
            setQuantity(newQuantity);
        }
    };

    const handleConfirm = () => {
        onConfirm(quantity);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Kinnita ost</h2>

                <div className="modal-item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>

                    {item.stats && (
                        <div className="item-stats">
                            {item.stats.strength && <span className="stat">+{item.stats.strength} Jõud</span>}
                            {item.stats.agility && <span className="stat">+{item.stats.agility} Kiirus</span>}
                            {item.stats.dexterity && <span className="stat">+{item.stats.dexterity} Osavus</span>}
                            {item.stats.intelligence && <span className="stat">+{item.stats.intelligence} Intel</span>}
                            {item.stats.endurance && <span className="stat">+{item.stats.endurance} Vastup</span>}
                        </div>
                    )}
                </div>

                {/* New Quantity Selector */}
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
                        <span className="price">€{unitPrice.toFixed(2)}</span>
                    </div>
                    {quantity > 1 && (
                        <div className="price-row">
                            <span>Kogus:</span>
                            <span>{quantity} tk</span>
                        </div>
                    )}
                    <div className="price-row total">
                        <span>Kokku:</span>
                        <span className="price">€{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="price-row">
                        <span>Sinu raha:</span>
                        <span className={canAfford ? 'balance' : 'balance insufficient'}>
                            €{playerMoney.toFixed(2)}
                        </span>
                    </div>
                    <div className="price-row">
                        <span>Peale ostu:</span>
                        <span className={canAfford ? 'remaining' : 'remaining insufficient'}>
                            €{(playerMoney - totalPrice).toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="cancel-button" onClick={onCancel}>
                        Tühista
                    </button>
                    <button
                        className="confirm-button"
                        onClick={handleConfirm}
                        disabled={!canAfford || quantity < 1 || quantity > maxPurchasable}
                    >
                        {!canAfford ? 'Ebapiisav raha' : `Osta ${quantity > 1 ? quantity + ' tk' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};