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
        price: 11, // (3+3+2) * 1.35 = 10.8 → 11
        currency: 'money',
        basePrice: 11,
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
        maxStock: 5000
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
        price: 9, // (2+2+3) * 1.35 = 9.45 → 9
        currency: 'money',
        basePrice: 9,
        maxStock: 0
    },
    {
        id: 'flour',
        name: 'Jahu',
        description: 'Nisujahu leiva ja küpsetiste valmistamiseks',
        category: 'crafting',
        price: 5,
        currency: 'money',
        basePrice: 5,
        maxStock: 5000
    },
    {
        id: 'bread',
        name: 'Leib',
        description: 'Värske leib',
        category: 'crafting',
        price: 10, // (5+2) * 1.35 = 9.45 → 10
        currency: 'money',
        basePrice: 10,
        maxStock: 0
    },
    {
        id: 'sandwich',
        name: 'Megaleib',
        description: 'Rammumehe võileib, mis koosneb värskest rukkileivast ja tummisest pudrust',
        category: 'crafting',
        price: 28, // (10+11) * 1.35 = 28.35 → 28
        currency: 'money',
        basePrice: 28,
        maxStock: 0
    },
    // Drinks
    {
        id: 'energy_drink',
        name: 'Energiajook',
        description: 'Värskendav energiajook tööpäeva jaoks',
        category: 'crafting',
        price: 16, // (9+3) * 1.35 = 16.2 → 16
        currency: 'money',
        basePrice: 16,
        maxStock: 0,
        consumableEffect: {
            type: 'trainingClicks',
            value: 1
        }
    },
    {
        id: 'power_smoothie',
        name: 'Jõujook',
        description: 'Võimas jõujook pikaks tööpäevaks',
        category: 'crafting',
        price: 36, // (16+11) * 1.35 = 36.45 → 36
        currency: 'money',
        basePrice: 36,
        maxStock: 0
    },
    // Chemistry ingredients (basic prices stay same)
    {
        id: 'alcohol',
        name: 'Alkohol',
        description: 'Tehniline piiritus toodete valmistamiseks',
        category: 'crafting',
        price: 8,
        currency: 'money',
        basePrice: 8,
        maxStock: 1200
    },
    {
        id: 'salt',
        name: 'Sool',
        description: 'Puhas naatriumkloriid keemiliste reaktsioonide jaoks',
        category: 'crafting',
        price: 5,
        currency: 'money',
        basePrice: 5,
        maxStock: 1200
    },
    {
        id: 'vinegar',
        name: 'Äädikas',
        description: 'Puhastusaine ja keemiline koostisosa',
        category: 'crafting',
        price: 6,
        currency: 'money',
        basePrice: 6,
        maxStock: 1200
    },
    {
        id: 'disinfectant',
        name: 'Desinfitseerimisvahend',
        description: 'Aine desinfitseerimiseks',
        category: 'crafting',
        price: 24, // (8+8+2) * 1.35 = 24.3 → 24
        currency: 'money',
        basePrice: 24,
        maxStock: 0
    },
    {
        id: 'cleaning_solution',
        name: 'Puhastusaine',
        description: 'Võimas puhastusaine',
        category: 'crafting',
        price: 26, // (6+6+5+2) * 1.35 = 25.65 → 26
        currency: 'money',
        basePrice: 26,
        maxStock: 0
    },
    {
        id: 'antiseptic_solution',
        name: 'Antiseptikum',
        description: 'Tugev antiseptiline lahus',
        category: 'crafting',
        price: 36, // (8+8+8+5+5+2) * 1.35 = 48.6 → simplified to (8*3+5*2+2)*1.35=36*1.35=29→36
        currency: 'money',
        basePrice: 36,
        maxStock: 0
    }
];