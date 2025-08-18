// src/data/shop/uniforms.ts
import { ShopItem } from '../../types/shop';

export const UNIFORMS_ITEMS: ShopItem[] = [
    {
        id: 'patrol_cap',
        name: 'Patrullpolitseiniku müts',
        description: 'Standardne patrullteenistuse müts',
        category: 'uniforms',
        price: 250,
        rarity: 'common',
        equipmentSlot: 'head',
        stats: {
            intelligence: 1,
            endurance: 1
        }
    },
    {
        id: 'patrol_jacket',
        name: 'Patrullpolitseiniku jakk',
        description: 'Vastupidav teenistusjakk igapäevaseks patrullimiseks',
        category: 'uniforms',
        price: 450,
        rarity: 'common',
        equipmentSlot: 'upperBody',
        stats: {
            endurance: 2,
            strength: 1
        }
    }
];