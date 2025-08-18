// src/components/shop/ShopItemGrid.tsx - Fixed
import React from 'react';
import { ShopItem } from '../../types/shop';
import { ShopItemCard } from './ShopItemCard';
import '../../styles/components/shop/ShopItemGrid.css';

interface ShopItemGridProps {
    items: ShopItem[];
    playerMoney: number;
    onPurchase: (item: ShopItem) => void;
    onViewDetails: (item: ShopItem) => void;
}

export const ShopItemGrid: React.FC<ShopItemGridProps> = ({
                                                              items,
                                                              playerMoney,
                                                              onPurchase,
                                                              onViewDetails
                                                          }) => {
    if (items.length === 0) {
        return (
            <div className="shop-empty-state">
                <p>Selles kategoorias pole hetkel ühtegi eset saadaval</p>
            </div>
        );
    }

    return (
        <div className="shop-item-grid">
            {items.map(item => (
                <ShopItemCard
                    key={item.id}
                    item={item}
                    canAfford={playerMoney >= item.price}
                    onPurchase={onPurchase}
                    onViewDetails={onViewDetails}
                />
            ))}
        </div>
    );
};