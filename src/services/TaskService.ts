// src/services/TaskService.ts
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, Task, PlayerTasks } from '../types';

// Calculate reward multiplier based on player level and reputation
const calculateRewardMultiplier = (level: number, reputation: number, isVip: boolean): number => {
    const levelBonus = level * 0.02; // +2% per level
    const reputationBonus = reputation * 0.0001; // +0.01% per reputation point
    const vipBonus = isVip ? 0.5 : 0; // +50% for VIP

    return 1 + levelBonus + reputationBonus + vipBonus;
};

const createDailyTask = (level: number): Task => {
    // 20% increase per level
    const levelMultiplier = 1 + (level * 0.20);

    const baseExpReward = Math.floor(100 * levelMultiplier);
    const baseMoneyReward = Math.floor(100 * levelMultiplier);
    const baseReputationReward = Math.floor(5 * levelMultiplier);

    return {
        id: `daily_${Date.now()}`,
        title: 'Päevane väljakutse',
        description: 'Lõpeta 1 kursus, tööta 6 tundi ja tõsta atribuute 10 taseme võrra',
        requirements: {
            courses: 1,
            workHours: 6,
            attributeLevels: 10
        },
        progress: {
            coursesCompleted: 0,
            hoursWorked: 0,
            attributeLevelsGained: 0
        },
        rewards: {
            experience: baseExpReward,
            money: baseMoneyReward,
            reputation: baseReputationReward
        },
        completed: false
    };
};

const createWeeklyTask = (level: number): Task => {
    // 20% increase per level
    const levelMultiplier = 1 + (level * 0.20);

    const baseExpReward = Math.floor(1000 * levelMultiplier);
    const baseMoneyReward = Math.floor(1000 * levelMultiplier);
    const baseReputationReward = Math.floor(50 * levelMultiplier);

    return {
        id: `weekly_${Date.now()}`,
        title: 'Nädala suur väljakutse',
        description: 'Lõpeta 5 kursust, tööta 48 tundi ja tõsta atribuute 50 taseme võrra',
        requirements: {
            courses: 5,
            workHours: 48,
            attributeLevels: 50
        },
        progress: {
            coursesCompleted: 0,
            hoursWorked: 0,
            attributeLevelsGained: 0
        },
        rewards: {
            experience: baseExpReward,
            money: baseMoneyReward,
            reputation: baseReputationReward
        },
        completed: false
    };
};

export const getPlayerTasks = async (userId: string): Promise<PlayerTasks | null> => {
    const statsDoc = await getDoc(doc(firestore, 'playerStats', userId));
    if (!statsDoc.exists()) return null;

    const stats = statsDoc.data() as PlayerStats;

    const tasksRef = doc(firestore, 'playerTasks', userId);
    const tasksDoc = await getDoc(tasksRef);

    const now = Timestamp.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tasks: PlayerTasks;

    if (tasksDoc.exists()) {
        tasks = tasksDoc.data() as PlayerTasks;

        const lastDaily = tasks.lastDailyReset.toDate();
        if (lastDaily < today) {
            tasks.daily = createDailyTask(stats.level);
            tasks.lastDailyReset = now;
            tasks.streak = lastDaily.toDateString() === new Date(today.getTime() - 86400000).toDateString()
                ? tasks.streak + 1 : 0;
        }

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        if (tasks.lastWeeklyReset.toDate() < weekStart) {
            tasks.weekly = createWeeklyTask(stats.level);
            tasks.lastWeeklyReset = now;
        }
    } else {
        tasks = {
            userId,
            daily: createDailyTask(stats.level),
            weekly: createWeeklyTask(stats.level),
            lastDailyReset: now,
            lastWeeklyReset: now,
            streak: 0
        };
    }

    await setDoc(tasksRef, tasks);
    return tasks;
};

