import { CarModel } from '../../../types/vehicles';

export const AUDI_MODELS: CarModel[] = [
    {
        id: 'audi-80-b3',
        brand: 'Audi',
        model: '80 B3',
        mass: 1180,
        compatibleEngines: ['ABK', 'AAH'],
        defaultEngine: 'ABK',
        basePrice: 16000
    },
    {
        id: 'audi-100-c3',
        brand: 'Audi',
        model: '100 C3',
        mass: 1380,
        compatibleEngines: ['AAH', '3B'],
        defaultEngine: 'AAH',
        basePrice: 24000
    },
    {
        id: 'audi-s4-c4',
        brand: 'Audi',
        model: 'S4 C4',
        mass: 1700,
        compatibleEngines: ['AAN'],
        defaultEngine: 'AAN',
        basePrice: 50000
    }
];

export const AUDI_ENGINES = {
    'AAH': { code: 'AAH', brand: 'Audi', basePower: 128 }, // 2.8 V6
    'ABK': { code: 'ABK', brand: 'Audi', basePower: 110 }, // 2.0
    '3B': { code: '3B', brand: 'Audi', basePower: 162 }, // 2.2 Turbo
    'AAN': { code: 'AAN', brand: 'Audi', basePower: 169 }, // 2.2 Turbo S4
};