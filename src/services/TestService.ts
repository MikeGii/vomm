// src/services/TestService.ts
import {
    doc,
    getDoc,
    updateDoc,
    Timestamp,
    increment
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Test, ActiveTest, CompletedTest, PlayerStats } from '../types';
import { ALL_TESTS, getTestById } from '../data/tests';

// Get available tests for player (unlocked by completed courses)
export const getAvailableTests = (playerStats: PlayerStats): Test[] => {
    return ALL_TESTS.filter(test => {
        // Don't show already completed tests (they'll be shown differently in UI)
        if (playerStats.completedTests?.includes(test.id)) {
            return true; // Still show but UI will mark as completed
        }

        // Check if required courses are completed
        if (test.requiredCourses && test.requiredCourses.length > 0) {
            const hasRequiredCourse = test.requiredCourses.some(
                courseId => playerStats.completedCourses?.includes(courseId)
            );
            return hasRequiredCourse;
        }

        return true;
    });
};

// Check if test is unlocked for player
export const isTestUnlocked = (test: Test, playerStats: PlayerStats): boolean => {
    if (!test.requiredCourses || test.requiredCourses.length === 0) {
        return true;
    }

    return test.requiredCourses.some(
        courseId => playerStats.completedCourses?.includes(courseId)
    );
};

// Check if test is already completed
export const isTestCompleted = (testId: string, playerStats: PlayerStats): boolean => {
    return playerStats.completedTests?.includes(testId) || false;
};

// Start a test
export const startTest = async (userId: string, testId: string): Promise<ActiveTest> => {
    const test = getTestById(testId);
    if (!test) {
        throw new Error('Test ei ole saadaval');
    }

    // Check if player already has an active test
    const playerStatsRef = doc(firestore, 'playerStats', userId);
    const playerStatsDoc = await getDoc(playerStatsRef);
    const playerStats = playerStatsDoc.data() as PlayerStats;

    if (playerStats.activeTest) {
        throw new Error('Sul on juba käimas üks test!');
    }

    // Check if test is already completed
    if (isTestCompleted(testId, playerStats)) {
        throw new Error('See test on juba lahendatud!');
    }

    // Check if test is unlocked
    if (!isTestUnlocked(test, playerStats)) {
        throw new Error('See test pole veel avatud! Lõpeta nõutavad koolitused.');
    }

    const now = Timestamp.now();
    const timeLimit = test.timeLimit * 60; // Convert minutes to seconds
    const expiresAt = Timestamp.fromMillis(now.toMillis() + (timeLimit * 1000));

    const activeTest: ActiveTest = {
        testId,
        userId,
        startedAt: now,
        expiresAt,
        currentQuestionIndex: 0,
        answers: new Array(test.questions.length).fill(null), // Initialize with null values
        timeRemaining: timeLimit
    };

    // Update player stats with active test
    await updateDoc(playerStatsRef, {
        activeTest: activeTest
    });

    return activeTest;
};

// Submit answer for current question
export const submitAnswer = async (
    userId: string,
    questionIndex: number,
    answerIndex: number
): Promise<void> => {
    const playerStatsRef = doc(firestore, 'playerStats', userId);
    const playerStatsDoc = await getDoc(playerStatsRef);
    const playerStats = playerStatsDoc.data() as PlayerStats;

    if (!playerStats.activeTest) {
        throw new Error('Sul pole käimas ühtegi testi!');
    }

    const test = getTestById(playerStats.activeTest.testId);
    if (!test) {
        throw new Error('Test ei ole saadaval');
    }

    // Check if time hasn't expired (FIXED)
    const now = Date.now();
    let expiresAtMillis: number;

    if (playerStats.activeTest.expiresAt instanceof Timestamp) {
        expiresAtMillis = playerStats.activeTest.expiresAt.toMillis();
    } else if (playerStats.activeTest.expiresAt && typeof playerStats.activeTest.expiresAt === 'object' && 'seconds' in playerStats.activeTest.expiresAt) {
        expiresAtMillis = (playerStats.activeTest.expiresAt as any).seconds * 1000;
    } else if (playerStats.activeTest.expiresAt instanceof Date) {
        expiresAtMillis = playerStats.activeTest.expiresAt.getTime();
    } else {
        expiresAtMillis = new Date(playerStats.activeTest.expiresAt).getTime();
    }

    if (now > expiresAtMillis) {
        // Time expired, finish test automatically
        await finishTest(userId);
        throw new Error('Aeg on läbi! Test on automaatselt lõpetatud.');
    }

    // Validate question index
    if (questionIndex < 0 || questionIndex >= test.questions.length) {
        throw new Error('Vigane küsimuse number');
    }

    // Update the answer
    const updatedAnswers = [...playerStats.activeTest.answers];
    updatedAnswers[questionIndex] = answerIndex;

    await updateDoc(playerStatsRef, {
        'activeTest.answers': updatedAnswers,
        'activeTest.currentQuestionIndex': questionIndex
    });
};

