// src/services/WorkService.ts
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    Timestamp,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    increment,
    startAfter,
    getCountFromServer,
    runTransaction
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, ActiveWork, WorkHistoryEntry } from '../types';
import { getWorkActivityById, calculateWorkRewards } from '../data/workActivities';
import { calculateLevelFromExp } from "./PlayerService";
import { triggerWorkEvent } from "./EventService";
import {updateCrimeLevelAfterWork} from "./CrimeService";
import { updateProgress } from "./TaskService";

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
    const expectedRewards = calculateWorkRewards(workActivity, hours, stats.rank, stats);

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
        const completionResult = await completeWork(userId);

        if (completionResult.success && !completionResult.wasAlreadyCompleted) {
            return { completed: true, hasEvent: false };
        } else if (completionResult.wasAlreadyCompleted) {
            // Work was already completed by another process
            console.log('Work completion prevented - already completed by another process');
            return { completed: false, hasEvent: false };
        } else {
            // Completion failed for some reason
            console.error('Work completion failed:', completionResult.message);
            return { completed: false, hasEvent: false };
        }
    }

    return { completed: false, hasEvent: true };
};

// Complete work and give rewards
export const completeWork = async (userId: string): Promise<{
    success: boolean;
    message?: string;
    wasAlreadyCompleted?: boolean;
    rewards?: any;
}> => {
    const statsRef = doc(firestore, 'playerStats', userId);

    try {
        // Use runTransaction to prevent race conditions
        const result = await runTransaction(firestore, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);

            if (!statsDoc.exists()) {
                return { success: false, message: 'Player stats not found' };
            }

            const stats = statsDoc.data() as PlayerStats;

            // Critical check: if no active work, this has already been completed
            if (!stats.activeWork) {
                return { success: false, wasAlreadyCompleted: true, message: 'Work already completed' };
            }

            const workActivity = getWorkActivityById(stats.activeWork.workId);
            if (!workActivity) {
                return { success: false, message: 'Work activity not found' };
            }

            // Calculate actual rewards based on current player rank
            const actualRewards = calculateWorkRewards(workActivity, stats.activeWork.totalHours, stats.rank, stats);

            // Calculate new stats
            const newExp = stats.experience + actualRewards.experience;
            const newLevel = calculateLevelFromExp(newExp);
            const newTotalWorkedHours = (stats.totalWorkedHours || 0) + stats.activeWork.totalHours;

            // VIP LOGIC: Keep your original VIP logic
            const nonWorkingClicks = stats.isVip ? 100 : 50;

            // Prepare update data
            const updateData: any = {
                activeWork: null, // ❗ Critical: Remove active work first
                experience: newExp,
                level: newLevel,
                totalWorkedHours: newTotalWorkedHours,
                'trainingData.isWorking': false,
                'trainingData.remainingClicks': nonWorkingClicks,
                'kitchenLabTrainingData.remainingClicks': nonWorkingClicks,
                'handicraftTrainingData.remainingClicks': nonWorkingClicks
            };

            // Add money if there's a reward (using increment like your original)
            if (actualRewards.money > 0) {
                updateData.money = increment(actualRewards.money);
            }

            // Apply the update within the transaction
            transaction.update(statsRef, updateData);

            // Create work history entry (same as your original)
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

            const historyRef = doc(collection(firestore, 'workHistory'));
            transaction.set(historyRef, historyEntry);

            return {
                success: true,
                rewards: actualRewards,
                newLevel,
                wasAlreadyCompleted: false,
                workData: stats.activeWork
            };
        });

        // Handle crime level update OUTSIDE the transaction (like your original)
        if (result.success && result.workData) {
            const stats = (await getDoc(statsRef)).data() as PlayerStats;

            if (stats.department &&
                stats.policePosition &&
                stats.policePosition !== 'abipolitseinik' &&
                stats.policePosition !== 'kadett') {

                try {
                    const crimeResult = await updateCrimeLevelAfterWork(
                        result.workData.prefecture,
                        result.workData.department,
                        result.workData.totalHours
                    );

                    if (crimeResult.success) {
                        console.log(`Crime reduction: ${crimeResult.message}`);
                    }
                } catch (error) {
                    console.error('Crime level update failed, but work completed successfully:', error);
                }
            }

            // Update task progress after successful work completion
            try {
                await updateProgress(userId, 'work', result.workData.totalHours);
                console.log(`Task progress updated: ${result.workData.totalHours} work hours`);
            } catch (error) {
                console.error('Task progress update failed, but work completed successfully:', error);
            }
        }

        return result;

    } catch (error) {
        console.error('Error completing work:', error);
        return { success: false, message: `Transaction failed: ${error}` };
    }
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
    page: number = 1,
    itemsPerPage: number = 10
): Promise<{
    entries: WorkHistoryEntry[];
    totalCount: number;
    hasMore: boolean;
}> => {
    // Get total count efficiently
    const countQuery = query(
        collection(firestore, 'workHistory'),
        where('userId', '==', userId)
    );
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    // If no history, return empty result
    if (totalCount === 0) {
        return {
            entries: [],
            totalCount: 0,
            hasMore: false
        };
    }

    // For pagination, we need to get items for the specific page
    let historyQuery;

    if (page === 1) {
        // First page - simple query
        historyQuery = query(
            collection(firestore, 'workHistory'),
            where('userId', '==', userId),
            orderBy('completedAt', 'desc'),
            limit(itemsPerPage)
        );
    } else {
        // For other pages, we need to get the last document from previous pages
        const skipCount = (page - 1) * itemsPerPage;
        const skipQuery = query(
            collection(firestore, 'workHistory'),
            where('userId', '==', userId),
            orderBy('completedAt', 'desc'),
            limit(skipCount)
        );
        const skipSnapshot = await getDocs(skipQuery);

        if (skipSnapshot.docs.length > 0) {
            const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
            historyQuery = query(
                collection(firestore, 'workHistory'),
                where('userId', '==', userId),
                orderBy('completedAt', 'desc'),
                startAfter(lastDoc),
                limit(itemsPerPage)
            );
        } else {
            // No more documents
            return {
                entries: [],
                totalCount,
                hasMore: false
            };
        }
    }

    const snapshot = await getDocs(historyQuery);
    const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as WorkHistoryEntry));

    return {
        entries,
        totalCount,
        hasMore: totalCount > page * itemsPerPage
    };
};

