// src/data/shop/equipment.ts
import { ShopItem } from '../../types/shop';

export const PROTECTION_ITEMS: ShopItem[] = [
    {
        id: 'basic_vest',
        name: 'Kerge kuulivest',
        description: 'Põhiline ballistiline kaitse',
        category: 'protection',
        price: 800,
        basePrice: 800,
        maxStock: 10,
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
        basePrice: 650,
        maxStock: 10,
        equipmentSlot: 'head',
        stats: {
            endurance: 2,
            intelligence: -1,
            strength: 1
        }
    }
];