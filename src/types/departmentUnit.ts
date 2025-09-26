// src/types/departmentUnit.ts
import { Timestamp } from 'firebase/firestore';

// Department unit upgrade types
export type UpgradeType = 'work_xp_bonus' | 'region_salary_bonus';

// Leader information
export interface UnitLeader {
    username: string | null;
    userId: string | null;
    appointedAt: Timestamp | null;
}

export interface GroupLeader {
    username: string;
    userId: string;
    appointedAt: Timestamp;
}

// Upgrade structure
export interface DepartmentUnitUpgrade {
    type: UpgradeType;
    level: number; // 0-4 (0 = not purchased, 1-4 = upgrade levels)
    baseCost: number; // Base cost for level 1
    purchasedAt?: Timestamp;
    purchasedBy?: string; // Username who purchased
}

// Department unit wallet
export interface DepartmentUnitWallet {
    balance: number; // Current money in wallet
    totalDeposited: number; // Total money ever deposited
    totalSpent: number; // Total spent on upgrades
    lastUpdated: Timestamp;
    upgrades: DepartmentUnitUpgrade[]; // Array of all available upgrades

    // Transaction history (latest 50)
    recentTransactions?: WalletTransaction[];
}

// Transaction record
export interface WalletTransaction {
    type: 'donation' | 'upgrade_purchase';
    amount: number;
    userId: string;
    username: string;
    description: string;
    timestamp: Timestamp;
}

// Main department unit document structure
export interface DepartmentUnitData {
    id: string; // Format: "{department}_{unitId}" e.g., "Ida-Harju_patrol"
    department: string; // e.g., "Ida-Harju"
    unitId: string; // e.g., "patrol"
    unitName: string; // e.g., "Patrullitalitus"

    // Leadership - storing full info for quick access
    unitLeader: UnitLeader;
    groupLeaders: GroupLeader[]; // Array, max 4

    // Configurable limits
    maxGroupLeaders: number; // Default 4, can be increased later
    maxUnitLeaders: number; // Default 1

    // Wallet system
    wallet: DepartmentUnitWallet;

    // Stats (for future use)
    stats?: {
        totalMembers: number;
        averageLevel: number;
        totalCrimesSolved?: number;
    };

    // Metadata
    createdAt: Timestamp;
    lastUpdated: Timestamp;
}

// Helper interface for upgrade info and calculations
export interface UpgradeInfo {
    type: UpgradeType;
    name: string;
    description: string;
    baseCost: number;
    maxLevel: number;
    levels: UpgradeLevel[];
}

export interface UpgradeLevel {
    level: number;
    cost: number;
    bonus: number;
    bonusType: '%';
}

// Upgrade configurations
export const UPGRADE_CONFIGS: UpgradeInfo[] = [
    {
        type: 'work_xp_bonus',
        name: 'Töö XP boonus',
        description: 'Suurendab kõigi üksuse liikmete töö XP teenimist',
        baseCost: 450000,
        maxLevel: 4,
        levels: [
            { level: 1, cost: 450000, bonus: 5, bonusType: '%' },
            { level: 2, cost: 1800000, bonus: 10, bonusType: '%' },
            { level: 3, cost: 7200000, bonus: 15, bonusType: '%' },
            { level: 4, cost: 28800000, bonus: 20, bonusType: '%' }
        ]
    },
    {
        type: 'region_salary_bonus',
        name: 'Piirkonna palgaboonus',
        description: 'Suurendab kõigi üksuse liikmete töötasu',
        baseCost: 750000,
        maxLevel: 4,
        levels: [
            { level: 1, cost: 750000, bonus: 5, bonusType: '%' },
            { level: 2, cost: 3000000, bonus: 10, bonusType: '%' },
            { level: 3, cost: 12000000, bonus: 15, bonusType: '%' },
            { level: 4, cost: 48000000, bonus: 20, bonusType: '%' }
        ]
    }
];

// Helper function to calculate upgrade cost
export const calculateUpgradeCost = (baseCost: number, level: number): number => {
    if (level === 1) return baseCost;
    return baseCost * Math.pow(4, level - 1);
};

// Helper function to get upgrade info
export const getUpgradeInfo = (type: UpgradeType): UpgradeInfo | undefined => {
    return UPGRADE_CONFIGS.find(config => config.type === type);
};

// Helper function to get next level cost
export const getNextLevelCost = (type: UpgradeType, currentLevel: number): number | null => {
    const config = getUpgradeInfo(type);
    if (!config || currentLevel >= config.maxLevel) return null;

    const nextLevel = currentLevel + 1;
    return calculateUpgradeCost(config.baseCost, nextLevel);
};

// Helper function to get bonus for level
export const getBonusForLevel = (type: UpgradeType, level: number): number => {
    const config = getUpgradeInfo(type);
    if (!config || level === 0) return 0;

    const levelInfo = config.levels.find(l => l.level === level);
    return levelInfo?.bonus || 0;
};

// Interface for donation
export interface DonationData {
    amount: number;
    donorId: string;
    donorUsername: string;
    donorPosition: string;
}

// Interface for upgrade purchase
export interface UpgradePurchaseData {
    upgradeType: UpgradeType;
    newLevel: number;
    cost: number;
    purchasedBy: string; // username
    purchasedById: string; // userId
}