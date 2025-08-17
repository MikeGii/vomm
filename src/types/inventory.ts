// src/types/inventory.ts
import { IconType } from 'react-icons';


export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    category: 'weapon' | 'equipment' | 'consumable' | 'document' | 'valuable' | 'misc';
    quantity: number;
    icon?: IconType;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    shopPrice: number;
    marketPrice?: number;
    equipped?: boolean;
    equipmentSlot?: 'head' | 'upperBody' | 'lowerBody' | 'hands' | 'belt' | 'weaponHolster' | 'shoes';
    source?: 'shop' | 'quest' | 'achievement' | 'training' | 'event';
    obtainedAt?: Date;
    // ADD equipment stats for equipment items (5 stats only)
    stats?: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
    };
}