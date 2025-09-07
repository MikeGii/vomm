import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {logger} from "firebase-functions";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const CRIME_COLLECTION = "departmentCrimeStats";
const DAILY_CRIME_INCREASE = 8; // 8% per day
const MAX_CRIME_LEVEL = 100;

/**
 * Daily crime increase logic (same as your CrimeService.ts)
 */
const increaseDailyCrime = async (): Promise<void> => {
    try {
        const crimeCollection = db.collection(CRIME_COLLECTION);
        const querySnapshot = await crimeCollection.get();

        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();

        querySnapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const currentLevel = data.currentCrimeLevel + DAILY_CRIME_INCREASE;
            const newLevel = Math.min(MAX_CRIME_LEVEL, currentLevel);

            batch.update(docSnap.ref, {
                currentCrimeLevel: newLevel,
                lastDailyUpdate: now,
                lastUpdated: now,
            });
        });

        await batch.commit();
        logger.info("Daily crime increase completed for all departments");
    } catch (error) {
        logger.error("Error increasing daily crime:", error);
        throw error;
    }
};

/**
 * Monthly reset logic (same as your CrimeService.ts)
 */
const monthlyResetCrime = async (): Promise<void> => {
    try {
        const crimeCollection = db.collection(CRIME_COLLECTION);
        const querySnapshot = await crimeCollection.get();

        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();

        querySnapshot.docs.forEach((docSnap) => {
            batch.update(docSnap.ref, {
                currentCrimeLevel: 50,
                monthlyResetDate: now,
                totalWorkHoursThisMonth: 0,
                lastDailyUpdate: now,
                lastUpdated: now,
            });
        });

        await batch.commit();
        logger.info("Monthly crime reset completed for all departments");
    } catch (error) {
        logger.error("Error resetting monthly crime:", error);
        throw error;
    }
};

/**
 * Scheduled function - runs every day at 00:01 Estonian time
 */
export const dailyCrimeIncrease = onSchedule(
    {
        schedule: "1 0 * * *",
        timeZone: "Europe/Tallinn",
        region: "europe-west1",
    },
    async () => {
        logger.info("Starting daily crime increase at:",
            new Date().toISOString());
        await increaseDailyCrime();
    }
);

/**
 * Monthly reset - runs on 1st day of month at 00:01
 */
export const monthlyCrimeReset = onSchedule(
    {
        schedule: "1 0 1 * *",
        timeZone: "Europe/Tallinn",
        region: "europe-west1",
    },
    async () => {
        logger.info("Starting monthly crime reset at:",
            new Date().toISOString());
        await monthlyResetCrime();
    }
);