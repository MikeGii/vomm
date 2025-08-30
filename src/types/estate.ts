// src/types/estate.ts (COMPLETE)
export interface EstateProperty {
    id: string;
    name: string;
    description: string;
    price: number;
    hasGarage: boolean;
    garageCapacity: number; // 0 if no garage
    hasWorkshop: boolean;
    kitchenSpace: 'small' | 'medium' | 'large';
}

export interface PlayerEstate {
    userId: string;
    currentEstate: EstateProperty | null;
    ownedDevices: {
        has3DPrinter: boolean;
        hasLaserCutter: boolean;
    };
    // Track what devices are available in inventory but not equipped
    unequippedDevices: {
        threeDPrinters: number; // Count of 3D printers in inventory
        laserCutters: number; // Count of laser cutters in inventory
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkshopDevice {
    id: string;
    name: string;
    description: string;
    price: number;
    type: '3d_printer' | 'laser_cutter';
    requiredAttribute: 'printing' | 'lasercutting';
    unlocksAttribute: boolean;
    requiresWorkshop: boolean;
}

export interface EstateTransaction {
    newEstate: EstateProperty;
    currentEstate: EstateProperty | null;
    finalPrice: number;
    currentEstateValue: number;
}