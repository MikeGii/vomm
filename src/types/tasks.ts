// src/types/tasks.ts
import { Timestamp } from 'firebase/firestore';

export interface TaskRewards {
    experience: number;
    money: number;
    reputation: number;
}

// Simplified - only production progress now
export interface TaskProgress {
    itemsProduced: number;
    itemsSold: number;
    hoursWorked: number;
    attributeLevelsGained: number;
}

export interface Task {
    id: string;
    title: string;
    itemType: 'juice' | 'porrige' | 'cloth' | 'bandage';
    requirements: {
        itemsToProduce: number;
        itemsToSell: number;
        workHours: number;
        attributeLevels: number;
    };
    progress: TaskProgress;
    rewards: TaskRewards;
    completed: boolean;
}

export interface PlayerTasks {
    userId: string;
    daily: Task | null;
    weekly: Task | null;
    lastDailyReset: Timestamp;
    lastWeeklyReset: Timestamp;
    streak: number;
}