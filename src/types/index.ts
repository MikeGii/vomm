// src/types/index.ts

// Simple user type
export interface User {
    uid: string;
    email: string;
    username: string;
    createdAt: Date;
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
    casesCompleted: number;
    criminalsArrested: number;
}