// Update src/services/WorkService.ts

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    Timestamp,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, ActiveWork, WorkHistoryEntry } from '../types';
import { getWorkActivityById, calculateWorkRewards } from '../data/workActivities';
import { calculateLevelFromExp } from "./PlayerService";
import { triggerWorkEvent } from "./EventService";

// Start work
export const startWork = async (
    userId: string,
    workId: string,
    prefecture: string,
    department: string,
    hours: number
): Promise<ActiveWork> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Mängija andmed puuduvad');
    }

    const stats = statsDoc.data() as PlayerStats;

    // Basic validations
    if (stats.activeWork) {
        throw new Error('Sa juba töötad! Oota kuni praegune töö lõppeb.');
    }

    if (stats.activeCourse?.status === 'in_progress') {
        throw new Error('Sa ei saa töötada koolituse ajal!');
    }

    // Safe health check with optional chaining
    if (!stats.health || stats.health.current < 50) {
        throw new Error('Su tervis on liiga madal töötamiseks! Minimaalne tervis on 50.');
    }

    const workActivity = getWorkActivityById(workId);
    if (!workActivity) {
        throw new Error('Töötegevus ei ole saadaval');
    }

    // Create work session
    const now = Timestamp.now();
    const duration = hours * 3600;
    const workSessionId = `${userId}_${Date.now()}`;

    const activeWork: ActiveWork = {
        workId,
        userId,
        prefecture,
        department,
        startedAt: now,
        endsAt: Timestamp.fromMillis(now.toMillis() + (duration * 1000)),
        totalHours: hours,
        expectedExp: calculateWorkRewards(workActivity, hours),
        status: 'in_progress', // Add missing status property
        workSessionId
    };

    // Update player stats
    await updateDoc(statsRef, {
        activeWork,
        'trainingData.isWorking': true,
        'trainingData.remainingClicks': 10
    });

    return activeWork;
};

// Check if work is complete and handle it
export const checkAndCompleteWork = async (userId: string): Promise<{
    completed: boolean;
    hasEvent: boolean;
}> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        return { completed: false, hasEvent: false };
    }

    const stats = statsDoc.data() as PlayerStats;

    if (!stats.activeWork) {
        return { completed: false, hasEvent: false };
    }

    // Check if time is up
    const now = Timestamp.now();
    const endsAt = stats.activeWork.endsAt as Timestamp;

    if (now.toMillis() < endsAt.toMillis()) {
        return { completed: false, hasEvent: false };
    }

    // Time is up - trigger event (70% chance) or complete directly
    const eventTriggered = await triggerWorkEvent(userId, stats.activeWork);

    if (!eventTriggered) {
        // No event, complete work immediately
        await completeWork(userId);
        return { completed: true, hasEvent: false };
    }

    return { completed: false, hasEvent: true };
};

// Complete work and give rewards
export const completeWork = async (userId: string): Promise<void> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) return;

    const stats = statsDoc.data() as PlayerStats;
    if (!stats.activeWork) return;

    const workActivity = getWorkActivityById(stats.activeWork.workId);
    if (!workActivity) return;

    // Calculate new stats
    const newExp = stats.experience + stats.activeWork.expectedExp;
    const newLevel = calculateLevelFromExp(newExp);
    // Use workActivity.moneyReward with fallback to 0 if undefined
    const moneyReward = workActivity.moneyReward || 0;
    const newMoney = stats.money + moneyReward;

    // Add to history
    const historyEntry: WorkHistoryEntry = {
        userId,
        workId: stats.activeWork.workId,
        workName: workActivity.name,
        prefecture: stats.activeWork.prefecture,
        department: stats.activeWork.department,
        startedAt: stats.activeWork.startedAt,
        completedAt: Timestamp.now(),
        hoursWorked: stats.activeWork.totalHours,
        expEarned: stats.activeWork.expectedExp,
        moneyEarned: moneyReward
    };

    await addDoc(collection(firestore, 'workHistory'), historyEntry);

    // Update stats - clear work and update rewards
    await updateDoc(statsRef, {
        activeWork: null,
        experience: newExp,
        level: newLevel,
        money: newMoney,
        'trainingData.isWorking': false,
        'trainingData.remainingClicks': 50
    });
};

// Get remaining time in milliseconds
export const getRemainingWorkTime = (activeWork: ActiveWork): number => {
    if (!activeWork) return 0;

    const now = Date.now();
    const endsAt = (activeWork.endsAt as Timestamp).toMillis();

    return Math.max(0, endsAt - now);
};

// Get work history
export const getWorkHistory = async (
    userId: string,
    limitCount: number = 10
): Promise<WorkHistoryEntry[]> => {
    const historyQuery = query(
        collection(firestore, 'workHistory'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as WorkHistoryEntry));
};