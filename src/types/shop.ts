// src/types/shop.ts - UPDATED VERSION
import {Timestamp} from "firebase/firestore";

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    category: ShopCategory;
    price: number;
    pollidPrice?: number;
    currency: 'money' | 'pollid' | 'both';
    basePrice: number;
    basePollidPrice?: number;
    maxStock: number;
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
    | 'medical'
    | 'vip'
    | 'crafting'

export interface ConsumableEffect {
    type: 'trainingClicks' | 'heal' | 'energy' | 'experience' | 'temporary_boost' | 'workTimeReduction' | 'courseTimeReduction';
    value: number;
    duration?: number;
}

export interface PurchaseResult {
    success: boolean;
    message: string;
    newBalance?: number;
    newPollidBalance?: number;
    failureReason?: 'insufficient_funds' | 'insufficient_pollid' | 'requirements_not_met' | 'out_of_stock' | 'inventory_full';
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
    },
    medical: {
        id: 'medical',
        name: 'Meditsiinitarbed',
        description: 'Sidemed, plaastrid ja muud meditsiinitarbed',
    },
    vip: {
        id: 'vip',
        name: 'VIP Pood',
        description: 'Eksklusiivesed, mida saab osta ainult Pollidega',
    },
    crafting: {
        id: 'crafting',
        name: 'Erinevate toodete valmistamise toorained',
        description: 'Koostisosad toidu, jookide ja keemia valmistamiseks',
    }
};

export interface ShopStock {
    itemId: string;
    currentStock: number;
    lastRestockTime: Date | Timestamp;
    stockSource?: 'auto' | 'player_sold';
    playerSoldStock?: number;
}