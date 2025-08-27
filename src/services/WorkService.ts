// src/services/WorkService.ts
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
    getDocs,
    increment
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

    // Calculate expected rewards (both experience and money)
    const expectedRewards = calculateWorkRewards(workActivity, hours, stats.rank);

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
        expectedExp: expectedRewards.experience,
        expectedMoney: expectedRewards.money,
        status: 'in_progress',
        workSessionId
    };

    // VIP LOGIC: Determine working clicks based on VIP status
    const workingClicks = stats.isVip ? 30 : 10;

    // Update player stats
    await updateDoc(statsRef, {
        activeWork,
        'trainingData.isWorking': true,
        'trainingData.remainingClicks': workingClicks,
        'kitchenLabTrainingData.remainingClicks': workingClicks,
        'handicraftTrainingData.remainingClicks': workingClicks
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

    // Calculate actual rewards based on current player rank
    const actualRewards = calculateWorkRewards(workActivity, stats.activeWork.totalHours, stats.rank);

    // Calculate new stats
    const newExp = stats.experience + actualRewards.experience;
    const newLevel = calculateLevelFromExp(newExp);
    const newTotalWorkedHours = (stats.totalWorkedHours || 0) + stats.activeWork.totalHours;

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
        expEarned: actualRewards.experience,
        moneyEarned: actualRewards.money
    };

    await addDoc(collection(firestore, 'workHistory'), historyEntry);

    // VIP LOGIC: Determine non-working clicks based on VIP status
    const nonWorkingClicks = stats.isVip ? 100 : 50;

    // Update stats - clear work and update rewards
    const updateData: any = {
        activeWork: null,
        experience: newExp,
        level: newLevel,
        totalWorkedHours: newTotalWorkedHours,
        'trainingData.isWorking': false,
        'trainingData.remainingClicks': nonWorkingClicks,
        'kitchenLabTrainingData.remainingClicks': nonWorkingClicks,
        'handicraftTrainingData.remainingClicks': nonWorkingClicks
    };

    // Only update money if there's a monetary reward
    if (actualRewards.money > 0) {
        updateData.money = increment(actualRewards.money);
    }

    await updateDoc(statsRef, updateData);
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