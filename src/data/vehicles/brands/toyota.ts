import { CarModel } from '../../../types/vehicles';

export const TOYOTA_MODELS: CarModel[] = [
    {
        id: 'toyota-corolla-ae86',
        brand: 'Toyota',
        model: 'Corolla AE86',
        mass: 985, // oli 970, +15kg
        compatibleEngines: ['4A-GE'],
        defaultEngine: '4A-GE',
        basePrice: 28000
    },
    {
        id: 'toyota-celica-st162',
        brand: 'Toyota',
        model: 'Celica ST162',
        mass: 1220, // oli 1210, +10kg
        compatibleEngines: ['3S-GE'],
        defaultEngine: '3S-GE',
        basePrice: 16000
    },
    {
        id: 'toyota-celica-gt4',
        brand: 'Toyota',
        model: 'Celica GT-Four',
        mass: 1435, // oli 1390, +45kg
        compatibleEngines: ['3S-GTE'],
        defaultEngine: '3S-GTE',
        basePrice: 36000
    },
    {
        id: 'toyota-supra-mk3',
        brand: 'Toyota',
        model: 'Supra MK3',
        mass: 1545, // oli 1490, +55kg
        compatibleEngines: ['7M-GTE', '1JZ-GTE'],
        defaultEngine: '7M-GTE',
        basePrice: 32000
    },
    {
        id: 'toyota-supra-mk4',
        brand: 'Toyota',
        model: 'Supra MK4',
        mass: 1530, // oli 1560, tegelikult natuke kergem
        compatibleEngines: ['2JZ-GE'],
        defaultEngine: '2JZ-GE',
        basePrice: 56000
    }
];

export const TOYOTA_ENGINES = {
    '4A-GE': { code: '4A-GE', brand: 'Toyota', basePower: 95 },
    '3S-GE': { code: '3S-GE', brand: 'Toyota', basePower: 118 },
    '3S-GTE': { code: '3S-GTE', brand: 'Toyota', basePower: 136 },
    '1JZ-GTE': { code: '1JZ-GTE', brand: 'Toyota', basePower: 206 },
    '7M-GTE': { code: '7M-GTE', brand: 'Toyota', basePower: 173 },
    '2JZ-GE': { code: '2JZ-GE', brand: 'Toyota', basePower: 162 },
};