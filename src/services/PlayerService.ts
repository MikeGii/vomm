// src/services/PlayerService.ts
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, PlayerHealth } from '../types';
import { initializeAttributes, initializeTrainingData } from './TrainingService';

// Calculate experience needed for a specific level
export const calculateExpForLevel = (level: number): number => {
    if (level <= 1) return 0;

    // Base formula: 100 XP for level 2, then increases by 20% per level
    const baseExp = 100;
    const growthRate = 0.12; // 20% increase per level

    let totalExp = 0;
    for (let i = 2; i <= level; i++) {
        totalExp += Math.floor(baseExp * Math.pow(1 + growthRate, i - 2));
    }

    return totalExp;
};

// Calculate experience needed for next level (the gap between current and next level)
export const calculateExpForNextLevel = (currentLevel: number): number => {
    const currentTotal = calculateExpForLevel(currentLevel);
    const nextTotal = calculateExpForLevel(currentLevel + 1);
    return nextTotal - currentTotal;
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

// Estonian police ranks from lowest to highest
// const POLICE_RANKS = [
//     'Abipolitseinik',
//     'Kadett',
//     'Noorinspektor',
//     'Inspektor',
//     'Vaneminspektor',
//     'Üleminspektor',
//     'Komissar',
//     'Vanemkomissar',
//     'Politseileitnant',
//     'Politseikapten',
//     'Politseimajor',
//     'Politseikolonelleitnant',
//     'Politseikolonel',
//     'Politseikindralinspektor',
//     'Politseikindral'
// ];

// Calculate player health based on attributes
export const calculatePlayerHealth = (strengthLevel: number, enduranceLevel: number): PlayerHealth => {
    const baseHealth = 100;
    const strengthBonus = strengthLevel * 1;
    const enduranceBonus = enduranceLevel * 1;
    const maxHealth = baseHealth + strengthBonus + enduranceBonus;

    return {
        current: maxHealth, // Start at full health
        max: maxHealth,
        baseHealth: baseHealth,
        strengthBonus: strengthBonus,
        enduranceBonus: enduranceBonus
    };
};

export const initializePlayerStats = async (userId: string): Promise<PlayerStats> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
        const stats = statsDoc.data() as PlayerStats;

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
        level: 1,
        experience: 0,
        reputation: 0,  // Starting with 0 reputation as requested
        rank: null,  // No rank when untrained
        department: null,  // No department when untrained
        prefecture: null,  // No prefecture when untrained - ADD THIS LINE
        badgeNumber: null,  // No badge when untrained
        isEmployed: false,
        hasCompletedTraining: false,  // No training completed initially
        casesCompleted: 0,
        criminalsArrested: 0,
        totalWorkedHours: 0,
        tutorialProgress: {
            isCompleted: false,
            currentStep: 0,
            totalSteps: 24,
            startedAt: null,
            completedAt: null
        },
        activeCourse: null,
        completedCourses: [],
        attributes: initializeAttributes(),
        trainingData: initializeTrainingData(),
        activeWork: null,
        workHistory: [],
        health: calculatePlayerHealth(0, 0)
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

// Update player health when attributes change
export const updatePlayerHealth = async (userId: string): Promise<void> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
        const stats = statsDoc.data() as PlayerStats;

        if (stats.attributes) {
            const newHealth = calculatePlayerHealth(
                stats.attributes.strength.level,
                stats.attributes.endurance.level
            );

            await updateDoc(statsRef, {
                health: newHealth
            });
        }
    }
};

// Update tutorial progress
export const updateTutorialProgress = async (
    userId: string,
    step: number,
    isCompleted: boolean = false
): Promise<void> => {
    const statsRef = doc(firestore, 'playerStats', userId);

    const updates: any = {
        'tutorialProgress.currentStep': step
    };

    if (step === 1) {
        updates['tutorialProgress.startedAt'] = new Date();
    }

    if (step === 24 || isCompleted) {
        updates['tutorialProgress.isCompleted'] = true;
        updates['tutorialProgress.completedAt'] = new Date();
        updates['tutorialProgress.currentStep'] = 24;
    }

    await updateDoc(statsRef, updates);
};

// Complete basic training
export const completeBasicTraining = async (userId: string): Promise<PlayerStats> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const currentStats = await getPlayerStats(userId);

    if (!currentStats) {
        throw new Error('Mängija andmed puuduvad');
    }

    const updatedStats: PlayerStats = {
        ...currentStats,
        hasCompletedTraining: true,
        isEmployed: true,
        rank: null, // Abipolitseinik doesn't have ranks
        department: null, // No department yet for Abipolitseinik
        prefecture: null, // Prefecture will be selected via modal
        badgeNumber: Math.floor(10000 + Math.random() * 90000).toString(),
        reputation: 100,  // Starting reputation when joining force
        experience: currentStats.experience + 50  // Bonus XP for completing training
    };

    await setDoc(statsRef, updatedStats);
    return updatedStats;
};

// Function to hire player as police officer (now requires training)
export const hireAsPoliceOfficer = async (userId: string): Promise<PlayerStats> => {
    const currentStats = await getPlayerStats(userId);

    if (!currentStats) {
        throw new Error('Mängija andmed puuduvad');
    }

    if (!currentStats.hasCompletedTraining) {
        throw new Error('Pead esmalt läbima abipolitseiniku koolituse!');
    }

    // If training is completed, this function can be used for re-employment
    return completeBasicTraining(userId);
};