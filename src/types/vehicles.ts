// Tuning osade tüübid
export type TurboLevel = 'stock' | 'stage1' | 'stage2' | 'stage3';
export type ECULevel = 'stock' | 'stage1' | 'stage2' | 'stage3';
export type IntakeLevel = 'stock' | 'sport' | 'performance';
export type ExhaustLevel = 'stock' | 'sport' | 'performance';

// Mootori struktuur
export interface Engine {
    id: string;
    code: string; // N47, D420, jne
    brand: string; // BMW, Volvo, jne
    basePower: number; // kW

    // Osad on seotud mootoriga
    turbo: TurboLevel;
    ecu: ECULevel;
    intake: IntakeLevel;
    exhaust: ExhaustLevel;
}

// Auto mudel
export interface CarModel {
    id: string;
    brand: string;
    model: string;
    mass: number; // kg
    compatibleEngines: string[]; // mootori koodid
    defaultEngine: string; // vaikimisi mootori kood
    basePrice: number; // EUR
    imageUrl?: string; // optional, tulevikuks
}

// Mängija auto
export interface PlayerCar {
    id: string;
    ownerId: string;

    // Auto info
    carModelId: string; // viide CarModel'ile
    mileage: number; // km
    purchaseDate: Date;

    // Mootor ja osad
    engine: Engine; // terve mootori objekt koos osadega

    // Müük
    isForSale: boolean;
    salePrice?: number;
    listedAt?: Date;
}

// Mängija garaaži inventar
export interface GarageInventory {
    userId: string;
    engines: Engine[]; // varumootorid koos osadega
}

// Auto statistika (arvutatud väärtused)
export interface CarStats {
    power: number; // kW (peale tuning ja kulumist)
    mass: number; // kg
    acceleration: number; // 0-100 km/h sekundites
}

// Tuning koefitsiendid
export const TUNING_MULTIPLIERS = {
    turbo: {
        stock: 1.0,
        stage1: 1.4,
        stage2: 1.8,
        stage3: 3.0 // 200% boost
    },
    ecu: {
        stock: 1.0,
        stage1: 1.15,
        stage2: 1.25,
        stage3: 1.35
    },
    intake: {
        stock: 1.0,
        sport: 1.08,
        performance: 1.15
    },
    exhaust: {
        stock: 1.0,
        sport: 1.10,
        performance: 1.20
    }
} as const;

// Kulumise konstant
export const WEAR_PER_10000KM = 0.02; // 2% per 10,000km

// Helper tüübid UI jaoks
export interface CarListingItem {
    car: PlayerCar;
    model: CarModel;
    stats: CarStats;
    seller?: {
        id: string;
        username: string;
    };
}

// Marketplace filter tüübid
export interface MarketplaceFilters {
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minPower?: number;
    maxPower?: number;
    maxMileage?: number;
}

// Garage slot (seotud Estate'iga)
export interface GarageSlot {
    slotId: number;
    carId?: string; // PlayerCar id
    isEmpty: boolean;
}