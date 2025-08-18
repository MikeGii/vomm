// src/types/shop.ts
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    category: ShopCategory;
    price: number;
    stock?: number;
    stats?: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
    };
    equipmentSlot?: 'head' | 'upperBody' | 'lowerBody' | 'hands' | 'belt' | 'weaponHolster' | 'shoes';
    consumableEffect?: ConsumableEffect;
}

export type ShopCategory =
    | 'protection'
    | 'trainingBooster'

export interface ConsumableEffect {
    type: 'trainingClicks' | 'heal' | 'energy' | 'experience' | 'temporary_boost';
    value: number;
    duration?: number;
}

export interface PurchaseResult {
    success: boolean;
    message: string;
    newBalance?: number;
    failureReason?: 'insufficient_funds' | 'requirements_not_met' | 'out_of_stock' | 'inventory_full';
}

export interface ShopCategoryInfo {
    id: ShopCategory;
    name: string;
    description: string;
}

export const SHOP_CATEGORIES: Record<ShopCategory, ShopCategoryInfo> = {
    protection: {
        id: 'protection',
        name: 'Kaitsevahendid',
        description: 'Vestid, kiivrid ja muud kaitsevarustus',
    },
    trainingBooster: {
        id: 'trainingBooster',
        name: 'Sporditarbed',
        description: 'Energiajoogid ja treeningtarbed',
    }
};