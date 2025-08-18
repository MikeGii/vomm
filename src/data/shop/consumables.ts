// src/data/shop/consumables.ts
import { ShopItem } from '../../types/shop';

export const CONSUMABLES_ITEMS: ShopItem[] = [
    {
        id: 'energy_drink',
        name: 'Energiajook',
        description: 'Taastab 25 energiat',
        category: 'consumables',
        price: 50,
        rarity: 'common',
        consumableEffect: {
            type: 'energy',
            value: 25
        }
    },
    {
        id: 'first_aid_kit',
        name: 'Esmaabikomplekt',
        description: 'Taastab 50 tervist',
        category: 'consumables',
        price: 100,
        rarity: 'common',
        consumableEffect: {
            type: 'heal',
            value: 50
        }
    }
];