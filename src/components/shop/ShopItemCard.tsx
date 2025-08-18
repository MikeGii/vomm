// src/components/shop/ShopItemCard.tsx - Fixed version
import React from 'react';
import { ShopItem } from '../../types/shop';
import { calculateFinalPrice } from '../../services/ShopService';
import '../../styles/components/shop/ShopItemCard.css';

interface ShopItemCardProps {
    item: ShopItem;
    canAfford: boolean;
    onPurchase: (item: ShopItem) => void;
    onViewDetails: (item: ShopItem) => void;
}

export const ShopItemCard: React.FC<ShopItemCardProps> = ({
                                                              item,
                                                              canAfford,
                                                              onPurchase,
                                                              onViewDetails
                                                          }) => {
    const finalPrice = calculateFinalPrice(item);
    const hasDiscount = item.discount && item.discount > 0;

    const getRarityClass = (rarity?: string) => {
        return rarity ? `rarity-${rarity}` : 'rarity-common';
    };

    return (
        <div className={`shop-item-card ${!canAfford ? 'cannot-afford' : ''} ${getRarityClass(item.rarity)}`}>
            {item.isNew && <div className="item-badge new">UUS</div>}
            {hasDiscount && <div className="item-badge discount">-{item.discount}%</div>}

            <div className="item-header" onClick={() => onViewDetails(item)}>
                <h3 className="item-name">{item.name}</h3>
                {item.rarity && (
                    <div className={`item-rarity ${item.rarity}`}>
                        <span className="star-icon">★</span>
                        <span>{item.rarity}</span>
                    </div>
                )}
            </div>

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

            <div className="item-footer">
                <div className="item-price">
                    {hasDiscount && (
                        <span className="original-price">€{item.price}</span>
                    )}
                    <span className="final-price">€{finalPrice}</span>
                </div>

                <button
                    className="purchase-button"
                    onClick={() => onPurchase(item)}
                    disabled={!canAfford}
                >
                    <span className="cart-icon">🛒</span>
                    Osta
                </button>
            </div>
        </div>
    );
};