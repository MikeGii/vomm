import { Engine } from '../../types/vehicles';

// Mootorite andmebaas
export const ENGINES: Record<string, Omit<Engine, 'id' | 'turbo' | 'ecu' | 'intake' | 'exhaust'>> = {
    // Audi mootorid
    'AAH': { code: 'AAH', brand: 'Audi', basePower: 128 }, // 2.8 V6
    'ABK': { code: 'ABK', brand: 'Audi', basePower: 110 }, // 2.0
    '3B': { code: '3B', brand: 'Audi', basePower: 162 }, // 2.2 Turbo
    'AAN': { code: 'AAN', brand: 'Audi', basePower: 169 }, // 2.2 Turbo S4

    // BMW mootorid
    'M20B20': { code: 'M20B20', brand: 'BMW', basePower: 95 }, // 2.0 E30
    'M20B25': { code: 'M20B25', brand: 'BMW', basePower: 125 }, // 2.5 E30
    'M30B30': { code: 'M30B30', brand: 'BMW', basePower: 135 }, // 3.0 E34
    'M30B35': { code: 'M30B35', brand: 'BMW', basePower: 155 }, // 3.5 E34
    'M50B20': { code: 'M50B20', brand: 'BMW', basePower: 110 }, // 2.0 E36
    'M50B25': { code: 'M50B25', brand: 'BMW', basePower: 141 }, // 2.5 E36
    'S38B36': { code: 'S38B36', brand: 'BMW', basePower: 232 }, // M5 E34

    // Nissan mootorid
    'CA18DET': { code: 'CA18DET', brand: 'Nissan', basePower: 124 }, // 200SX S13
    'SR20DET': { code: 'SR20DET', brand: 'Nissan', basePower: 147 }, // 200SX S14
    'RB20DET': { code: 'RB20DET', brand: 'Nissan', basePower: 158 }, // Skyline R32
    'RB25DET': { code: 'RB25DET', brand: 'Nissan', basePower: 184 }, // Skyline R33
    'VG30DE': { code: 'VG30DE', brand: 'Nissan', basePower: 163 }, // 300ZX

    // Toyota mootorid
    '4A-GE': { code: '4A-GE', brand: 'Toyota', basePower: 95 }, // Corolla AE86
    '3S-GE': { code: '3S-GE', brand: 'Toyota', basePower: 118 }, // Celica ST162
    '3S-GTE': { code: '3S-GTE', brand: 'Toyota', basePower: 136 }, // Celica GT-Four
    '1JZ-GTE': { code: '1JZ-GTE', brand: 'Toyota', basePower: 206 }, // Supra MK3
    '7M-GTE': { code: '7M-GTE', brand: 'Toyota', basePower: 173 }, // Supra MK3 Turbo
    '2JZ-GE': { code: '2JZ-GE', brand: 'Toyota', basePower: 162 }, // Supra MK4 NA

    // Ford mootorid
    'YB': { code: 'YB', brand: 'Ford', basePower: 150 }, // Sierra Cosworth
    'CVH-1.6': { code: 'CVH-1.6', brand: 'Ford', basePower: 66 }, // Escort
    'CVH-1.8': { code: 'CVH-1.8', brand: 'Ford', basePower: 96 }, // Escort XR3i
    'DOHC-2.0': { code: 'DOHC-2.0', brand: 'Ford', basePower: 110 }, // Sierra 2.0
    'V6-2.8': { code: 'V6-2.8', brand: 'Ford', basePower: 118 }, // Sierra/Granada

    // Volvo mootorid
    'B230F': { code: 'B230F', brand: 'Volvo', basePower: 83 }, // 240/740
    'B230FT': { code: 'B230FT', brand: 'Volvo', basePower: 121 }, // 240/740 Turbo
    'B204FT': { code: 'B204FT', brand: 'Volvo', basePower: 147 }, // 850 T5
    'B234F': { code: 'B234F', brand: 'Volvo', basePower: 125 }, // 940
    'B6304F': { code: 'B6304F', brand: 'Volvo', basePower: 150 }, // 960
};

export function getEngineByCode(code: string) {
    return ENGINES[code];
}

// Loo uus stock mootor
export function createStockEngine(engineCode: string): Engine {
    const engineData = ENGINES[engineCode];
    if (!engineData) {
        throw new Error(`Engine ${engineCode} not found`);
    }

    return {
        id: `engine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...engineData,
        turbo: 'stock',
        ecu: 'stock',
        intake: 'stock',
        exhaust: 'stock'
    };
}