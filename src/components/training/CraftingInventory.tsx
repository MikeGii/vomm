// src/components/training/CraftingInventory.tsx
import React from 'react';
import { InventoryItem } from '../../types';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';
import '../../styles/components/training/CraftingInventory.css';

interface CraftingInventoryProps {
    inventory: InventoryItem[];
}

export const CraftingInventory: React.FC<CraftingInventoryProps> = ({ inventory }) => {
    // Get item details from CRAFTING_INGREDIENTS
    const getItemDetails = (itemId: string) => {
        return CRAFTING_INGREDIENTS.find(ingredient => ingredient.id === itemId);
    };

    // Filter only crafting category items and sort alphabetically
    const craftingItems = inventory
        .filter(item => {
            return CRAFTING_INGREDIENTS.some(ingredient => ingredient.id === item.id);
        })
        .map(item => ({
            ...item,
            details: getItemDetails(item.id)
        }))
        .sort((a, b) => {
            const nameA = a.details?.name || a.id;
            const nameB = b.details?.name || b.id;
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
                        <th>Hind</th>
                    </tr>
                    </thead>
                    <tbody>
                    {craftingItems.map(item => (
                        <tr key={item.id}>
                            <td className="item-name">
                                {item.details?.name || item.id}
                            </td>
                            <td className="item-quantity">
                                {item.quantity}
                            </td>
                            <td className="item-price">
                                €{item.details?.basePrice || 0}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};