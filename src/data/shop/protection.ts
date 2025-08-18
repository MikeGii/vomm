// src/data/shop/protection.ts
import { ShopItem } from '../../types/shop';

export const PROTECTION_ITEMS: ShopItem[] = [
    {
        id: 'basic_vest',
        name: 'Kerge kuulivest',
        description: 'Põhiline ballistiline kaitse',
        category: 'protection',
        price: 800,
        rarity: 'common',
        equipmentSlot: 'upperBody',
        stats: {
            endurance: 3,
            agility: -1
        }
    },
    {
        id: 'tactical_helmet',
        name: 'Taktikaline kiiver',
        description: 'Kaitsekiiver erioperatsioonideks',
        category: 'protection',
        price: 650,
        rarity: 'uncommon',
        equipmentSlot: 'head',
        stats: {
            endurance: 2,
            intelligence: -1,
            strength: 1
        }
    }
];