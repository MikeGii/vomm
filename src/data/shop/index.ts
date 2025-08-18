// src/data/shop/index.ts
import { ShopItem } from '../../types/shop';
import { UNIFORMS_ITEMS } from './uniforms';
import { PROTECTION_ITEMS } from './protection';
import { WEAPONS_ITEMS } from './weapons';
import { EQUIPMENT_ITEMS } from './equipment';
import { CONSUMABLES_ITEMS } from './consumables';
import { DOCUMENTS_ITEMS } from './documents';

// Combine all shop items
export const ALL_SHOP_ITEMS: ShopItem[] = [
    ...UNIFORMS_ITEMS,
    ...PROTECTION_ITEMS,
    ...WEAPONS_ITEMS,
    ...EQUIPMENT_ITEMS,
    ...CONSUMABLES_ITEMS,
    ...DOCUMENTS_ITEMS
];

// Get items by category
export const getItemsByCategory = (category: string): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item => item.category === category);
};

// Get affordable items for player
export const getAffordableItems = (playerMoney: number): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item => item.price <= playerMoney);
};