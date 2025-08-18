// src/services/WorkService.ts
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    Timestamp,
    query,
    where,
    orderBy,
    limit,
    getDocs, deleteDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {PlayerStats, ActiveWork, WorkHistoryEntry, TrainingData} from '../types';
import { getWorkActivityById, calculateWorkRewards } from '../data/workActivities';
import {calculateLevelFromExp} from "./PlayerService";
import { createActiveEvent, getPendingEvent} from "./EventService";

// Start a work session
export const startWork = async (
    userId: string,
    workId: string,
    prefecture: string,
    department: string,
    hours: number,
    isTutorial: boolean = false
): Promise<ActiveWork> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Mängija andmed puuduvad');
    }

    const stats = statsDoc.data() as PlayerStats;

    // Check if already working
    if (stats.activeWork && stats.activeWork.status === 'in_progress') {
        throw new Error('Sa juba töötad! Oota kuni praegune töö lõppeb.');
    }

    // Check if has active course
    if (stats.activeCourse && stats.activeCourse.status === 'in_progress') {
        throw new Error('Sa ei saa töötada koolituse ajal!');
    }

    // Check health
    if (!stats.health || stats.health.current < 50) {
        throw new Error('Su tervis on liiga madal töötamiseks! Minimaalne tervis on 50.');
    }

    // Get work activity
    const workActivity = getWorkActivityById(workId);
    if (!workActivity) {
        throw new Error('Töötegevus ei ole saadaval');
    }

    // Calculate rewards
    const expectedExp = calculateWorkRewards(workActivity, hours);

    // Calculate end time
    const now = Timestamp.now();
    const duration = isTutorial ? 20 : (hours * 3600); // 20 seconds for tutorial, otherwise hours in seconds
    const endsAtMillis = now.toMillis() + (duration * 1000);
    const endsAt = Timestamp.fromMillis(endsAtMillis);

    // Generate work session ID
    const timestamp = Date.now();
    const workSessionId = `${userId}_${timestamp}`;

    const activeWork: ActiveWork = {
        workId: workId,
        userId: userId,
        prefecture: prefecture,
        department: department,
        startedAt: now,
        endsAt: endsAt,
        totalHours: hours,
        expectedExp: expectedExp,
        status: 'in_progress',
        isTutorial: isTutorial,
        workSessionId: workSessionId
    };

    // Update player stats
    await updateDoc(doc(firestore, 'playerStats', userId), {
        activeWork: activeWork,
        'trainingData.isWorking': true,
        'trainingData.remainingClicks': Math.min(stats.trainingData?.remainingClicks || 10, 10)
    });

    // Store in activeWork collection
    await setDoc(doc(firestore, 'activeWork', workSessionId), activeWork);

    return activeWork;
};

// Check and complete work if time is up
export const checkWorkCompletion = async (
    userId: string
): Promise<{ completed: boolean; hasPendingEvent: boolean }> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        return { completed: false, hasPendingEvent: false };
    }

    const stats = statsDoc.data() as PlayerStats;

    if (!stats.activeWork || stats.activeWork.status !== 'in_progress') {
        // Also check for stuck 'pending' status
        if (stats.activeWork?.status === 'pending') {
            // Check if there's actually a pending event
            const pendingEvent = await getPendingEvent(userId);
            if (!pendingEvent) {
                // No event exists, complete the work
                console.log('Recovering orphaned pending work...');
                await completeWork(userId, stats);
                return { completed: true, hasPendingEvent: false };
            }
            return { completed: false, hasPendingEvent: true };
        }
        return { completed: false, hasPendingEvent: false };
    }

    const now = Timestamp.now();

    // Handle endsAt timestamp
    let endsAtMillis: number;
    if (stats.activeWork.endsAt instanceof Timestamp) {
        endsAtMillis = stats.activeWork.endsAt.toMillis();
    } else if (stats.activeWork.endsAt && typeof stats.activeWork.endsAt === 'object' && 'seconds' in stats.activeWork.endsAt) {
        endsAtMillis = stats.activeWork.endsAt.seconds * 1000;
    } else {
        endsAtMillis = new Date(stats.activeWork.endsAt).getTime();
    }

    if (now.toMillis() >= endsAtMillis) {
        // Work time is complete, check for pending event first
        let pendingEventResult = await getPendingEvent(userId);

        // If no pending event exists yet, create one now (70% chance)
        if (!pendingEventResult && !stats.activeWork.isTutorial) {
            const workSessionId = stats.activeWork.workSessionId || `${userId}_${Date.now()}`;
            const eventCreated = await createActiveEvent(
                userId,
                workSessionId,
                stats.activeWork.workId,
                stats.level
            );

            if (eventCreated) {
                // Event was created, check again for pending event
                pendingEventResult = await getPendingEvent(userId);
            }
        }

        if (pendingEventResult) {
            // Has pending event, mark work as pending with a transaction to avoid race conditions
            try {
                await updateDoc(statsRef, {
                    'activeWork.status': 'pending'
                });
            } catch (error) {
                console.error('Error updating work status to pending:', error);
            }
            return { completed: false, hasPendingEvent: true };
        }

        // No pending event, complete the work
        await completeWork(userId, stats);
        return { completed: true, hasPendingEvent: false };
    }

    return { completed: false, hasPendingEvent: false };
};

