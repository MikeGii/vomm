// src/data/shop/weapons.ts
import { ShopItem } from '../../types/shop';

export const WEAPONS_ITEMS: ShopItem[] = [
    {
        id: 'baton',
        name: 'Teenistusnui',
        description: 'Standardne politsei teenistusnui',
        category: 'weapons',
        price: 200,
        rarity: 'common',
        equipmentSlot: 'weaponHolster',
        stats: {
            strength: 2
        }
    },
    {
        id: 'pepper_spray',
        name: 'Pipragaas',
        description: 'Mitteletaalne enesekaitsevahend',
        category: 'weapons',
        price: 150,
        rarity: 'common',
        stats: {
            dexterity: 1,
            intelligence: 1
        }
    }
];