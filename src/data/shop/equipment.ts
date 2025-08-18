// src/data/shop/equipment.ts
import { ShopItem } from '../../types/shop';

export const EQUIPMENT_ITEMS: ShopItem[] = [
    {
        id: 'police_belt',
        name: 'Teenistusvöö',
        description: 'Multifunktsionaalne vöö varustuse kandmiseks',
        category: 'equipment',
        price: 300,
        rarity: 'common',
        equipmentSlot: 'belt',
        stats: {
            dexterity: 1,
            agility: 1
        }
    },
    {
        id: 'patrol_boots',
        name: 'Patrullsaapad',
        description: 'Mugavad ja vastupidavad teenistussaapad',
        category: 'equipment',
        price: 420,
        rarity: 'common',
        equipmentSlot: 'shoes',
        stats: {
            agility: 2,
            endurance: 1
        }
    }
];