export const updateProgress = async (userId: string, type: 'work' | 'course' | 'training', value: number): Promise<void> => {
    const tasksRef = doc(firestore, 'playerTasks', userId);
    const tasksDoc = await getDoc(tasksRef);
    if (!tasksDoc.exists()) return;

    const tasks = tasksDoc.data() as PlayerTasks;
    let updated = false;

    // Update daily task
    if (tasks.daily && !tasks.daily.completed) {
        const newProgress = { ...tasks.daily.progress };

        if (type === 'course') {
            newProgress.coursesCompleted = Math.min(tasks.daily.requirements.courses, newProgress.coursesCompleted + value);
        } else if (type === 'work') {
            newProgress.hoursWorked = Math.min(tasks.daily.requirements.workHours, newProgress.hoursWorked + value);
        } else if (type === 'training') {
            newProgress.attributeLevelsGained = Math.min(tasks.daily.requirements.attributeLevels, newProgress.attributeLevelsGained + value);
        }

        // Check if all requirements are met
        const allComplete = newProgress.coursesCompleted >= tasks.daily.requirements.courses &&
            newProgress.hoursWorked >= tasks.daily.requirements.workHours &&
            newProgress.attributeLevelsGained >= tasks.daily.requirements.attributeLevels;

        tasks.daily.progress = newProgress;
        tasks.daily.completed = allComplete;
        updated = true;
    }

    // Update weekly task (same logic)
    if (tasks.weekly && !tasks.weekly.completed) {
        const newProgress = { ...tasks.weekly.progress };

        if (type === 'course') {
            newProgress.coursesCompleted = Math.min(tasks.weekly.requirements.courses, newProgress.coursesCompleted + value);
        } else if (type === 'work') {
            newProgress.hoursWorked = Math.min(tasks.weekly.requirements.workHours, newProgress.hoursWorked + value);
        } else if (type === 'training') {
            newProgress.attributeLevelsGained = Math.min(tasks.weekly.requirements.attributeLevels, newProgress.attributeLevelsGained + value);
        }

        // Check if all requirements are met
        const allComplete = newProgress.coursesCompleted >= tasks.weekly.requirements.courses &&
            newProgress.hoursWorked >= tasks.weekly.requirements.workHours &&
            newProgress.attributeLevelsGained >= tasks.weekly.requirements.attributeLevels;

        tasks.weekly.progress = newProgress;
        tasks.weekly.completed = allComplete;
        updated = true;
    }

    if (updated) {
        await updateDoc(tasksRef, {
            daily: tasks.daily,
            weekly: tasks.weekly
        });
    }
};

export const claimRewards = async (userId: string, taskType: 'daily' | 'weekly'): Promise<{
    success: boolean;
    message: string;
    rewards?: { experience: number; money: number; reputation: number };
}> => {
    const tasksRef = doc(firestore, 'playerTasks', userId);
    const statsRef = doc(firestore, 'playerStats', userId);

    const [tasksDoc, statsDoc] = await Promise.all([getDoc(tasksRef), getDoc(statsRef)]);
    if (!tasksDoc.exists() || !statsDoc.exists()) {
        return { success: false, message: 'Andmed puuduvad' };
    }

    const tasks = tasksDoc.data() as PlayerTasks;
    const stats = statsDoc.data() as PlayerStats;
    const task = taskType === 'daily' ? tasks.daily : tasks.weekly;

    if (!task?.completed) {
        return { success: false, message: 'Ülesanne pole veel lõpetatud' };
    }

    const multiplier = calculateRewardMultiplier(stats.level, stats.reputation, stats.isVip || false);

    const rewards = {
        experience: Math.floor(task.rewards.experience * multiplier),
        money: Math.floor(task.rewards.money * multiplier),
        reputation: Math.floor(task.rewards.reputation * multiplier)
    };

    await updateDoc(statsRef, {
        experience: stats.experience + rewards.experience,
        money: (stats.money || 0) + rewards.money,
        reputation: stats.reputation + rewards.reputation
    });

    // Fix Error 2: Use individual field updates instead of object spread
    await updateDoc(tasksRef, {
        [taskType]: null
    });

    const bonusText = [];
    if (stats.level > 0) bonusText.push(`+${(stats.level * 2)}% (tase)`);
    if (stats.reputation > 0) bonusText.push(`+${((stats.reputation * 0.01).toFixed(1))}% (maine)`);
    if (stats.isVip) bonusText.push('+50% (VIP)');

    const bonusMessage = bonusText.length > 0 ? ` [${bonusText.join(', ')}]` : '';

    return {
        success: true,
        message: `Saite ${rewards.experience} XP, ${rewards.money}€ ja ${rewards.reputation} mainet!${bonusMessage}`,
        rewards
    };
};