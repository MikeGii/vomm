// src/types/estate.ts (COMPLETE)
import {InventoryItem} from "./inventory";

export interface GarageSlot {
    slotId: number;
    isEmpty: boolean;
    carId?: string;
}

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

    equippedDeviceDetails?: {
        printer?: InventoryItem;
        laserCutter?: InventoryItem;
    };
    unequippedDevices: {
        threeDPrinters: number;
        laserCutters: number;
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