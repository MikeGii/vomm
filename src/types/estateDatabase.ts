// src/types/estateDatabase.ts
import { EstateProperty } from './estate';

export interface DatabaseEstate extends EstateProperty {
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
}

export interface CreateEstateData {
    name: string;
    description: string;
    price: number;
    hasGarage: boolean;
    garageCapacity: number;
    hasWorkshop: boolean;
    kitchenSpace: 'small' | 'medium' | 'large';
    isActive: boolean;
}

export interface UpdateEstateData extends Partial<CreateEstateData> {
    updatedBy: string;
}

export interface EstateFormErrors {
    name?: string;
    description?: string;
    price?: string;
    garageCapacity?: string;
}