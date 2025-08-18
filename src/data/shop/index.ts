// src/data/shop/index.ts
import { ShopItem } from '../../types/shop';
import { PROTECTION_ITEMS } from './equipment';
import { TRAINING_BOOSTER_ITEMS } from './trainingBoosters';

// Combine all shop items
export const ALL_SHOP_ITEMS: ShopItem[] = [
    ...PROTECTION_ITEMS,
    ...TRAINING_BOOSTER_ITEMS
];

// Get items by category
export const getItemsByCategory = (category: string): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item => item.category === category);
};

// Get affordable items for player
export const getAffordableItems = (playerMoney: number): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item => item.price <= playerMoney);
};