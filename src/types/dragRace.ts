// src/types/dragRace.ts
export interface FuelSystem {
    currentFuel: number;
    maxFreeFuel: number;
    lastFuelReset: Date;
    paidAttemptsUsed: number;
    maxPaidAttempts: number;
    nextResetTime: Date;
}

export type TrainingType = 'handling' | 'reactionTime' | 'gearShifting';

export interface TrainingOption {
    id: TrainingType;
    name: string;
    description: string;
    icon: string;
    baseXP: number;
    sourceAttribute: 'dexterity' | 'agility' | 'intelligence';
}

export interface TrainingResult {
    success: boolean;
    experienceGained: number;
    newLevel?: number;
    levelUp: boolean;
    currentLevel: number;
    currentExperience: number;
    experienceForNextLevel: number;
    fuelUsed: number;
    remainingFuel: number;
    levelsGained?: number;
}

export interface FuelPurchaseOption {
    type: 'money' | 'pollid';
    cost: number;
    available: boolean;
    remaining?: number;
}

export interface DragRacePlayerData {
    userId: string;
    activeCarId?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Training configuration
export const TRAINING_OPTIONS: TrainingOption[] = [
    {
        id: 'handling',
        name: 'Harjuta üldist auto käsitsemist',
        description: 'Parandab auto käsitsemise oskusi',
        icon: '🎯',
        baseXP: 10,
        sourceAttribute: 'dexterity'
    },
    {
        id: 'reactionTime',
        name: 'Harjuta reageerimisaega',
        description: 'Parandab reaktsiooniaega',
        icon: '⚡',
        baseXP: 10,
        sourceAttribute: 'agility'
    },
    {
        id: 'gearShifting',
        name: 'Harjuta käiguvahetus momenti',
        description: 'Parandab käiguvahetuse oskusi',
        icon: '⚙️',
        baseXP: 10,
        sourceAttribute: 'intelligence'
    }
];

// Fuel system constants
export const FUEL_CONSTANTS = {
    MAX_FREE_FUEL: 5,
    MAX_PAID_ATTEMPTS: 25,
    MONEY_COST_PER_ATTEMPT: 1000,
    POLLID_COST_PER_ATTEMPT: 10,
    RESET_INTERVAL_HOURS: 1,
    MILEAGE_PER_ATTEMPT: 1.6
};