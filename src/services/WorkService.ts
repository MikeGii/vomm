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
    getDocs
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {PlayerStats, ActiveWork, WorkHistoryEntry, TrainingData} from '../types';
import { getWorkActivityById, calculateWorkRewards } from '../data/workActivities';

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
        isTutorial: isTutorial
    };

    // Update player stats
    await updateDoc(statsRef, {
        activeWork: activeWork,
        'trainingData.isWorking': true,
        'trainingData.remainingClicks': Math.min(stats.trainingData?.remainingClicks || 10, 10)
    });

    // Store in activeWork collection
    await setDoc(doc(firestore, 'activeWork', `${userId}_${Date.now()}`), activeWork);

    return activeWork;
};

// Check and complete work if time is up
export const checkWorkCompletion = async (userId: string): Promise<boolean> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) return false;

    const stats = statsDoc.data() as PlayerStats;

    if (!stats.activeWork || stats.activeWork.status !== 'in_progress') {
        return false;
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
        // Work is complete
        const workActivity = getWorkActivityById(stats.activeWork.workId);
        if (!workActivity) return false;

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

        const historyRef = await addDoc(collection(firestore, 'workHistory'), historyEntry);

        // Update player stats
        const newExperience = stats.experience + stats.activeWork.expectedExp;
        const newLevel = Math.floor(newExperience / 100) + 1;

        // Since minimum work is 1 hour, training clicks should reset to full 50
        const normalTrainingClicks = 50;

        // Reset training data with new timestamp for the new hour
        const updatedTrainingData: TrainingData = {
            remainingClicks: normalTrainingClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: stats.trainingData?.totalTrainingsDone || 0,
            isWorking: false
        };

        await updateDoc(statsRef, {
            activeWork: null,
            experience: newExperience,
            level: newLevel,
            workHistory: [...(stats.workHistory || []), historyRef.id],
            trainingData: updatedTrainingData
        });

        return true;
    }

    return false;
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