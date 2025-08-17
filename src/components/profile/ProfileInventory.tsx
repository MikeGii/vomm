// src/components/profile/ProfileInventory.tsx
import React from 'react';
import { InventoryItem } from '../../types/inventory';
import '../../styles/components/profile/ProfileInventory.css';

interface ProfileInventoryProps {
    items: InventoryItem[];
}

export const ProfileInventory: React.FC<ProfileInventoryProps> = ({ items }) => {
    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, InventoryItem[]>);

    const getCategoryName = (category: string): string => {
        const names: { [key: string]: string } = {
            weapon: 'Relvad',
            equipment: 'Varustus',
            consumable: 'Tarbitavad',
            document: 'Dokumendid',
            valuable: 'Väärtesemed',
            misc: 'Muu'
        };
        return names[category] || category;
    };

    if (!items || items.length === 0) {
        return (
            <div className="profile-inventory">
                <h2 className="inventory-title">Inventaar</h2>
                <p className="no-items">Inventar on tühi. Koguge esemeid poe, ülesannete ja koolituste kaudu!</p>
            </div>
        );
    }

    return (
        <div className="profile-inventory">
            <h2 className="inventory-title">Inventaar</h2>
            <div className="inventory-categories">
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category} className="inventory-category">
                        <h3 className="category-title">{getCategoryName(category)}</h3>
                        <div className="items-grid">
                            {categoryItems.map(item => (
                                <div key={item.id} className="inventory-item">
                                    {item.icon && (
                                        <div className="item-icon">
                                            {React.createElement(item.icon as any, { size: 32 })}
                                        </div>
                                    )}
                                    <div className="item-info">
                                        <div className="item-name">{item.name}</div>
                                        {item.quantity > 1 && (
                                            <div className="item-quantity">x{item.quantity}</div>
                                        )}
                                        <div className="item-description">{item.description}</div>
                                        {item.rarity && (
                                            <div className={`item-rarity rarity-${item.rarity}`}>
                                                {getRarityName(item.rarity)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getRarityName = (rarity: string): string => {
    const names: { [key: string]: string } = {
        common: 'Tavaline',
        uncommon: 'Ebatavaline',
        rare: 'Haruldane',
        epic: 'Eepiline',
        legendary: 'Legendaarne'
    };
    return names[rarity] || rarity;
};