// src/types/shop.ts
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    category: ShopCategory;
    price: number;
    icon?: string;
    imageUrl?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    stock?: number; // undefined = unlimited, number = limited stock
    discount?: number; // percentage discount (0-100)
    isNew?: boolean;
    isFeatured?: boolean;
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
    | 'uniforms'      // Vormiriietus
    | 'protection'    // Kaitsevahendid
    | 'weapons'       // Relvad
    | 'equipment'     // Varustus
    | 'consumables'   // Tarbevahendid
    | 'documents';    // Dokumendid

export interface ConsumableEffect {
    type: 'heal' | 'energy' | 'experience' | 'temporary_boost';
    value: number;
    duration?: number; // in minutes, for temporary effects
    attribute?: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance';
}

export interface ShopPurchase {
    itemId: string;
    quantity: number;
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
    icon?: string;
}

export type ShopSortOption =
    | 'price_asc'
    | 'price_desc'
    | 'name_asc'
    | 'name_desc'
    | 'level_asc'
    | 'level_desc'
    | 'rarity';

export interface ShopFilterOptions {
    minPrice?: number;
    maxPrice?: number;
    rarity?: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>;
    levelRange?: {
        min: number;
        max: number;
    };
    onlyAffordable?: boolean; // Show only items player can afford
}

// Shop category metadata for UI
export const SHOP_CATEGORIES: Record<ShopCategory, ShopCategoryInfo> = {
    uniforms: {
        id: 'uniforms',
        name: 'Vormiriietus',
        description: 'Ametlikud vormiriided ja mundrid',
    },
    protection: {
        id: 'protection',
        name: 'Kaitsevahendid',
        description: 'Vestid, kiivrid ja muud kaitsevarustus',
    },
    weapons: {
        id: 'weapons',
        name: 'Relvad',
        description: 'Tulirelvad ja lähivõitlusvahendid',
    },
    equipment: {
        id: 'equipment',
        name: 'Varustus',
        description: 'Töövahendid ja lisavarustus',
    },
    consumables: {
        id: 'consumables',
        name: 'Tarbevahendid',
        description: 'Ühekordselt kasutatavad esemed',
    },
    documents: {
        id: 'documents',
        name: 'Dokumendid',
        description: 'Litsentsid, load ja õppematerjalid',
    }
};