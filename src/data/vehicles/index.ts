import { CarModel, Engine } from '../../types/vehicles';

// Import kõik brändid
import { AUDI_MODELS, AUDI_ENGINES } from './brands/audi';
import { BMW_MODELS, BMW_ENGINES } from './brands/bmw';
import { NISSAN_MODELS, NISSAN_ENGINES } from './brands/nissan';
import { TOYOTA_MODELS, TOYOTA_ENGINES } from './brands/toyota';
import { FORD_MODELS, FORD_ENGINES } from './brands/ford';
import { VOLVO_MODELS, VOLVO_ENGINES } from './brands/volvo';

// Kombineeri kõik mudelid
export const ALL_CAR_MODELS: CarModel[] = [
    ...AUDI_MODELS,
    ...BMW_MODELS,
    ...NISSAN_MODELS,
    ...TOYOTA_MODELS,
    ...FORD_MODELS,
    ...VOLVO_MODELS
];

// Kombineeri kõik mootorid
export const ALL_ENGINES: Record<string, Omit<Engine, 'id' | 'turbo' | 'ecu' | 'intake' | 'exhaust'>> = {
    ...AUDI_ENGINES,
    ...BMW_ENGINES,
    ...NISSAN_ENGINES,
    ...TOYOTA_ENGINES,
    ...FORD_ENGINES,
    ...VOLVO_ENGINES
};

// Helper funktsioonid
export function getCarModelById(id: string): CarModel | undefined {
    return ALL_CAR_MODELS.find(model => model.id === id);
}

export function getEngineByCode(code: string) {
    return ALL_ENGINES[code];
}

export function getCarsByBrand(brand: string): CarModel[] {
    return ALL_CAR_MODELS.filter(model => model.brand === brand);
}

export function getBrands(): string[] {
    return [...new Set(ALL_CAR_MODELS.map(model => model.brand))];
}

// Loo uus stock mootor
export function createStockEngine(engineCode: string): Engine {
    const engineData = ALL_ENGINES[engineCode];
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

// Export brändid eraldi kui vaja
export { AUDI_MODELS, BMW_MODELS, NISSAN_MODELS, TOYOTA_MODELS, FORD_MODELS, VOLVO_MODELS };