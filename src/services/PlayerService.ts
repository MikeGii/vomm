// src/services/PlayerService.ts
import {doc, setDoc, getDoc, updateDoc} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {PlayerStats, PlayerHealth, InventoryItem} from '../types';
import { initializeAttributes, initializeTrainingData } from './TrainingService';

// Calculate experience needed for a specific level
export const calculateExpForLevel = (level: number): number => {
    if (level <= 1) return 0;

    const baseExp = 100;
    let totalExp = 0;

    for (let i = 2; i <= level; i++) {
        // Use different growth rates for different level ranges
        let growthRate: number;

        if (i <= 50) {
            // Levels 2-50: 12% growth rate (keeps current progression)
            growthRate = 0.12;
        } else if (i <= 75) {
            // Levels 51-75: Reduced to 8% growth rate
            growthRate = 0.08;
        } else {
            // Levels 76-99: Further reduced to 5% growth rate
            growthRate = 0.05;
        }

        totalExp += Math.floor(baseExp * Math.pow(1 + growthRate, i - 2));
    }

    return totalExp;
};

// Calculate level from total experience
export const calculateLevelFromExp = (totalExp: number): number => {
    let level = 1;
    while (calculateExpForLevel(level + 1) <= totalExp) {
        level++;
    }
    return level;
};

// Get experience progress for current level
export const getExpProgress = (totalExp: number): { current: number; needed: number; percentage: number } => {
    const level = calculateLevelFromExp(totalExp);
    const currentLevelExp = calculateExpForLevel(level);
    const nextLevelExp = calculateExpForLevel(level + 1);
    const current = totalExp - currentLevelExp;
    const needed = nextLevelExp - currentLevelExp;
    const percentage = (current / needed) * 100;

    return {
        current,
        needed,
        percentage
    };
};

// Calculate player health based on attributes
export const calculatePlayerHealth = (strengthLevel: number, enduranceLevel: number): PlayerHealth => {
    const baseHealth = 100;
    const strengthBonus = strengthLevel;
    const enduranceBonus = enduranceLevel;
    const maxHealth = baseHealth + strengthBonus + enduranceBonus;

    return {
        current: maxHealth,
        max: maxHealth,
        baseHealth: baseHealth,
        strengthBonus: strengthBonus,
        enduranceBonus: enduranceBonus
    };
};

// Create initial VIP items for new players
const createInitialVipItems = (): InventoryItem[] => {
    return [
        {
            id: `vip_work_time_booster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: 'Tööaeg 95%',
            description: 'Lühendab aktiivset tööaega 95%',
            category: 'consumable',
            quantity: 1,
            shopPrice: 0,
            equipped: false,
            source: 'event',
            obtainedAt: new Date(),
            consumableEffect: {
                type: 'workTimeReduction',
                value: 95
            }
        },
        {
            id: `vip_course_time_booster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: 'Kursus 95%',
            description: 'Lühendab aktiivset kursust 95%',
            category: 'consumable',
            quantity: 1,
            shopPrice: 0,
            equipped: false,
            source: 'event',
            obtainedAt: new Date(),
            consumableEffect: {
                type: 'courseTimeReduction',
                value: 95
            }
        }
    ];
};

export const initializePlayerStats = async (userId: string, username: string): Promise<PlayerStats> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
        const stats = statsDoc.data() as PlayerStats;

        // Initialize money if not present
        if (stats.money === undefined) {
            stats.money = 0;
            await updateDoc(statsRef, { money: 0 });
        }

        if (stats.pollid === undefined) {
            stats.pollid = 0;

            await updateDoc(statsRef, { pollid: 0 });
        }

        // Calculate health if not present
        if (!stats.health && stats.attributes) {
            stats.health = calculatePlayerHealth(
                stats.attributes.strength.level,
                stats.attributes.endurance.level
            );
        }

        // Initialize totalWorkedHours if not present
        if (stats.totalWorkedHours === undefined) {
            stats.totalWorkedHours = 0;
        }

        return stats;
    }

    // Create initial stats for new player - starts unemployed and without training
    const initialStats: PlayerStats = {
        username,
        level: 1,
        experience: 0,
        reputation: 0,
        money: 150,
        rank: null,
        department: null,
        departmentUnit: null,
        prefecture: null,
        badgeNumber: null,
        isEmployed: false,
        casesCompleted: 0,
        criminalsArrested: 0,
        totalWorkedHours: 0,
        activeCourse: null,
        completedCourses: [],
        attributes: initializeAttributes(),
        trainingData: initializeTrainingData(),
        activeWork: null,
        workHistory: [],
        health: calculatePlayerHealth(0, 0),
        inventory: createInitialVipItems(),
        isVip: false
    };

    await setDoc(statsRef, initialStats);
    return initialStats;
};

export const getPlayerStats = async (userId: string): Promise<PlayerStats | null> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
        return statsDoc.data() as PlayerStats;
    }

    return null;
};
