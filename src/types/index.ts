// src/types/index.ts

// Simple user type
import {Timestamp} from "firebase/firestore";
import { InventoryItem} from "./inventory";
import { CharacterEquipment } from './equipment';
import {AdminPermissions} from "./admin";
import {PlayerEstate} from "./estate";

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
    sewing: AttributeData;
    medicine: AttributeData;
    printing: AttributeData;
    lasercutting: AttributeData;
    handling: AttributeData;
    reactionTime: AttributeData;
    gearShifting: AttributeData;
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
        sewing?: number;
        medicine?: number;
        printing?: number;
        lasercutting?: number;
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

export interface HandicraftTrainingData {
    remainingClicks: number;
    lastResetTime: any;
    totalTrainingsDone: number;
}

// Player game stats
export interface PlayerStats {
    username?: string;
    excludeFromLeaderboard?: boolean;
    level: number;
    experience: number;
    reputation: number;
    money: number,
    pollid?: number;
    rank: string | null;
    departmentUnit: string | null;
    department: string | null;
    prefecture: string | null;
    policePosition?:
        | 'abipolitseinik'
        | 'kadett'
        | 'patrullpolitseinik'
        | 'uurija'
        | 'kiirreageerija'
        | 'koerajuht'
        | 'küberkriminalist'
        | 'jälitaja'
        | 'grupijuht_patrol'
        | 'grupijuht_investigation'
        | 'grupijuht_emergency'
        | 'grupijuht_k9'
        | 'grupijuht_cyber'
        | 'grupijuht_crimes'
        | 'talituse_juht_patrol'
        | 'talituse_juht_investigation'
        | 'talituse_juht_emergency'
        | 'talituse_juht_k9'
        | 'talituse_juht_cyber'
        | 'talituse_juht_crimes'
        | null;
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
    handicraftTrainingData?: HandicraftTrainingData;
    processedItems?: InventoryItem[];
    equipment?: CharacterEquipment;
    fightClubStats?: FightClubStats;
    fightClubData?: FightClubData;
    isVip?: boolean;
    completedTests?: string[];
    activeTest?: ActiveTest | null;
    casinoData?: {
        playsUsed: number;
        lastPlayTime: number;
        hourlyReset: number;
    };
    lastSeen?: Timestamp;
    adminPermissions?: AdminPermissions;
    activeCarId?: string;
    estate?: PlayerEstate | null;
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
    category: 'abipolitseinik' | 'sisekaitseakadeemia' | 'politsei';
    completionQuestion?: CourseQuestion;
}

export interface CourseQuestion {
    question: string;
    answers: string[];
    correctAnswerIndex: number;
    rewards: {
        experience: number;
        money?: number;
        reputation?: number;
    };
}

// Active course enrollment
export interface ActiveCourse {
    courseId: string;
    userId: string;
    startedAt: Date | any;
    endsAt: Date | any;
    status: 'in_progress' | 'completed' | 'cancelled' | 'pending_question';
    questionAnswered?: boolean;
    boosterUsed?: boolean;
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
    allowedFor: (
        | 'kadett'
        | 'abipolitseinik'
        | 'patrullpolitseinik'
        | 'uurija'
        | 'kiirreageerija'
        | 'koerajuht'
        | 'küberkriminalist'
        | 'jälitaja'
        | 'grupijuht_patrol'
        | 'grupijuht_investigation'
        | 'grupijuht_emergency'
        | 'grupijuht_k9'
        | 'grupijuht_cyber'
        | 'grupijuht_crimes'
        | 'talituse_juht_patrol'
        | 'talituse_juht_investigation'
        | 'talituse_juht_emergency'
        | 'talituse_juht_k9'
        | 'talituse_juht_cyber'
        | 'talituse_juht_crimes'
        )[];
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
    boosterUsed?: boolean;
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
    policePosition?: string | null;
    departmentUnit?: string | null;
    department?: string | null;
    prefecture?: string | null;
    isEmployed: boolean;
    completedCourses?: string[];
    attributes?: PlayerAttributes;
    casesCompleted: number;
    criminalsArrested: number;
    totalWorkedHours: number;
    isVip?: boolean;
}

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
    money: number;
    badgeNumber: string | null;
    policePosition?: string | null;
    attributes?: PlayerAttributes;
    createdAt?: Date | Timestamp | FirestoreTimestamp;
    completedCourses?: string[];
    totalWorkedHours?: number;
    isVip?: boolean;
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

export interface FightClubData {
    lastResetTime: Timestamp;
    remainingFights: number;
    totalFights: number;
    lastFightTime?: Timestamp;
}

export interface TestQuestion {
    id: string;
    question: string;
    answers: string[];
    correctAnswerIndex: number;
}

export interface Test {
    id: string;
    name: string;
    description: string;
    category: 'abipolitseinik' | 'sisekaitseakadeemia' | 'politsei';
    requiredCourses: string[]; // Courses needed to unlock this test
    baseReward: {
        experience: number;
        reputation: number;
    };
    perfectScoreBonus: {
        pollid: number; // 20 pollid for 100% correct
    };
    questions: TestQuestion[];
    timeLimit: number; // Time limit in minutes (15)
}

export interface ActiveTest {
    testId: string;
    userId: string;
    startedAt: Date | Timestamp;
    expiresAt: Date | Timestamp;
    currentQuestionIndex: number;
    answers: (number | null)[]; // Array of selected answer indices, null = not answered
    timeRemaining: number; // Seconds remaining
}

export interface CompletedTest {
    testId: string;
    userId: string;
    score: number; // Number of correct answers (0-10)
    totalQuestions: number; // Always 10
    completedAt: Date | Timestamp;
    earnedRewards: {
        experience: number;
        reputation: number;
        pollid?: number;
    };
    timeTaken: number; // Time taken in seconds
}

export * from './events.types';
export * from './inventory';
export * from './equipment';
export * from './bank';
export * from './tasks';