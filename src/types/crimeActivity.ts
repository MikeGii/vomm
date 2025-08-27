// src/types/crimeActivity.ts
import { Timestamp } from 'firebase/firestore';

export interface DepartmentCrimeStats {
    id?: string;
    departmentId: string;        // e.g., "Ida-Harju", "Kärdla"
    prefecture: string;          // e.g., "Põhja prefektuur"
    currentCrimeLevel: number;   // 0-100 percentage
    lastDailyUpdate: Timestamp;  // When crime level was last increased by 5%
    monthlyResetDate: Timestamp; // When this month's cycle started
    totalWorkHoursThisMonth: number; // Statistics tracking
    lastUpdated: Timestamp;      // Last time any update happened
}

export interface CrimeReductionResult {
    success: boolean;
    previousCrimeLevel: number;
    newCrimeLevel: number;
    reductionAmount: number;
    departmentPlayerCount: number;
    message: string;
}

export interface DepartmentCrimeDisplay {
    departmentId: string;
    prefecture: string;
    currentCrimeLevel: number;
    playerCount: number;
    lastUpdated: Date;
    daysUntilReset: number;
}