// src/components/training/CraftingInventory.tsx
import React, {useState} from 'react';
import { InventoryItem } from '../../types';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';
import { getBaseIdFromInventoryId } from '../../utils/inventoryUtils';
import '../../styles/components/training/CraftingInventory.css';
import {ALL_SHOP_ITEMS} from "../../data/shop";

interface CraftingInventoryProps {
    inventory: InventoryItem[];
    onSellItem?: (itemId: string, quantity: number) => Promise<void>;
}

export const CraftingInventory: React.FC<CraftingInventoryProps> = ({ inventory, onSellItem }) => {

    const [sellQuantities, setSellQuantities] = useState<{ [key: string]: number }>({});
    const [sellLoading, setSellLoading] = useState<{ [key: string]: boolean }>({});

    // Get item details from CRAFTING_INGREDIENTS
    const getItemDetails = (item: InventoryItem) => {
        const baseId = getBaseIdFromInventoryId(item.id);

        // First check CRAFTING_INGREDIENTS
        let details = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);

        // If not found, check ALL_SHOP_ITEMS
        if (!details) {
            details = ALL_SHOP_ITEMS.find(shopItem => shopItem.id === baseId);
        }

        return details;
    };

    // Check if item can be sold (only produced items, not basic ingredients)
    const canSellItem = (item: InventoryItem) => {
        const details = getItemDetails(item);
        if (!details) return false;
        return details.maxStock === 0;
    };

    // Filter only crafting category items and sort alphabetically
    const craftingItems = inventory
        .filter(item => {
            // Hide equipped items (your requirement #1)
            if (item.equipped) return false;

            const baseId = getBaseIdFromInventoryId(item.id);

            // Show items from CRAFTING_INGREDIENTS (traditional crafting materials)
            const inCraftingIngredients = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);
            if (inCraftingIngredients) return true;

            // Show ONLY player-made equipment (maxStock = 0) from ALL_SHOP_ITEMS
            const inShopItems = ALL_SHOP_ITEMS.find(shopItem =>
                shopItem.id === baseId && shopItem.maxStock === 0
            );
            if (inShopItems) return true;

            return false;
        })
        .map(item => {
            const baseId = getBaseIdFromInventoryId(item.id);
            // Get details from either source
            let details = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);
            if (!details) {
                details = ALL_SHOP_ITEMS.find(shopItem => shopItem.id === baseId);
            }

            return {
                ...item,
                baseId: baseId,
                details: details,
                displayName: item.name || details?.name || baseId
            };
        })
        .sort((a, b) => {
            const nameA = a.displayName;
            const nameB = b.displayName;
            return nameA.localeCompare(nameB, 'et');
        });

    const handleQuantityChange = (itemId: string, quantity: number) => {
        setSellQuantities(prev => ({
            ...prev,
            [itemId]: quantity
        }));
    };

    const handleSellItem = async (item: any) => {
        if (!onSellItem || !canSellItem(item)) return;

        const quantity = sellQuantities[item.id] || 1;
        const maxQuantity = item.quantity;

        if (quantity > maxQuantity || quantity < 1) return;

        setSellLoading(prev => ({...prev, [item.id]: true}));

        try {
            await onSellItem(item.id, quantity);
            setSellQuantities(prev => ({...prev, [item.id]: 1}));
        } catch (error) {
            console.error('Müük ebaõnnestus:', error);
        } finally {
            setSellLoading(prev => ({...prev, [item.id]: false}));
        }
    };

    if (craftingItems.length === 0) {
        return (
            <div className="crafting-inventory">
                <h4>🎒 Sinu materjalid ja tooted</h4>
                <div className="empty-inventory">
                    <p>Sul pole veel ühtegi materjali või toodet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="crafting-inventory">
            <h4>🎒 Sinu materjalid ja tooted</h4>
            <div className="inventory-table-container">
                <table className="inventory-table">
                    <thead>
                    <tr>
                        <th>Toode</th>
                        <th>Kogus</th>
                        <th>Müügihind</th>
                        <th>Tegevused</th>
                    </tr>
                    </thead>
                    <tbody>
                    {craftingItems.map(item => (
                        <tr key={item.id}>
                            <td className="item-name">
                                {item.displayName}
                            </td>
                            <td className="item-quantity">
                                <span className="quantity-value">{item.quantity || 'X'}</span>  {/* Show X if no quantity */}
                            </td>
                            <td className="item-price">
                                {canSellItem(item) ? `€${item.details?.basePrice || 0}` : '-'}
                            </td>
                            <td className="item-actions">
                                {canSellItem(item) ? (
                                    <div className="sell-controls">
                                        <input
                                            type="number"
                                            min="1"
                                            max={item.quantity}
                                            value={sellQuantities[item.id] || 1}
                                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                            className="quantity-input"
                                            disabled={sellLoading[item.id]}
                                            aria-label="Kogus"
                                        />
                                        <button
                                            onClick={() => handleSellItem(item)}
                                            disabled={sellLoading[item.id] || !onSellItem}
                                            className="sell-button"
                                        >
                                            {sellLoading[item.id] ? '...' : 'Müü'}
                                        </button>
                                    </div>
                                ) : (
                                    <span className="not-sellable">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}