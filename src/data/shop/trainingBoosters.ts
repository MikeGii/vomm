// src/data/shop/trainingBoosters.ts - NEW FILE
import { ShopItem } from '../../types/shop';

export const TRAINING_BOOSTER_ITEMS: ShopItem[] = [
    {
        id: 'energy_drink',
        name: 'Energiajook',
        description: 'Taastab 1 treeningklõpsu',
        category: 'trainingBooster',
        price: 3.50,
        basePrice: 3.50,
        maxStock: 200,
        consumableEffect: {
            type: 'trainingClicks',
            value: 1
        }
    },
    {
        id: 'energy_shot',
        name: 'Energia shot',
        description: 'Taastab 2 treeningklõpsu',
        category: 'trainingBooster',
        price: 8.50,
        basePrice: 8.50,
        maxStock: 200,
        consumableEffect: {
            type: 'trainingClicks',
            value: 2
        }
    },
    {
        id: 'steroid_01',
        name: 'Lahja steroid',
        description: 'Taastab 4 treeningklõpsu',
        category: 'trainingBooster',
        price: 50.00,
        basePrice: 50.00,
        maxStock: 100,
        consumableEffect: {
            type: 'trainingClicks',
            value: 4
        }
    },
    {
        id: 'steroid_02',
        name: 'Kange steroid',
        description: 'Taastab 10 treeningklõpsu',
        category: 'trainingBooster',
        price: 450.00,
        basePrice: 450.00,
        maxStock: 50,
        consumableEffect: {
            type: 'trainingClicks',
            value: 10
        }
    }

];