// src/components/training/CraftingInventory.tsx
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';
import { getBaseIdFromInventoryId } from '../../utils/inventoryUtils';
import '../../styles/components/training/CraftingInventory.css';
import { ALL_SHOP_ITEMS } from "../../data/shop";

interface CraftingInventoryProps {
    inventory: InventoryItem[];
    onSellItem?: (itemId: string, quantity: number) => Promise<void>;
}

export const CraftingInventory: React.FC<CraftingInventoryProps> = ({ inventory, onSellItem }) => {
    const [sellQuantities, setSellQuantities] = useState<{ [key: string]: number }>({});
    const [sellQuantityInputs, setSellQuantityInputs] = useState<{ [key: string]: string }>({});
    const [sellQuantityErrors, setSellQuantityErrors] = useState<{ [key: string]: string | null }>({});
    const [sellLoading, setSellLoading] = useState<{ [key: string]: boolean }>({});

    // Get item details from CRAFTING_INGREDIENTS
    const getItemDetails = (item: InventoryItem) => {
        const baseId = getBaseIdFromInventoryId(item.id);
        let details = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);
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

    // Initialize quantity inputs when inventory changes
    useEffect(() => {
        const updates: { [key: string]: string } = {};
        const quantityUpdates: { [key: string]: number } = {};

        inventory.forEach(item => {
            if (canSellItem(item) && !(item.id in sellQuantityInputs)) {
                updates[item.id] = '1';
                quantityUpdates[item.id] = 1;
            }
        });

        if (Object.keys(updates).length > 0) {
            setSellQuantityInputs(prev => ({...prev, ...updates}));
            setSellQuantities(prev => ({...prev, ...quantityUpdates}));
        }
    }, [inventory, sellQuantityInputs]);

    const handleQuantityChange = (itemId: string, newQuantity: number, maxQuantity: number) => {
        if (newQuantity >= 1) {
            setSellQuantities(prev => ({...prev, [itemId]: newQuantity}));
            setSellQuantityInputs(prev => ({...prev, [itemId]: newQuantity.toString()}));

            // Check for errors
            if (newQuantity > maxQuantity) {
                setSellQuantityErrors(prev => ({
                    ...prev,
                    [itemId]: `Sul on ainult ${maxQuantity} tükki`
                }));
            } else {
                setSellQuantityErrors(prev => ({...prev, [itemId]: null}));
            }
        }
    };

    const handleInputChange = (itemId: string, value: string, maxQuantity: number) => {
        setSellQuantityInputs(prev => ({...prev, [itemId]: value}));

        if (value === '') {
            setSellQuantityErrors(prev => ({...prev, [itemId]: 'Sisesta kogus'}));
            return;
        }

        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
            handleQuantityChange(itemId, numValue, maxQuantity);
        } else if (numValue < 1) {
            setSellQuantityErrors(prev => ({...prev, [itemId]: 'Kogus peab olema vähemalt 1'}));
        } else {
            setSellQuantityErrors(prev => ({...prev, [itemId]: 'Sisesta kehtiv number'}));
        }
    };

    const handleSellItem = async (item: any) => {
        if (!onSellItem || !canSellItem(item)) return;

        const quantity = sellQuantities[item.id] || 1;
        const error = sellQuantityErrors[item.id];

        if (error) return; // Don't sell if there's an error

        setSellLoading(prev => ({...prev, [item.id]: true}));

        try {
            await onSellItem(item.id, quantity);
            // Reset to 1 after successful sale
            setSellQuantities(prev => ({...prev, [item.id]: 1}));
            setSellQuantityInputs(prev => ({...prev, [item.id]: '1'}));
            setSellQuantityErrors(prev => ({...prev, [item.id]: null}));
        } catch (error) {
            console.error('Müük ebaõnnestus:', error);
        } finally {
            setSellLoading(prev => ({...prev, [item.id]: false}));
        }
    };

    // Filter only crafting category items and sort alphabetically
    const craftingItems = inventory
        .filter(item => {
            if (item.equipped) return false;
            const baseId = getBaseIdFromInventoryId(item.id);
            const inCraftingIngredients = CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === baseId);
            if (inCraftingIngredients) return true;
            const inShopItems = ALL_SHOP_ITEMS.find(shopItem =>
                shopItem.id === baseId && shopItem.maxStock === 0
            );
            if (inShopItems) return true;
            return false;
        })
        .map(item => {
            const baseId = getBaseIdFromInventoryId(item.id);
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
                    {craftingItems.map(item => {
                        const currentInput = sellQuantityInputs[item.id] || '';
                        const currentError = sellQuantityErrors[item.id];
                        const canSell = canSellItem(item) && !currentError;

                        return (
                            <tr key={item.id}>
                                <td className="item-name">
                                    {item.displayName}
                                </td>
                                <td className="item-quantity">
                                    <span className="quantity-value">{item.quantity || 'X'}</span>
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
                                                value={currentInput}
                                                onChange={(e) => handleInputChange(item.id, e.target.value, item.quantity)}
                                                className="quantity-input"
                                                disabled={sellLoading[item.id]}
                                                placeholder="Kogus"
                                            />
                                            <button
                                                onClick={() => handleSellItem(item)}
                                                disabled={sellLoading[item.id] || !onSellItem || !canSell}
                                                className="sell-button"
                                            >
                                                {sellLoading[item.id] ? '...' : 'Müü'}
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="not-sellable">Ei müüda</span>
                                    )}
                                    {currentError && (
                                        <div className="sell-error">
                                            {currentError}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};