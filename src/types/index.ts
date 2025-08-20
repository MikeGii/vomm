// src/types/index.ts

// Simple user type
import {Timestamp} from "firebase/firestore";
import { InventoryItem} from "./inventory";
import { CharacterEquipment } from './equipment';

export interface User {
    uid: string;
    email: string;
    username: string;
    usernameLower: string;
    createdAt: Date | Timestamp | FirestoreTimestamp;
}

export interface AttributeData {
    level: number;
    experience: number;
    experienceForNextLevel: number;
}

export interface PlayerAttributes {
    strength: AttributeData;
    agility: AttributeData;
    dexterity: AttributeData;
    intelligence: AttributeData;
    endurance: AttributeData;
    cooking: AttributeData;
    brewing: AttributeData;
    chemistry: AttributeData;
}

export interface TrainingActivity {
    id: string;
    name: string;
    description?: string;
    requiredLevel: number;
    rewards: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
        cooking?: number;
        brewing?: number;
        chemistry?: number;
        playerExp: number;
    };
    requiredItems?: {
        id: string;
        quantity: number;
    }[];
    producedItems?: {
        id: string;
        quantity: number;
    }[];
}

export interface TrainingData {
    remainingClicks: number;
    lastResetTime: Date | any;
    totalTrainingsDone: number;
    isWorking?: boolean;
}

export interface KitchenLabTrainingData {
    remainingClicks: number;
    lastResetTime: Date | any;
    totalTrainingsDone: number;
}

// Player game stats
export interface PlayerStats {
    level: number;
    experience: number;
    reputation: number;
    money: number;
    pollid?: number;
    rank: string | null;
    department: string | null;
    prefecture: string | null;
    badgeNumber: string | null;
    isEmployed: boolean;
    abilities?: string[];
    casesCompleted: number;
    criminalsArrested: number;
    totalWorkedHours: number;
    activeCourse: ActiveCourse | null;
    completedCourses: string[];
    attributes?: PlayerAttributes;
    trainingData?: TrainingData;
    activeWork: ActiveWork | null;
    workHistory?: string[];
    health?: PlayerHealth;
    lastHealthUpdate?: Timestamp;
    inventory?: InventoryItem[];
    kitchenLabTrainingData?: KitchenLabTrainingData;
    processedItems?: InventoryItem[];
    equipment?: CharacterEquipment;
    fightClubStats?: FightClubStats;
    casinoData?: {
        playsUsed: number;
        lastPlayTime: number;
        hourlyReset: number;
    };
}

// Course definition
export interface Course {
    id: string;
    name: string;
    description: string;
    duration: number;
    requirements: {
        level?: number;
        reputation?: number;
        completedCourses?: string[];
        totalWorkedHours: number;
        attributes?: {
            strength?: number;
            agility?: number;
            dexterity?: number;
            intelligence?: number;
            endurance?: number;
        };
    };
    rewards: {
        experience: number;
        reputation?: number;
        money?: number;
        unlocksRank?: string;
        unlocksStatus?: string;
        grantsAbility?: string;
        replacesAbility?: string;
        grantsEquipment?: string[];
        grantsItems?: Array<{
            itemId: string;
            quantity: number;
        }>;
    };
    category: 'abipolitseinik' | 'sisekaitseakadeemia' | 'politsei' ;
}

// Active course enrollment
export interface ActiveCourse {
    courseId: string;
    userId: string;
    startedAt: Date | any;
    endsAt: Date | any;
    status: 'in_progress' | 'completed' | 'cancelled';
}

export interface WorkActivity {
    id: string;
    name: string;
    description: string;
    minLevel: number;
    requiredCourses?: string[];
    baseExpPerHour: number;
    expGrowthRate: number; // percentage as decimal (0.15 for 15%)
    maxHours: number;
    allowedFor?: ('kadett' | 'abipolitseinik' | 'politseiametnik')[];
    moneyReward?: number;
}

export interface ActiveWork {
    workId: string;
    userId: string;
    prefecture: string;
    department: string;
    startedAt: Date | any;
    endsAt: Date | any;
    totalHours: number;
    expectedExp: number;
    expectedMoney?: number;
    status: 'in_progress' | 'completed';
    workSessionId?: string;
}

export interface WorkHistoryEntry {
    id?: string;
    userId: string;
    workId: string;
    workName: string;
    prefecture: string;
    department: string;
    startedAt: Date | Timestamp;
    hoursWorked: number;
    expEarned: number;
    moneyEarned?: number;
    completedAt: Date | Timestamp;
}

export interface PlayerHealth {
    current: number;
    max: number;
    baseHealth: number;
    strengthBonus: number;
    enduranceBonus: number;
}

export interface LeaderboardEntry {
    userId: string;
    username: string;
    level: number;
    experience: number;
    reputation: number;
    money: number;
    rank: string | null;
    badgeNumber: string | null;
    isEmployed: boolean;
    completedCourses?: string[];
    attributes?: PlayerAttributes;
    casesCompleted: number;
    criminalsArrested: number;
    totalWorkedHours: number;
}

export type LeaderboardSortBy = 'level';

export interface GameUpdate {
    id: string;
    title: string;
    description: string;
    date: string;
    isNew?: boolean;
}

export interface PlayerProfileModalData {
    userId: string;
    username: string;
    level: number;
    reputation: number;
    status: string;
    money: number;
    badgeNumber: string | null;
    attributes?: PlayerAttributes;
    createdAt?: Date | Timestamp | FirestoreTimestamp;
}

export interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
}

export interface FightClubStats {
    wins: number;
    losses: number;
    totalFights: number;
    totalMoneyWon: number;
}

export * from './events.types';
export * from './inventory';
export * from './equipment';
export * from './bank';