// Cancel active work with 50% reward penalty
export const cancelWork = async (userId: string): Promise<{
    success: boolean;
    message?: string;
    rewards?: { experience: number; money: number };
}> => {
    const statsRef = doc(firestore, 'playerStats', userId);

    try {
        const result = await runTransaction(firestore, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);

            if (!statsDoc.exists()) {
                return { success: false, message: 'Mängija andmed puuduvad' };
            }

            const stats = statsDoc.data() as PlayerStats;

            if (!stats.activeWork) {
                return { success: false, message: 'Sul pole aktiivset tööd' };
            }

            const workActivity = getWorkActivityById(stats.activeWork.workId);
            if (!workActivity) {
                return { success: false, message: 'Töötegevus ei ole saadaval' };
            }

            // Calculate how much time has passed
            const now = Timestamp.now();
            const startTime = stats.activeWork.startedAt as Timestamp;
            const totalWorkTime = stats.activeWork.totalHours * 3600 * 1000; // Total work time in milliseconds
            const timeWorked = now.toMillis() - startTime.toMillis(); // Time actually worked in milliseconds

            // Calculate hours worked (with minimum of 0.1 hours to give some reward)
            const hoursWorked = Math.max(0.1, timeWorked / (1000 * 3600));

            // Calculate rewards for time actually worked
            const workedRewards = calculateWorkRewards(workActivity, hoursWorked, stats.rank, stats);

            // Apply 50% penalty
            const penalizedRewards = {
                experience: Math.floor(workedRewards.experience * 0.5),
                money: Math.floor(workedRewards.money * 0.5)
            };

            // Calculate new stats
            const newExp = stats.experience + penalizedRewards.experience;
            const newLevel = calculateLevelFromExp(newExp);
            const newTotalWorkedHours = (stats.totalWorkedHours || 0) + hoursWorked;

            // VIP logic for training clicks
            const nonWorkingClicks = stats.isVip ? 100 : 50;

            // Update player stats
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

            // Add money if there's a reward
            if (penalizedRewards.money > 0) {
                updateData.money = (stats.money || 0) + penalizedRewards.money;
            }

            transaction.update(statsRef, updateData);

            // Create work history entry for cancelled work
            const historyEntry: WorkHistoryEntry = {
                userId,
                workId: stats.activeWork.workId,
                workName: `${workActivity.name} (Katkestatud)`,
                prefecture: stats.activeWork.prefecture,
                department: stats.activeWork.department,
                startedAt: stats.activeWork.startedAt,
                completedAt: now,
                hoursWorked: hoursWorked,
                expEarned: penalizedRewards.experience,
                moneyEarned: penalizedRewards.money
            };

            const historyRef = doc(collection(firestore, 'workHistory'));
            transaction.set(historyRef, historyEntry);

            return {
                success: true,
                rewards: penalizedRewards,
                message: 'Töö edukalt katkestatud'
            };
        });

        return result;
    } catch (error: any) {
        console.error('Error cancelling work:', error);
        return {
            success: false,
            message: error.message || 'Töö katkestamine ebaõnnestus'
        };
    }
};