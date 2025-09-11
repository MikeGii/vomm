// src/types/vehicleDatabase.ts
import { Timestamp } from 'firebase/firestore';

// Database schema types - these will be stored in Firestore
export interface VehicleBrand {
    id: string;
    name: string; // e.g., "BMW", "Audi", "Toyota"
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string; // Admin user ID who created this
}

export interface VehicleModel {
    id: string;
    brandId: string; // Reference to VehicleBrand
    brandName: string; // Denormalized for easier queries
    model: string; // e.g., "E36 318i", "A4 B5"
    mass: number; // in kg
    basePrice: number; // in game currency
    basePollidPrice?: number;
    currency: 'money' | 'pollid';
    defaultEngineId: string; // Reference to VehicleEngine
    compatibleEngineIds: string[]; // Array of compatible engine IDs
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

export interface VehicleEngine {
    id: string;
    code: string; // e.g., "M50B25", "SR20DET"
    brandName: string; // e.g., "BMW", "Nissan"
    basePower: number; // in HP
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

// Types for UI/forms
export interface CreateVehicleBrandData {
    name: string;
}

export interface CreateVehicleModelData {
    brandId: string;
    model: string;
    mass: number;
    basePrice: number;
    basePollidPrice?: number;
    currency: 'money' | 'pollid';
    defaultEngineId: string;
    compatibleEngineIds: string[];
}

export interface CreateVehicleEngineData {
    code: string;
    brandName: string;
    basePower: number;
}

// UI display types
export interface VehicleModelWithBrand extends VehicleModel {
    brand: VehicleBrand;
    defaultEngine: VehicleEngine;
    compatibleEngines: VehicleEngine[];
}

export interface VehicleEngineWithUsage extends VehicleEngine {
    compatibleModels: VehicleModel[];
    usageCount: number;
}