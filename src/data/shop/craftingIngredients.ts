// src/data/shop/craftingIngredients.ts
import { ShopItem } from '../../types/shop';

export const CRAFTING_INGREDIENTS: ShopItem[] = [
    // Cooking ingredients
    {
        id: 'oatmeal',
        name: 'Kaerahelbed',
        description: 'Tervislikud hommikusöögi helbed',
        category: 'crafting',
        price: 3,
        currency: 'money',
        basePrice: 3,
        maxStock: 2000
    },
    {
        id: 'porrige',
        name: 'Kaerahelbepuder',
        description: 'Tervislik kaerahelbepuder',
        category: 'crafting',
        price: 15,
        currency: 'money',
        basePrice: 15,
        maxStock: 0
    },
    {
        id: 'water',
        name: 'Vesi',
        description: 'Puhas joogivesi',
        category: 'crafting',
        price: 2,
        currency: 'money',
        basePrice: 2,
        maxStock: 2000
    },
    {
        id: 'syrup',
        name: 'Siirup',
        description: 'Magus siirup jookide valmistamiseks',
        category: 'crafting',
        price: 3,
        currency: 'money',
        basePrice: 3,
        maxStock: 1200
    },
    {
        id: 'juice',
        name: 'Mahl',
        description: 'Magus mahl valmistatud veest ja siirupist',
        category: 'crafting',
        price: 12,
        currency: 'money',
        basePrice: 12,
        maxStock: 0
    },
    // Chemistry ingredients
    {
        id: 'alcohol',
        name: 'Alkohol',
        description: 'Tehniline piiritus toodete valmistamiseks',
        category: 'crafting',
        price: 15,
        currency: 'money',
        basePrice: 15,
        maxStock: 1200
    },
    {
        id: 'disinfectant',
        name: 'Desinfitseerimisvahend',
        description: 'Aine desinfitseerimiseks',
        category: 'crafting',
        price: 24,
        currency: 'money',
        basePrice: 24,
        maxStock: 0
    }
];