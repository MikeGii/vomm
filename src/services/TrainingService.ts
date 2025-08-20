// src/services/TrainingService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {PlayerStats, PlayerAttributes, AttributeData, TrainingData, KitchenLabTrainingData} from '../types';
import {calculateLevelFromExp, calculatePlayerHealth} from "./PlayerService";
import { getTrainingBonusForAttribute} from "../data/abilities";

// Calculate experience needed for next attribute level
export const calculateExpForNextLevel = (currentLevel: number): number => {
    if (currentLevel === 0) return 100;
    const baseExp = (currentLevel + 1) * 100;
    const bonus = baseExp * 0.15;
    return Math.floor(baseExp + bonus);
};

// Initialize attributes for new players
export const initializeAttributes = (): PlayerAttributes => {
    const createAttribute = (): AttributeData => ({
        level: 0,
        experience: 0,
        experienceForNextLevel: 100
    });

    return {
        strength: createAttribute(),
        agility: createAttribute(),
        dexterity: createAttribute(),
        intelligence: createAttribute(),
        endurance: createAttribute(),
        cooking: createAttribute(),
        brewing: createAttribute(),
        chemistry: createAttribute(),
    };
};

// Initialize training data
export const initializeTrainingData = (): TrainingData => {
    return {
        remainingClicks: 50,
        lastResetTime: Timestamp.now(),
        totalTrainingsDone: 0
    };
};

export const initializeKitchenLabTrainingData = (): KitchenLabTrainingData => {
    return {
        remainingClicks: 50,
        lastResetTime: Timestamp.now(),
        totalTrainingsDone: 0
    };
};

// Check if training clicks should reset (every full hour) - KEEP ONLY THIS ONE
export const checkAndResetTrainingClicks = async (userId: string): Promise<TrainingData> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;
    let trainingData = stats.trainingData || initializeTrainingData();

    // Determine max clicks based on work status
    const maxClicks = stats.activeWork ? 10 : 50;

    // Get current time and last reset time
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastReset: Date;
    if (trainingData.lastResetTime instanceof Timestamp) {
        lastReset = trainingData.lastResetTime.toDate();
    } else if (trainingData.lastResetTime && typeof trainingData.lastResetTime === 'object' && 'seconds' in trainingData.lastResetTime) {
        lastReset = new Date(trainingData.lastResetTime.seconds * 1000);
    } else {
        lastReset = new Date(trainingData.lastResetTime);
    }

    const lastResetHour = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate(), lastReset.getHours());

    // If current hour is different from last reset hour, reset clicks
    if (currentHour.getTime() > lastResetHour.getTime()) {
        trainingData = {
            remainingClicks: maxClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: trainingData.totalTrainingsDone,
            isWorking: !!stats.activeWork
        };

        await updateDoc(statsRef, {
            trainingData: trainingData
        });
    }

    return trainingData;
};

export const checkAndResetKitchenLabTrainingClicks = async (userId: string): Promise<KitchenLabTrainingData> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;
    let kitchenLabTrainingData = stats.kitchenLabTrainingData || initializeKitchenLabTrainingData();

    // Determine max clicks based on work status (same logic as sports)
    const maxClicks = stats.activeWork ? 10 : 50;

    // Get current time and last reset time
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastReset: Date;
    if (kitchenLabTrainingData.lastResetTime instanceof Timestamp) {
        lastReset = kitchenLabTrainingData.lastResetTime.toDate();
    } else if (kitchenLabTrainingData.lastResetTime && typeof kitchenLabTrainingData.lastResetTime === 'object' && 'seconds' in kitchenLabTrainingData.lastResetTime) {
        lastReset = new Date(kitchenLabTrainingData.lastResetTime.seconds * 1000);
    } else {
        lastReset = new Date(kitchenLabTrainingData.lastResetTime);
    }

    const lastResetHour = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate(), lastReset.getHours());

    // If current hour is different from last reset hour, reset clicks
    if (currentHour.getTime() > lastResetHour.getTime()) {
        kitchenLabTrainingData = {
            remainingClicks: maxClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: kitchenLabTrainingData.totalTrainingsDone
        };

        await updateDoc(statsRef, {
            kitchenLabTrainingData: kitchenLabTrainingData
        });
    }

    return kitchenLabTrainingData;
};