// Get remaining time for active test
export const getRemainingTime = (activeTest: ActiveTest): number => {
    if (!activeTest) return 0;

    const now = Date.now();
    let expiresAtMillis: number;

    // Handle expiresAt as either a Timestamp, Firestore timestamp object, or Date
    if (activeTest.expiresAt instanceof Timestamp) {
        expiresAtMillis = activeTest.expiresAt.toMillis();
    } else if (activeTest.expiresAt && typeof activeTest.expiresAt === 'object' && 'seconds' in activeTest.expiresAt) {
        // Handle Firestore timestamp object
        expiresAtMillis = (activeTest.expiresAt as any).seconds * 1000;
    } else if (activeTest.expiresAt instanceof Date) {
        expiresAtMillis = activeTest.expiresAt.getTime();
    } else {
        expiresAtMillis = new Date(activeTest.expiresAt).getTime();
    }

    return Math.max(0, Math.floor((expiresAtMillis - now) / 1000));
};

// Finish test and calculate results
export const finishTest = async (userId: string): Promise<CompletedTest> => {
    const playerStatsRef = doc(firestore, 'playerStats', userId);
    const playerStatsDoc = await getDoc(playerStatsRef);
    const playerStats = playerStatsDoc.data() as PlayerStats;

    if (!playerStats.activeTest) {
        throw new Error('Sul pole käimas ühtegi testi!');
    }

    const test = getTestById(playerStats.activeTest.testId);
    if (!test) {
        throw new Error('Test ei ole saadaval');
    }

    // Calculate score
    let correctAnswers = 0;
    for (let i = 0; i < test.questions.length; i++) {
        const playerAnswer = playerStats.activeTest.answers[i];
        if (playerAnswer === test.questions[i].correctAnswerIndex) {
            correctAnswers++;
        }
    }

    // Calculate rewards
    const baseExp = correctAnswers * test.baseReward.experience;
    const baseRep = correctAnswers * test.baseReward.reputation;
    let pollid = 0;

    // Perfect score bonus
    if (correctAnswers === test.questions.length) {
        pollid = test.perfectScoreBonus.pollid;
    }

    // Calculate time taken (FIXED)
    let startTimeMillis: number;

    if (playerStats.activeTest.startedAt instanceof Timestamp) {
        startTimeMillis = playerStats.activeTest.startedAt.toMillis();
    } else if (playerStats.activeTest.startedAt && typeof playerStats.activeTest.startedAt === 'object' && 'seconds' in playerStats.activeTest.startedAt) {
        startTimeMillis = (playerStats.activeTest.startedAt as any).seconds * 1000;
    } else if (playerStats.activeTest.startedAt instanceof Date) {
        startTimeMillis = playerStats.activeTest.startedAt.getTime();
    } else {
        startTimeMillis = new Date(playerStats.activeTest.startedAt).getTime();
    }

    const timeTaken = Math.floor((Date.now() - startTimeMillis) / 1000);

    const completedTest: CompletedTest = {
        testId: test.id,
        userId,
        score: correctAnswers,
        totalQuestions: test.questions.length,
        completedAt: Timestamp.now(),
        earnedRewards: {
            experience: baseExp,
            reputation: baseRep,
            pollid: pollid || undefined
        },
        timeTaken
    };

    // Update player stats
    const updatedCompletedTests = playerStats.completedTests ?
        [...playerStats.completedTests, test.id] : [test.id];

    const updateData: any = {
        experience: increment(baseExp),
        reputation: increment(baseRep),
        completedTests: updatedCompletedTests,
        activeTest: null // Remove active test
    };

    // Add pollid if earned (assuming pollid is stored in money field based on your context)
    if (pollid > 0) {
        updateData.money = increment(pollid);
    }

    await updateDoc(playerStatsRef, updateData);

    return completedTest;
};

// Force finish test if time expires (can be called by timer)
export const forceFinishExpiredTest = async (userId: string): Promise<CompletedTest | null> => {
    const playerStatsRef = doc(firestore, 'playerStats', userId);
    const playerStatsDoc = await getDoc(playerStatsRef);
    const playerStats = playerStatsDoc.data() as PlayerStats;

    if (!playerStats.activeTest) {
        return null;
    }

    // Check if test has actually expired (FIXED)
    const now = Date.now();
    let expiresAtMillis: number;

    if (playerStats.activeTest.expiresAt instanceof Timestamp) {
        expiresAtMillis = playerStats.activeTest.expiresAt.toMillis();
    } else if (playerStats.activeTest.expiresAt && typeof playerStats.activeTest.expiresAt === 'object' && 'seconds' in playerStats.activeTest.expiresAt) {
        expiresAtMillis = (playerStats.activeTest.expiresAt as any).seconds * 1000;
    } else if (playerStats.activeTest.expiresAt instanceof Date) {
        expiresAtMillis = playerStats.activeTest.expiresAt.getTime();
    } else {
        expiresAtMillis = new Date(playerStats.activeTest.expiresAt).getTime();
    }

    if (now <= expiresAtMillis) {
        return null; // Test hasn't expired yet
    }

    return await finishTest(userId);
};

// Get test progress (for UI)
export const getTestProgress = (activeTest: ActiveTest): {
    currentQuestion: number;
    totalQuestions: number;
    answeredQuestions: number;
    progressPercentage: number;
} => {
    const answeredCount = activeTest.answers.filter(answer => answer !== null).length;
    const totalQuestions = activeTest.answers.length;

    return {
        currentQuestion: activeTest.currentQuestionIndex + 1,
        totalQuestions,
        answeredQuestions: answeredCount,
        progressPercentage: Math.round((answeredCount / totalQuestions) * 100)
    };
};