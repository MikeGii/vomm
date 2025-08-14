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

// Player game stats
export interface PlayerStats {
    level: number;
    experience: number;
    reputation: number;
    rank: string | null;  // null when unemployed
    department: string | null;  // null when unemployed
    badgeNumber: string | null;  // null when unemployed
    isEmployed: boolean;
    hasCompletedTraining: boolean;  // Track if basic training is completed
    casesCompleted: number;
    criminalsArrested: number;
    tutorialProgress: TutorialProgress;
    activeCourse: ActiveCourse | null;
    completedCourses: string[];
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