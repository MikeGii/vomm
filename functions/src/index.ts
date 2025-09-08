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

/**
 * Chat sõnumite puhastamine - kustutab üle 48h vanad sõnumid
 */
const cleanOldChatMessages = async (): Promise<void> => {
    try {
        const cutoffTime = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 tundi tagasi
        );

        // Leia kõik prefecture chat kogumikud
        const prefectureChatsSnapshot = await db.collection('prefectureChat').get();

        let totalDeleted = 0;
        let batch = db.batch();
        let batchCount = 0;

        for (const prefectureDoc of prefectureChatsSnapshot.docs) {
            const prefectureName = prefectureDoc.id;

            // Leia vanad sõnumid selles prefecture's
            const oldMessagesQuery = db
                .collection('prefectureChat')
                .doc(prefectureName)
                .collection('messages')
                .where('timestamp', '<', cutoffTime);

            const oldMessagesSnapshot = await oldMessagesQuery.get();

            for (const messageDoc of oldMessagesSnapshot.docs) {
                batch.delete(messageDoc.ref);
                batchCount++;
                totalDeleted++;

                // Firebase batch limit on 500 - commit ja alusta uut batch-i
                if (batchCount >= 450) {
                    await batch.commit();
                    logger.info(`Committed batch with ${batchCount} deletions`);
                    batch = db.batch(); // Loo uus batch
                    batchCount = 0;
                }
            }

            logger.info(`Found ${oldMessagesSnapshot.size} old messages in ${prefectureName}`);
        }

        // Commit viimane batch kui midagi on järel
        if (batchCount > 0) {
            await batch.commit();
            logger.info(`Committed final batch with ${batchCount} deletions`);
        }

        logger.info(`Successfully deleted ${totalDeleted} old chat messages across all prefectures`);

    } catch (error) {
        logger.error("Error cleaning old chat messages:", error);
        throw error;
    }
};

/**
 * Chat puhastamine - käivitub iga 6 tunni tagant
 */
export const cleanOldMessages = onSchedule(
    {
        schedule: "0 */6 * * *", // Iga 6 tunni tagant
        timeZone: "Europe/Tallinn",
        region: "europe-west1",
    },
    async () => {
        logger.info("Starting chat message cleanup at:", new Date().toISOString());
        await cleanOldChatMessages();
    }
);