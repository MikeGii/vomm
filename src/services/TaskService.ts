// src/services/TaskService.ts
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, Task, PlayerTasks } from '../types';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';
import { GlobalUserService } from './GlobalUserService';

// Calculate reward multiplier based on player level and reputation
const calculateRewardMultiplier = (level: number, reputation: number, isVip: boolean): number => {
    const levelBonus = level * 0.02; // +2% per level
    const reputationBonus = reputation * 0.0001; // +0.01% per reputation point
    const vipBonus = isVip ? 0.5 : 0; // +50% for VIP

    return 1 + levelBonus + reputationBonus + vipBonus;
};

// Helper to generate random production item
const getRandomProductionItem = (): 'juice' | 'porrige' | 'cloth' | 'bandage' => {
    const items: ('juice' | 'porrige' | 'cloth' | 'bandage')[] = ['juice', 'porrige', 'cloth', 'bandage'];
    return items[Math.floor(Math.random() * items.length)];
};

// Helper to get item display name
export const getItemDisplayName = (itemType: string): string => {
    const names: { [key: string]: string } = {
        'juice': 'Mahl',
        'porrige': 'Puder',
        'cloth': 'Riie',
        'bandage': 'Side'
    };
    return names[itemType] || itemType;
};

// Create daily task - SIMPLIFIED
const createDailyTask = (level: number): Task => {
    const levelMultiplier = 1 + (level * 0.20);

    const baseExpReward = Math.floor(250 * levelMultiplier);
    const baseMoneyReward = Math.floor(250 * levelMultiplier);
    const baseReputationReward = Math.floor(5 * levelMultiplier);

    const itemType = getRandomProductionItem();

    return {
        id: `daily_${Date.now()}`,
        title: 'Päevane väljakutse',
        itemType: itemType,
        requirements: {
            itemsToProduce: 300,
            itemsToSell: 150,
            workHours: 6,
            attributeLevels: 10
        },
        progress: {
            itemsProduced: 0,
            itemsSold: 0,
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

// Create weekly task - Uses same item type as current daily task
const createWeeklyTask = (level: number, dailyItemType?: string): Task => {
    const levelMultiplier = 1 + (level * 0.20);

    const baseExpReward = Math.floor(4000 * levelMultiplier);
    const baseMoneyReward = Math.floor(4000 * levelMultiplier);
    const baseReputationReward = Math.floor(100 * levelMultiplier);

    // Use daily task's item type or generate random if not provided
    const itemType = (dailyItemType as 'juice' | 'porrige' | 'cloth' | 'bandage') || getRandomProductionItem();
    // Removed itemName variable since it was unused in weekly task

    return {
        id: `weekly_${Date.now()}`,
        title: 'Nädala väljakutse',
        itemType: itemType, // This will be updated daily to match daily task
        requirements: {
            itemsToProduce: 1500,
            itemsToSell: 750,
            workHours: 48,
            attributeLevels: 50
        },
        progress: {
            itemsProduced: 0,
            itemsSold: 0,
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

// Main function to get/create tasks
export const getPlayerTasks = async (userId: string): Promise<PlayerTasks | null> => {
    const statsDoc = await getDoc(doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer())));
    if (!statsDoc.exists()) return null;

    const stats = statsDoc.data() as PlayerStats;

    const tasksRef = doc(firestore, 'playerTasks', getServerSpecificId(userId, getCurrentServer()));
    const tasksDoc = await getDoc(tasksRef);

    const now = Timestamp.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tasks: PlayerTasks;

    if (tasksDoc.exists()) {
        tasks = tasksDoc.data() as PlayerTasks;

        const lastDaily = tasks.lastDailyReset.toDate();
        if (lastDaily < today) {
            // Create new daily task
            tasks.daily = createDailyTask(stats.level);
            tasks.lastDailyReset = now;
            tasks.streak = lastDaily.toDateString() === new Date(today.getTime() - 86400000).toDateString()
                ? tasks.streak + 1 : 0;

            // Update weekly task's item type to match the new daily task
            if (tasks.weekly) {
                tasks.weekly.itemType = tasks.daily.itemType;
            }
        }

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        if (tasks.lastWeeklyReset.toDate() < weekStart) {
            // Create new weekly task with current daily item type
            const dailyItemType = tasks.daily?.itemType;
            tasks.weekly = createWeeklyTask(stats.level, dailyItemType);
            tasks.lastWeeklyReset = now;
        }
    } else {
        // First time creating tasks
        const dailyTask = createDailyTask(stats.level);
        tasks = {
            userId,
            daily: dailyTask,
            weekly: createWeeklyTask(stats.level, dailyTask.itemType),
            lastDailyReset: now,
            lastWeeklyReset: now,
            streak: 0
        };
    }

    await setDoc(tasksRef, tasks);
    return tasks;
};

// Simplified update progress function
export const updateProgress = async (
    userId: string,
    type: 'work' | 'training' | 'production' | 'sold',
    value: number,
    itemType?: string // Optional item type for production/sold
): Promise<void> => {
    const tasksRef = doc(firestore, 'playerTasks', getServerSpecificId(userId, getCurrentServer()));
    const tasksDoc = await getDoc(tasksRef);
    if (!tasksDoc.exists()) return;

    const tasks = tasksDoc.data() as PlayerTasks;
    let updated = false;

    // Update daily task
    if (tasks.daily && !tasks.daily.completed) {
        const progress = tasks.daily.progress;
        const requirements = tasks.daily.requirements;

        // For production and sold, check if item type matches
        if (type === 'production' && itemType === tasks.daily.itemType) {
            progress.itemsProduced = Math.min(requirements.itemsToProduce, progress.itemsProduced + value);
            updated = true;
        } else if (type === 'sold' && itemType === tasks.daily.itemType) {
            progress.itemsSold = Math.min(requirements.itemsToSell, progress.itemsSold + value);
            updated = true;
        } else if (type === 'work') {
            progress.hoursWorked = Math.min(requirements.workHours, progress.hoursWorked + value);
            updated = true;
        } else if (type === 'training') {
            progress.attributeLevelsGained = Math.min(requirements.attributeLevels, progress.attributeLevelsGained + value);
            updated = true;
        }

        // Check if all requirements are met
        tasks.daily.completed = progress.itemsProduced >= requirements.itemsToProduce &&
            progress.itemsSold >= requirements.itemsToSell &&
            progress.hoursWorked >= requirements.workHours &&
            progress.attributeLevelsGained >= requirements.attributeLevels;
    }

    // Update weekly task - only if daily task item matches
    if (tasks.weekly && !tasks.weekly.completed && tasks.daily) {
        const progress = tasks.weekly.progress;
        const requirements = tasks.weekly.requirements;

        // Weekly progress only counts if it's the same item as daily task
        if (type === 'production' && itemType === tasks.daily.itemType) {
            progress.itemsProduced = Math.min(requirements.itemsToProduce, progress.itemsProduced + value);
            updated = true;
        } else if (type === 'sold' && itemType === tasks.daily.itemType) {
            progress.itemsSold = Math.min(requirements.itemsToSell, progress.itemsSold + value);
            updated = true;
        } else if (type === 'work') {
            progress.hoursWorked = Math.min(requirements.workHours, progress.hoursWorked + value);
            updated = true;
        } else if (type === 'training') {
            progress.attributeLevelsGained = Math.min(requirements.attributeLevels, progress.attributeLevelsGained + value);
            updated = true;
        }

        // Check if all requirements are met
        tasks.weekly.completed = progress.itemsProduced >= requirements.itemsToProduce &&
            progress.itemsSold >= requirements.itemsToSell &&
            progress.hoursWorked >= requirements.workHours &&
            progress.attributeLevelsGained >= requirements.attributeLevels;
    }

    if (updated) {
        await updateDoc(tasksRef, {
            daily: tasks.daily,
            weekly: tasks.weekly
        });
    }
};

// Claim rewards remains the same
export const claimRewards = async (userId: string, taskType: 'daily' | 'weekly'): Promise<{
    success: boolean;
    message: string;
    rewards?: { experience: number; money: number; reputation: number };
}> => {
    const tasksRef = doc(firestore, 'playerTasks', getServerSpecificId(userId, getCurrentServer()));
    const statsRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));

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

    const globalData = await GlobalUserService.getGlobalUserData(userId);
    const multiplier = calculateRewardMultiplier(stats.level, stats.reputation, globalData.isVip);

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

    await updateDoc(tasksRef, {
        [taskType]: null
    });

    const bonusText = [];
    if (stats.level > 0) bonusText.push(`+${(stats.level * 2)}% (tase)`);
    if (stats.reputation > 0) bonusText.push(`+${((stats.reputation * 0.01).toFixed(1))}% (maine)`);
    if (globalData.isVip) bonusText.push('+50% (VIP)');

    const bonusMessage = bonusText.length > 0 ? ` [${bonusText.join(', ')}]` : '';

    return {
        success: true,
        message: `Saite ${rewards.experience} XP, ${rewards.money}€ ja ${rewards.reputation} mainet!${bonusMessage}`,
        rewards
    };
};