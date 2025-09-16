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



// Racing system types
export type DragRaceDistance = '0.5' | '1.0';

export interface DragRaceTrack {
    id: string;
    name: string;
    distance: DragRaceDistance;
    description: string;
    icon: string;
}

export interface DragRaceTime {
    userId: string;
    trackId: string;
    distance: DragRaceDistance;
    time: number; // in seconds (e.g., 12.456)
    carId: string;
    carBrand: string;
    carModel: string;
    completedAt: Date;
    playerName: string;
    // Car stats at time of race (for historical accuracy)
    carStats: {
        power: number;
        acceleration: number;
        handling: number;
        weight: number;
    };
    // Player skills at time of race
    playerSkills: {
        handling: number;
        reactionTime: number;
        gearShifting: number;
    };
}

export interface DragRaceResult {
    time: number;
    breakdown: PhysicsBreakdown;
    isPersonalBest: boolean;
    previousBest?: number;
    rankPosition?: number;
    rankImprovement?: number;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    playerName: string;
    time: number;
    carBrand: string;
    carModel: string;
    completedAt: Date;
    isCurrentPlayer?: boolean;
}

export interface LeaderboardData {
    trackId: string;
    distance: DragRaceDistance;
    entries: LeaderboardEntry[];
    totalPlayers: number;
    currentPage: number;
    totalPages: number;
    playerRank?: number; // Current user's rank if not in top 15
    lastUpdated: Date;
}

// Race tracks configuration
export const DRAG_RACE_TRACKS: DragRaceTrack[] = [
    {
        id: 'half_mile',
        name: '1/2 miili drag',
        distance: '0.5',
        description: 'Kiire kiirendus ja täpne reaktsioon',
        icon: '🏁'
    },
    {
        id: 'one_mile',
        name: '1 miili drag',
        distance: '1.0',
        description: 'Pikk distants testib auto võimsust ja kestlikkust',
        icon: '🏆'
    }
];

// Racing constants
export const RACING_CONSTANTS = {
    CAR_PERFORMANCE_WEIGHT: 0.7,      // 70%
    DRIVING_SKILLS_WEIGHT: 0.2,       // 20%
    LUCK_WEIGHT: 0.1,                 // 10%
    LUCK_VARIANCE: 0.15,              // ±15% luck factor
    WEIGHT_PENALTY_FACTOR: 0.0001,    // How much weight affects time
    LEADERBOARD_PAGE_SIZE: 15,
    CACHE_DURATION_MINUTES: 30
};

export interface PhysicsBreakdown {
    carPerformance: number;
    drivingSkills: number;
    luck: number;
}