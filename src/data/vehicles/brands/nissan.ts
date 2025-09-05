import { CarModel } from '../../../types/vehicles';

export const NISSAN_MODELS: CarModel[] = [
    {
        id: 'nissan-200sx-s13',
        brand: 'Nissan',
        model: '200SX S13',
        mass: 1200, // oli 1180, +20kg
        compatibleEngines: ['CA18DET'],
        defaultEngine: 'CA18DET',
        basePrice: 24000
    },
    {
        id: 'nissan-200sx-s14',
        brand: 'Nissan',
        model: '200SX S14',
        mass: 1330, // oli 1250, +80kg!
        compatibleEngines: ['SR20DET'],
        defaultEngine: 'SR20DET',
        basePrice: 32000
    },
    {
        id: 'nissan-skyline-r32',
        brand: 'Nissan',
        model: 'Skyline R32 GTS-t',
        mass: 1405, // oli 1340, +65kg
        compatibleEngines: ['RB20DET'],
        defaultEngine: 'RB20DET',
        basePrice: 36000
    },
    {
        id: 'nissan-skyline-r33',
        brand: 'Nissan',
        model: 'Skyline R33 GTS25-t',
        mass: 1430, // oli 1380, +50kg
        compatibleEngines: ['RB25DET'],
        defaultEngine: 'RB25DET',
        basePrice: 44000
    },
    {
        id: 'nissan-300zx',
        brand: 'Nissan',
        model: '300ZX Z32',
        mass: 1510, // oli 1450, +60kg
        compatibleEngines: ['VG30DE'],
        defaultEngine: 'VG30DE',
        basePrice: 40000
    }
];

export const NISSAN_ENGINES = {
    'CA18DET': { code: 'CA18DET', brand: 'Nissan', basePower: 124 },
    'SR20DET': { code: 'SR20DET', brand: 'Nissan', basePower: 147 },
    'RB20DET': { code: 'RB20DET', brand: 'Nissan', basePower: 158 },
    'RB25DET': { code: 'RB25DET', brand: 'Nissan', basePower: 184 },
    'VG30DE': { code: 'VG30DE', brand: 'Nissan', basePower: 163 },
};