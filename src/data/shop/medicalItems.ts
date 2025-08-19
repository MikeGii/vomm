// src/data/shop/medicalItems.ts
import { ShopItem } from '../../types/shop';

export const MEDICAL_ITEMS: ShopItem[] = [
    {
        id: 'bandage',
        name: 'Side',
        description: 'Taastab 10 HP',
        category: 'medical',
        price: 25.00,
        currency: 'money',
        basePrice: 25.00,
        maxStock: 150,
        consumableEffect: {
            type: 'heal',
            value: 10
        }
    },
    {
        id: 'painkillers',
        name: 'Valuvaigistid',
        description: 'Taastab 15 HP',
        category: 'medical',
        price: 40.00,
        currency: 'money',
        basePrice: 40.00,
        maxStock: 100,
        consumableEffect: {
            type: 'heal',
            value:15
        }
    },
    {
        id: 'medical_kit',
        name: 'Esmaabikomplekt',
        description: 'Taastab 25 HP',
        category: 'medical',
        price: 250.00,
        currency: 'money',
        basePrice: 250.00,
        maxStock: 50,
        consumableEffect: {
            type: 'heal',
            value: 25
        }
    }
];