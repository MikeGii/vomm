import { CarModel } from '../../../types/vehicles';

export const FORD_MODELS: CarModel[] = [
    {
        id: 'ford-escort-xr3',
        brand: 'Ford',
        model: 'Escort XR3',
        mass: 950, // õige, jääb samaks
        compatibleEngines: ['CVH-1.6'],
        defaultEngine: 'CVH-1.6',
        basePrice: 9000
    },
    {
        id: 'ford-escort-xr3i',
        brand: 'Ford',
        model: 'Escort XR3i',
        mass: 1005, // oli 980, +25kg
        compatibleEngines: ['CVH-1.8'],
        defaultEngine: 'CVH-1.8',
        basePrice: 12000
    },
    {
        id: 'ford-sierra-20',
        brand: 'Ford',
        model: 'Sierra 2.0',
        mass: 1210, // oli 1190, +20kg
        compatibleEngines: ['DOHC-2.0'],
        defaultEngine: 'DOHC-2.0',
        basePrice: 11000
    },
    {
        id: 'ford-sierra-28',
        brand: 'Ford',
        model: 'Sierra 2.8',
        mass: 1300, // oli 1280, +20kg
        compatibleEngines: ['V6-2.8'],
        defaultEngine: 'V6-2.8',
        basePrice: 14000
    },
    {
        id: 'ford-sierra-cosworth',
        brand: 'Ford',
        model: 'Sierra Cosworth',
        mass: 1305, // oli 1320, tegelikult natuke kergem
        compatibleEngines: ['YB'],
        defaultEngine: 'YB',
        basePrice: 44000
    }
];

export const FORD_ENGINES = {
    'YB': { code: 'YB', brand: 'Ford', basePower: 150 },
    'CVH-1.6': { code: 'CVH-1.6', brand: 'Ford', basePower: 66 },
    'CVH-1.8': { code: 'CVH-1.8', brand: 'Ford', basePower: 96 },
    'DOHC-2.0': { code: 'DOHC-2.0', brand: 'Ford', basePower: 110 },
    'V6-2.8': { code: 'V6-2.8', brand: 'Ford', basePower: 118 },
};