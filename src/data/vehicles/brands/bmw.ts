import { CarModel } from '../../../types/vehicles';

export const BMW_MODELS: CarModel[] = [
    {
        id: 'bmw-e30-320i',
        brand: 'BMW',
        model: 'E30 320i',
        mass: 1220, // oli 1200, +20kg
        compatibleEngines: ['M20B20'],
        defaultEngine: 'M20B20',
        basePrice: 18000
    },
    {
        id: 'bmw-e30-325i',
        brand: 'BMW',
        model: 'E30 325i',
        mass: 1280, // oli 1250, +30kg
        compatibleEngines: ['M20B25'],
        defaultEngine: 'M20B25',
        basePrice: 30000
    },
    {
        id: 'bmw-e34-530i',
        brand: 'BMW',
        model: 'E34 530i',
        mass: 1575,
        compatibleEngines: ['M30B30'],
        defaultEngine: 'M30B30',
        basePrice: 22000
    },
    {
        id: 'bmw-e34-535i',
        brand: 'BMW',
        model: 'E34 535i',
        mass: 1605,
        compatibleEngines: ['M30B35'],
        defaultEngine: 'M30B35',
        basePrice: 28000
    },
    {
        id: 'bmw-e34-m5',
        brand: 'BMW',
        model: 'E34 M5',
        mass: 1695,
        compatibleEngines: ['S38B36'],
        defaultEngine: 'S38B36',
        basePrice: 70000
    },
    {
        id: 'bmw-e36-320i',
        brand: 'BMW',
        model: 'E36 320i',
        mass: 1385,
        compatibleEngines: ['M50B20'],
        defaultEngine: 'M50B20',
        basePrice: 20000
    },
    {
        id: 'bmw-e36-325i',
        brand: 'BMW',
        model: 'E36 325i',
        mass: 1420,
        compatibleEngines: ['M50B25'],
        defaultEngine: 'M50B25',
        basePrice: 26000
    }
];

export const BMW_ENGINES = {
    'M20B20': { code: 'M20B20', brand: 'BMW', basePower: 95 }, // 2.0 E30
    'M20B25': { code: 'M20B25', brand: 'BMW', basePower: 125 }, // 2.5 E30
    'M30B30': { code: 'M30B30', brand: 'BMW', basePower: 135 }, // 3.0 E34
    'M30B35': { code: 'M30B35', brand: 'BMW', basePower: 155 }, // 3.5 E34
    'M50B20': { code: 'M50B20', brand: 'BMW', basePower: 110 }, // 2.0 E36
    'M50B25': { code: 'M50B25', brand: 'BMW', basePower: 141 }, // 2.5 E36
    'S38B36': { code: 'S38B36', brand: 'BMW', basePower: 232 }, // M5 E34
};