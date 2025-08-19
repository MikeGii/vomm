// src/types/inventory.ts

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    category: 'equipment' | 'consumable' | 'misc';
    quantity: number;
    shopPrice: number;
    marketPrice?: number;
    equipped?: boolean;
    equipmentSlot?: 'head' | 'upperBody' | 'lowerBody' | 'hands' | 'belt' | 'weaponHolster' | 'shoes';
    source?: 'shop' | 'quest' | 'achievement' | 'training' | 'event';
    obtainedAt?: Date;
    stats?: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
    };
    consumableEffect?: {
        type: 'trainingClicks' | 'heal' | 'energy' | 'experience' | 'temporary_boost' | 'workTimeReduction';
        value: number;
        duration?: number;
    };
}