export const validateAndFixWorkState = async (userId: string): Promise<void> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) return;

    const stats = statsDoc.data() as PlayerStats;

    if (!stats.activeWork) return;

    // Check various invalid states
    if (stats.activeWork.status === 'pending') {
        // Check if event exists
        const pendingEvent = await getPendingEvent(userId);

        if (!pendingEvent) {
            console.log('Found pending work without event, completing...');
            await completeWork(userId, stats);
            return;
        }
    }

    if (stats.activeWork.status === 'in_progress') {
        // Check if time is up
        const remaining = getRemainingWorkTime(stats.activeWork);

        if (remaining <= 0) {
            // Time is up but work still in progress
            const result = await checkWorkCompletion(userId);

            if (!result.hasPendingEvent && !result.completed) {
                console.log('Found expired work, completing...');
                await completeWork(userId, stats);
            }
        }
    }

    // Check for work that's been active too long (failsafe)
    if (stats.activeWork.startedAt) {
        const startTime = stats.activeWork.startedAt instanceof Timestamp
            ? stats.activeWork.startedAt.toMillis()
            : new Date(stats.activeWork.startedAt).getTime();

        const maxDuration = (stats.activeWork.totalHours * 3600 * 1000) + (5 * 60 * 1000); // Add 5 min buffer
        const now = Date.now();

        if (now - startTime > maxDuration) {
            console.log('Found stuck work (exceeded max duration), completing...');
            await completeWork(userId, stats);
        }
    }
};

// Update completeWorkAfterEvent to be idempotent
export const completeWorkAfterEvent = async (userId: string): Promise<boolean> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) return false;

    const stats = statsDoc.data() as PlayerStats;

    // Only complete if work exists and is in pending status
    if (!stats.activeWork || stats.activeWork.status !== 'pending') {
        console.log('No pending work to complete');
        return false;
    }

    await completeWork(userId, stats);
    return true;
};

// Extract work completion logic to separate function
const completeWork = async (userId: string, stats: PlayerStats): Promise<void> => {
    if (!stats.activeWork) return;

    const workActivity = getWorkActivityById(stats.activeWork.workId);
    if (!workActivity) return;

    if (stats.activeWork.userId && stats.activeWork.userId !== userId) {
        console.error('Work session does not belong to this user!');
        return;
    }

    // Add to work history
    const historyEntry: WorkHistoryEntry = {
        userId: userId,
        workId: stats.activeWork.workId,
        workName: workActivity.name,
        prefecture: stats.activeWork.prefecture,
        department: stats.activeWork.department,
        hoursWorked: stats.activeWork.totalHours,
        expEarned: stats.activeWork.expectedExp,
        completedAt: new Date()
    };

    await addDoc(collection(firestore, 'workHistory'), historyEntry);

    // Update player stats
    const newExperience = stats.experience + stats.activeWork.expectedExp;
    const newLevel = calculateLevelFromExp(newExperience);

    // Calculate new total worked hours
    const newTotalWorkedHours = (stats.totalWorkedHours || 0) + stats.activeWork.totalHours;

    // Reset training data
    const normalTrainingClicks = 50;
    const updatedTrainingData: TrainingData = {
        remainingClicks: normalTrainingClicks,
        lastResetTime: Timestamp.now(),
        totalTrainingsDone: stats.trainingData?.totalTrainingsDone || 0,
        isWorking: false
    };

    // Clean up active work from collection
    if (stats.activeWork.workSessionId) {
        try {
            await deleteDoc(doc(firestore, 'activeWork', stats.activeWork.workSessionId));
        } catch (error) {
            console.error('Error deleting active work document:', error);
        }
    }

    // Update player stats
    await updateDoc(doc(firestore, 'playerStats', userId), {
        experience: newExperience,
        level: newLevel,
        totalWorkedHours: newTotalWorkedHours,
        activeWork: null,
        trainingData: updatedTrainingData
    });
};

// Get remaining time for active work
export const getRemainingWorkTime = (activeWork: ActiveWork | any): number => {
    if (!activeWork || activeWork.status !== 'in_progress') {
        return 0;
    }

    const now = Date.now();

    let endsAtMillis: number;
    if (activeWork.endsAt instanceof Timestamp) {
        endsAtMillis = activeWork.endsAt.toMillis();
    } else if (activeWork.endsAt && typeof activeWork.endsAt === 'object' && 'seconds' in activeWork.endsAt) {
        endsAtMillis = activeWork.endsAt.seconds * 1000;
    } else {
        endsAtMillis = new Date(activeWork.endsAt).getTime();
    }

    return Math.max(0, Math.floor((endsAtMillis - now) / 1000));
};

// Get work history for a player
export const getWorkHistory = async (userId: string, limitCount: number = 10): Promise<WorkHistoryEntry[]> => {
    const q = query(
        collection(firestore, 'workHistory'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const history: WorkHistoryEntry[] = [];

    querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as WorkHistoryEntry);
    });

    return history;
};