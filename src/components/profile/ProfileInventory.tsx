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

    if (!items || items.length === 0) {
        return (
            <div className="profile-inventory-simple">
                <h2 className="inventory-title">Inventar</h2>
                <p className="no-items">Inventar on tühi. Koguge esemeid poe, ülesannete ja koolituste kaudu!</p>
            </div>
        );
    }

    return (
        <div className="profile-inventory-simple">
            <h2 className="inventory-title">Inventar</h2>
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="category-section">
                    <h3 className="category-header">{getCategoryName(category)}</h3>
                    <table className="inventory-table">
                        <thead>
                        <tr>
                            <th>Ese</th>
                            <th>Kirjeldus</th>
                            <th>Kogus</th>
                            <th>Haruldus</th>
                            <th>Staatus</th>
                        </tr>
                        </thead>
                        <tbody>
                        {categoryItems.map(item => (
                            <tr key={item.id} className="inventory-row">
                                <td className="item-name">{item.name}</td>
                                <td className="item-description">{item.description}</td>
                                <td className="item-quantity">{item.quantity}</td>
                                <td className="item-rarity">
                                    {item.rarity && (
                                        <span className={`rarity-badge rarity-${item.rarity}`}>
                                                {getRarityName(item.rarity)}
                                            </span>
                                    )}
                                </td>
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
            ))}
        </div>
    );
};