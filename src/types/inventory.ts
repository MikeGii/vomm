// src/types/inventory.ts
import { IconType } from 'react-icons';


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
}