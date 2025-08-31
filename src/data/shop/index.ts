// src/data/shop/index.ts
import { ShopItem } from '../../types/shop';
import { PROTECTION_ITEMS } from './equipment';
import { TRAINING_BOOSTER_ITEMS } from './trainingBoosters';
import { MEDICAL_ITEMS } from './medicalItems';
import {VIP_ITEMS} from "./vipItems";
import { CRAFTING_INGREDIENTS } from './craftingIngredients';
import {WORKSHOP_DEVICES} from "./workshopDevices";

// Combine all shop items
export const ALL_SHOP_ITEMS: ShopItem[] = [
    ...PROTECTION_ITEMS,
    ...TRAINING_BOOSTER_ITEMS,
    ...MEDICAL_ITEMS,
    ...VIP_ITEMS,
    ...CRAFTING_INGREDIENTS,
    ...WORKSHOP_DEVICES
];

// Get items by category
export const getItemsByCategory = (category: string): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item => item.category === category);
};

// Get affordable items for player (money)
export const getAffordableItems = (playerMoney: number): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item =>
        item.currency === 'money' && item.price <= playerMoney
    );
};

// Get affordable VIP items for player (pollid)
export const getAffordableVipItems = (playerPollid: number): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item =>
        item.currency === 'pollid' && (item.pollidPrice || 0) <= playerPollid
    );
};

// Get VIP items only
export const getVipItems = (): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item => item.category === 'vip');
};