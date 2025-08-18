// src/data/shop/trainingBoosters.ts - NEW FILE
import { ShopItem } from '../../types/shop';

export const TRAINING_BOOSTER_ITEMS: ShopItem[] = [
    {
        id: 'energy_drink',
        name: 'Energiajook',
        description: 'Taastab 1 treeningklõpsu',
        category: 'trainingBooster',
        price: 3.50,
        consumableEffect: {
            type: 'trainingClicks',
            value: 1
        }
    },
    {
        id: 'energy_shot',
        name: 'Energiasüst',
        description: 'Taastab 2 treeningklõpsu',
        category: 'trainingBooster',
        price: 8.50,
        consumableEffect: {
            type: 'trainingClicks',
            value: 2
        }
    }
];