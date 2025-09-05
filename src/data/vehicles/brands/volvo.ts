import { CarModel } from '../../../types/vehicles';

export const VOLVO_MODELS: CarModel[] = [
    {
        id: 'volvo-240',
        brand: 'Volvo',
        model: '240',
        mass: 1405, // oli 1380, +25kg
        compatibleEngines: ['B230F'],
        defaultEngine: 'B230F',
        basePrice: 8000
    },
    {
        id: 'volvo-240-turbo',
        brand: 'Volvo',
        model: '240 Turbo',
        mass: 1420, // oli 1400, +20kg
        compatibleEngines: ['B230FT'],
        defaultEngine: 'B230FT',
        basePrice: 14000
    },
    {
        id: 'volvo-850-t5',
        brand: 'Volvo',
        model: '850 T5',
        mass: 1475, // oli 1470, +5kg (oli päris täpne)
        compatibleEngines: ['B204FT'],
        defaultEngine: 'B204FT',
        basePrice: 24000
    },
    {
        id: 'volvo-940',
        brand: 'Volvo',
        model: '940',
        mass: 1510, // oli 1450, +60kg
        compatibleEngines: ['B234F', 'B230FT'],
        defaultEngine: 'B234F',
        basePrice: 12000
    },
    {
        id: 'volvo-960',
        brand: 'Volvo',
        model: '960',
        mass: 1630, // oli 1520, +110kg!
        compatibleEngines: ['B6304F'],
        defaultEngine: 'B6304F',
        basePrice: 16000
    }
];

export const VOLVO_ENGINES = {
    'B230F': { code: 'B230F', brand: 'Volvo', basePower: 83 },
    'B230FT': { code: 'B230FT', brand: 'Volvo', basePower: 121 },
    'B204FT': { code: 'B204FT', brand: 'Volvo', basePower: 147 },
    'B234F': { code: 'B234F', brand: 'Volvo', basePower: 125 },
    'B6304F': { code: 'B6304F', brand: 'Volvo', basePower: 150 },
};