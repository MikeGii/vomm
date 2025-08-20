// src/components/profile/ProfileInventory.tsx - Updated with tabs
import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { TabNavigation } from '../ui/TabNavigation';
import '../../styles/components/profile/ProfileInventory.css';

interface ProfileInventoryProps {
    items: InventoryItem[];
}

export const ProfileInventory: React.FC<ProfileInventoryProps> = ({ items }) => {
    type DisplayGroup = 'equipment' | 'trainingBooster' | 'medical' | 'vip' | 'consumable' | 'misc' | 'crafting';

    const [activeTab, setActiveTab] = useState<DisplayGroup>('crafting');

    // Group items by display category
    const groupedItems = items.reduce((acc, item) => {
        let displayGroup: DisplayGroup = item.category;

        if (item.category === 'crafting') {
            displayGroup = 'crafting';
        } else if (item.category === 'consumable' && item.consumableEffect) {
            if (item.consumableEffect.type === 'trainingClicks') {
                displayGroup = 'trainingBooster' as DisplayGroup;
            } else if (item.consumableEffect.type === 'heal') {
                displayGroup = 'medical' as DisplayGroup;
            } else if (item.consumableEffect.type === 'workTimeReduction' ||
                item.consumableEffect.type === 'courseTimeReduction') {
                displayGroup = 'vip' as DisplayGroup;
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
            vip: 'VIP Tooted',
            consumable: 'Tarbetarbed',
            misc: 'Muu',
            crafting: 'Materjalid & Toidukaubad'
        };
        return names[category] || category;
    };

    // Create tabs only for categories that have items, prioritize crafting first
    const categoryOrder: DisplayGroup[] = ['crafting', 'equipment', 'vip', 'trainingBooster', 'medical', 'consumable', 'misc'];
    const availableCategories = categoryOrder.filter(category =>
        groupedItems[category] && groupedItems[category].length > 0
    );

    const tabs = availableCategories.map(category => ({
        id: category,
        label: getCategoryName(category)
    }));

    // Set first available category as default if current tab has no items
    React.useEffect(() => {
        if (availableCategories.length > 0 && !availableCategories.includes(activeTab)) {
            setActiveTab(availableCategories[0]);
        }
    }, [availableCategories, activeTab]);

    if (!items || items.length === 0) {
        return (
            <div className="profile-inventory-simple">
                <h2 className="inventory-title">Inventaar</h2>
                <p className="no-items">Inventar on tühi. Koguge esemeid poest!</p>
            </div>
        );
    }

    const currentCategoryItems = groupedItems[activeTab] || [];

    return (
        <div className="profile-inventory-simple">
            <h2 className="inventory-title">Inventaar</h2>

            <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as DisplayGroup)}
            />

            {currentCategoryItems.length > 0 ? (
                <div className={`category-section ${activeTab === 'vip' ? 'vip-category' : ''}`}>
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
                        {currentCategoryItems.map(item => (
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
            ) : (
                <div className="no-items">
                    <p>Selles kategoorias pole esemeid.</p>
                </div>
            )}
        </div>
    );
};