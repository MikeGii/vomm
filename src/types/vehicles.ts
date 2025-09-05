// Tuning osade tüübid
export type TurboLevel = 'stock' | 'stage1' | 'stage2' | 'stage3';
export type ECULevel = 'stock' | 'stage1' | 'stage2' | 'stage3';
export type IntakeLevel = 'stock' | 'sport' | 'performance';
export type ExhaustLevel = 'stock' | 'sport' | 'performance';

export interface Engine {
    id: string;
    code: string;
    brand: string;
    basePower: number;
    turbo: TurboLevel;
    ecu: ECULevel;
    intake: IntakeLevel;
    exhaust: ExhaustLevel;
}

export interface CarModel {
    id: string;
    brand: string;
    model: string;
    mass: number;
    compatibleEngines: string[];
    defaultEngine: string;
    basePrice: number;
    imageUrl?: string;
}

// Mängija auto
export interface PlayerCar {
    id: string;
    ownerId: string;
    carModelId: string;
    mileage: number;
    purchaseDate: Date;
    engine: Engine;
    emptyPartSlots?: {
        turbo?: boolean;
        ecu?: boolean;
        intake?: boolean;
        exhaust?: boolean;
    };
    isForSale: boolean;
    salePrice?: number;
    listedAt?: Date;
}

// Updated: Garage inventory for spare parts only
export interface GarageInventoryItem {
    itemId: string; // Unique timestamped ID
    partId: string; // Base spare part ID (e.g., "turbo_stage1")
    purchaseDate: any; // Firebase timestamp
    purchasePrice: number; // What player paid
}

export interface CarStats {
    power: number;
    mass: number;
    acceleration: number;
}

// Tuning koefitsiendid
export const POWER_MULTIPLIERS = {
    turbo: {
        stock: 1.0,
        stage1: 1.4,    // +40%
        stage2: 1.8,    // +80%
        stage3: 3.0     // +200%
    },
    ecu: {
        stock: 1.0,
        stage1: 1.15,   // +15%
        stage2: 1.25,   // +25%
        stage3: 1.35    // +35%
    },
    intake: {
        stock: 1.0,
        sport: 1.08,    // +8%
        performance: 1.15 // +15%
    },
    exhaust: {
        stock: 1.0,
        sport: 1.10,    // +10%
        performance: 1.20 // +20%
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
    carId?: string;
    isEmpty: boolean;
}