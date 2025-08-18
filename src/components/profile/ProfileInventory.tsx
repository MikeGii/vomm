// src/components/profile/ProfileInventory.tsx
import React from 'react';
import { InventoryItem } from '../../types/inventory';
import '../../styles/components/profile/ProfileInventory.css';

interface ProfileInventoryProps {
    items: InventoryItem[];
}

export const ProfileInventory: React.FC<ProfileInventoryProps> = ({ items }) => {
    // Create display groups without modifying the actual category
    type DisplayGroup = 'equipment' | 'trainingBooster' | 'medical' | 'consumable' | 'misc';

    // Group items by display category
    const groupedItems = items.reduce((acc, item) => {
        let displayGroup: DisplayGroup = item.category;

        // Determine display group for consumables based on effect type
        if (item.category === 'consumable' && item.consumableEffect) {
            if (item.consumableEffect.type === 'trainingClicks') {
                displayGroup = 'trainingBooster' as DisplayGroup;
            } else if (item.consumableEffect.type === 'heal') {
                displayGroup = 'medical' as DisplayGroup;
            } else {
                displayGroup = 'consumable';
            }
        } else if (item.category === 'equipment') {
            displayGroup = 'equipment';
        } else if (item.category === 'misc') {
            displayGroup = 'misc';
        }

        if (!acc[displayGroup]) {
            acc[displayGroup] = [];
        }
        acc[displayGroup].push(item);
        return acc;
    }, {} as Record<DisplayGroup, InventoryItem[]>);

    const getCategoryName = (category: DisplayGroup): string => {
        const names: Record<DisplayGroup, string> = {
            equipment: 'Varustus',
            trainingBooster: 'Sporditarbed',
            medical: 'Meditsiinitarbed',
            consumable: 'Tarbetarbed',
            misc: 'Muu'
        };
        return names[category] || category;
    };

    // Define display order for categories
    const categoryOrder: DisplayGroup[] = ['equipment', 'trainingBooster', 'medical', 'consumable', 'misc'];
    const sortedCategories = Object.keys(groupedItems) as DisplayGroup[];
    sortedCategories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    if (!items || items.length === 0) {
        return (
            <div className="profile-inventory-simple">
                <h2 className="inventory-title">Inventar</h2>
                <p className="no-items">Inventar on tühi. Koguge esemeid poest!</p>
            </div>
        );
    }

    return (
        <div className="profile-inventory-simple">
            <h2 className="inventory-title">Inventar</h2>
            {sortedCategories.map((category) => {
                const categoryItems = groupedItems[category];
                if (!categoryItems || categoryItems.length === 0) return null;

                return (
                    <div key={category} className="category-section">
                        <h3 className="category-header">{getCategoryName(category)}</h3>
                        <table className="inventory-table">
                            <thead>
                            <tr>
                                <th>Ese</th>
                                <th>Kirjeldus</th>
                                <th>Kogus</th>
                                <th>Staatus</th>
                            </tr>
                            </thead>
                            <tbody>
                            {categoryItems.map(item => (
                                <tr key={item.id} className="inventory-row">
                                    <td className="item-name">{item.name}</td>
                                    <td className="item-description">{item.description}</td>
                                    <td className="item-quantity">{item.quantity}</td>
                                    <td className="item-status">
                                        {item.equipped ? (
                                            <span className="status-equipped">Varustatud</span>
                                        ) : (
                                            <span className="status-available">Saadaval</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
};