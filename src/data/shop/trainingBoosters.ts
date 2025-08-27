// src/data/shop/trainingBoosters.ts - NEW FILE
import { ShopItem } from '../../types/shop';

export const TRAINING_BOOSTER_ITEMS: ShopItem[] = [
    {
        id: 'protein_bar',
        name: 'Proteiinibatoon',
        description: 'Taastab 1 treeningklõpsu',
        category: 'trainingBooster',
        price: 50.00,
        currency: 'money',
        basePrice: 50.00,
        maxStock: 2000,
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
        price: 90.00,
        currency: 'money',
        basePrice: 90.00,
        maxStock: 1500,
        consumableEffect: {
            type: 'trainingClicks',
            value: 2
        }
    },
    {
        id: 'steroid_01',
        name: 'Lahja steroid - Stanozolol',
        description: 'Taastab 4 treeningklõpsu',
        category: 'trainingBooster',
        price: 170.00,
        currency: 'money',
        basePrice: 170.00,
        maxStock: 750,
        consumableEffect: {
            type: 'trainingClicks',
            value: 4
        }
    },
    {
        id: 'steroid_02',
        name: 'Kange steroid - Trenbolone',
        description: 'Taastab 10 treeningklõpsu',
        category: 'trainingBooster',
        price: 350.00,
        currency: 'money',
        basePrice: 350.00,
        maxStock: 500,
        consumableEffect: {
            type: 'trainingClicks',
            value: 10
        }
    }

];