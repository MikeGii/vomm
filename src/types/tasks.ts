// src/types/tasks.ts
import { Timestamp } from 'firebase/firestore';

export interface TaskRewards {
    experience: number;
    money: number;
    reputation: number;
}

export interface CombinedTaskProgress {
    coursesCompleted: number;
    hoursWorked: number;
    attributeLevelsGained: number;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    requirements: {
        courses: number;
        workHours: number;
        attributeLevels: number;
    };
    progress: CombinedTaskProgress;
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