// Perform training activity
export const performTraining = async (
    userId: string,
    activityId: string,
    rewards: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
        cooking?: number;
        brewing?: number;
        chemistry?: number;
        playerExp: number;
    },
    trainingType: 'sports' | 'kitchen-lab' = 'sports'
): Promise<PlayerStats> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;

    // Check and reset training clicks if needed
    if (trainingType === 'sports') {
        const trainingData = await checkAndResetTrainingClicks(userId);
        if (trainingData.remainingClicks <= 0) {
            throw new Error('Treeningkordi pole enam järel! Oota järgmist täistundi.');
        }
    } else if (trainingType === 'kitchen-lab') {
        const kitchenLabData = await checkAndResetKitchenLabTrainingClicks(userId);
        if (kitchenLabData.remainingClicks <= 0) {
            throw new Error('Treeningkordi pole enam järel! Oota järgmist täistundi.');
        }
    }

    // Initialize attributes if they don't exist
    const attributes = stats.attributes || initializeAttributes();

    // Update attributes based on rewards
    const updateAttribute = (attr: AttributeData, expGained: number): AttributeData => {
        let newExp = attr.experience + expGained;
        let newLevel = attr.level;
        let expForNext = attr.experienceForNextLevel;

        // Check for level up
        while (newExp >= expForNext) {
            newExp -= expForNext;
            newLevel++;
            expForNext = calculateExpForNextLevel(newLevel);
        }

        return {
            level: newLevel,
            experience: newExp,
            experienceForNextLevel: expForNext
        };
    };

    // Apply rewards to attributes WITH BONUSES
    const applyBonusToReward = (baseReward: number, attribute: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance'): number => {
        const bonus = getTrainingBonusForAttribute(stats.completedCourses || [], attribute);
        return Math.floor(baseReward * (1 + bonus));
    };

    if (rewards.strength) {
        const bonusedReward = applyBonusToReward(rewards.strength, 'strength');
        attributes.strength = updateAttribute(attributes.strength, bonusedReward);
    }
    if (rewards.agility) {
        const bonusedReward = applyBonusToReward(rewards.agility, 'agility');
        attributes.agility = updateAttribute(attributes.agility, bonusedReward);
    }
    if (rewards.dexterity) {
        const bonusedReward = applyBonusToReward(rewards.dexterity, 'dexterity');
        attributes.dexterity = updateAttribute(attributes.dexterity, bonusedReward);
    }
    if (rewards.intelligence) {
        const bonusedReward = applyBonusToReward(rewards.intelligence, 'intelligence');
        attributes.intelligence = updateAttribute(attributes.intelligence, bonusedReward);
    }
    if (rewards.endurance) {
        const bonusedReward = applyBonusToReward(rewards.endurance, 'endurance');
        attributes.endurance = updateAttribute(attributes.endurance, bonusedReward);
    }
    if (rewards.cooking) {
        attributes.cooking = updateAttribute(attributes.cooking, rewards.cooking);
    }
    if (rewards.brewing) {
        attributes.brewing = updateAttribute(attributes.brewing, rewards.brewing);
    }
    if (rewards.chemistry) {
        attributes.chemistry = updateAttribute(attributes.chemistry, rewards.chemistry);
    }

    // Recalculate health if strength or endurance changed
    let updatedHealth = stats.health;
    let healthUpdates: any = {};

    if (rewards.strength || rewards.endurance) {
        const oldMaxHealth = stats.health?.max || 100;
        const oldCurrentHealth = stats.health?.current || 100;

        // Calculate new max health
        const newHealthData = calculatePlayerHealth(
            attributes.strength.level,
            attributes.endurance.level
        );

        // When max health increases, increase current health by the same amount (not to full)
        const healthIncrease = newHealthData.max - oldMaxHealth;

        updatedHealth = {
            ...newHealthData,  // This includes max, baseHealth, strengthBonus, enduranceBonus
            current: oldCurrentHealth + healthIncrease  // Add the increase to current, don't set to max
        };

        // Make sure current doesn't exceed max
        updatedHealth.current = Math.min(updatedHealth.current, updatedHealth.max);

        // If now at max health, clear recovery timer
        if (updatedHealth.current >= updatedHealth.max) {
            healthUpdates.lastHealthUpdate = null;
        }
    }

    // Update player main experience and level
    const newPlayerExp = stats.experience + rewards.playerExp;
    const newPlayerLevel = calculateLevelFromExp(newPlayerExp);

    // Update training data based on training type
    let updates: any = {
        attributes: attributes,
        experience: newPlayerExp,
        level: newPlayerLevel,
        health: updatedHealth,
        ...healthUpdates
    };

    if (trainingType === 'sports') {
        const trainingData = await checkAndResetTrainingClicks(userId);
        const updatedTrainingData: TrainingData = {
            remainingClicks: trainingData.remainingClicks - 1,
            lastResetTime: trainingData.lastResetTime,
            totalTrainingsDone: trainingData.totalTrainingsDone + 1,
            isWorking: !!stats.activeWork
        };
        updates.trainingData = updatedTrainingData;
    } else if (trainingType === 'kitchen-lab') {
        const kitchenLabData = await checkAndResetKitchenLabTrainingClicks(userId);
        const updatedKitchenLabData: KitchenLabTrainingData = {
            remainingClicks: kitchenLabData.remainingClicks - 1,
            lastResetTime: kitchenLabData.lastResetTime,
            totalTrainingsDone: kitchenLabData.totalTrainingsDone + 1
        };
        updates.kitchenLabTrainingData = updatedKitchenLabData;
    }

    // Save to database
    await updateDoc(statsRef, updates);

    return {
        ...stats,
        ...updates
    };
};

// Get time until next reset
export const getTimeUntilReset = (): string => {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
    const diff = nextHour.getTime() - now.getTime();

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};