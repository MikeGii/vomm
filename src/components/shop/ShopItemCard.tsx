// src/components/shop/ShopItemCard.tsx - Fixed version
import React from 'react';
import { ShopItem } from '../../types/shop';
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

    return (
        <div className={`shop-item-card ${!canAfford ? 'cannot-afford' : ''}`}>
            <div className="item-header" onClick={() => onViewDetails(item)}>
                <h3 className="item-name">{item.name}</h3>
            </div>

            <p className="item-description">{item.description}</p>

            {item.stats && (
                <div className="item-stats">
                    {item.stats.strength && <span className="stat">+{item.stats.strength} Jõud</span>}
                    {item.stats.agility && <span className="stat">+{item.stats.agility} Kiirus</span>}
                    {item.stats.dexterity && <span className="stat">+{item.stats.dexterity} Osavus</span>}
                    {item.stats.intelligence && <span className="stat">+{item.stats.intelligence} Intelligentsus</span>}
                    {item.stats.endurance && <span className="stat">+{item.stats.endurance} Vastupidavus</span>}
                </div>
            )}

            <div className="item-footer">

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