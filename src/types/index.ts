// src/types/index.ts

// Simple user type
import {Timestamp} from "firebase/firestore";
import { InventoryItem} from "./inventory";
import { CharacterEquipment } from './equipment';

export interface User {
    uid: string;
    email: string;
    username: string;
    createdAt: Date;
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
        playerExp: number;
    };
}

export interface TrainingData {
    remainingClicks: number;
    lastResetTime: Date | any;
    totalTrainingsDone: number;
    isWorking?: boolean;
}

// Player game stats
export interface PlayerStats {
    level: number;
    experience: number;
    reputation: number;
    money: number;
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
    equipment?: CharacterEquipment;
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
    };
    category: 'abipolitseinik' | 'sisekaitseakadeemia' | 'basic' | 'advanced' | 'specialist';
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
    hasCompletedTraining: boolean;
    completedCourses?: string[];
    attributes?: PlayerAttributes;
    casesCompleted: number;
    criminalsArrested: number;
    totalWorkedHours: number;
}

export type LeaderboardSortBy = 'level' | 'reputation' | 'money' | 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance' | 'cases' | 'arrests' | 'totalWorkedHours';

export interface GameUpdate {
    id: string;
    title: string;
    description: string;
    date: string;
    isNew?: boolean;
}

export * from './events.types';
export * from './inventory';
export * from './equipment';