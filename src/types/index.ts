// src/types/index.ts

// Simple user type
export interface User {
    uid: string;
    email: string;
    username: string;
    createdAt: Date;
}

// Tutorial progress tracking
export interface TutorialProgress {
    isCompleted: boolean;
    currentStep: number;
    totalSteps: number;
    startedAt: Date | null;
    completedAt: Date | null;
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
        playerExp: number; // Always 5
    };
}

export interface TrainingData {
    remainingClicks: number;
    lastResetTime: Date | any;
    totalTrainingsDone: number;
}

// Player game stats
export interface PlayerStats {
    level: number;
    experience: number;
    reputation: number;
    rank: string | null;  // null when unemployed or abipolitseinik
    department: string | null;  // Future police department
    prefecture: string | null;  // Add prefecture (Põhja, Lääne, Lõuna, Ida)
    badgeNumber: string | null;
    isEmployed: boolean;
    hasCompletedTraining: boolean;
    casesCompleted: number;
    criminalsArrested: number;
    tutorialProgress: TutorialProgress;
    activeCourse: ActiveCourse | null;
    completedCourses: string[];
    attributes?: PlayerAttributes;
    trainingData?: TrainingData;
}

// Course definition
export interface Course {
    id: string;
    name: string;
    description: string;
    duration: number; // in seconds
    requirements: {
        level?: number;
        reputation?: number;
        completedCourses?: string[]; // IDs of prerequisite courses
    };
    rewards: {
        experience: number;
        reputation?: number;
        unlocksRank?: string;
    };
    category: 'abipolitseinik' |'basic' | 'advanced' | 'specialist';
}

// Active course enrollment
export interface ActiveCourse {
    courseId: string;
    userId: string;
    startedAt: Date | any;
    endsAt: Date | any;
    status: 'in_progress' | 'completed' | 'cancelled';
}