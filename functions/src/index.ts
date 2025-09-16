import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {logger} from "firebase-functions";

// Initialize Firebase Admin
admin.initializeApp();

const CRIME_COLLECTION = "departmentCrimeStats";
const DAILY_CRIME_INCREASE = 8; // 8% per day
const MAX_CRIME_LEVEL = 100;

/**
 * Daily crime increase logic (same as your CrimeService.ts)
 */
const increaseDailyCrime = async (): Promise<void> => {
    try {
        const crimeCollection = admin.firestore().collection(CRIME_COLLECTION);
        const querySnapshot = await crimeCollection.get();

        const batch = admin.firestore().batch();
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
        const crimeCollection = admin.firestore().collection(CRIME_COLLECTION);
        const querySnapshot = await crimeCollection.get();

        const batch = admin.firestore().batch();
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

const cleanOldChatMessages = async (): Promise<void> => {
    try {
        const now = Date.now();
        const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000);

        logger.info(`Current time: ${new Date(now).toISOString()}`);
        logger.info(`Cutoff time: ${new Date(fortyEightHoursAgo).toISOString()}`);

        const firestore = admin.firestore();

        // Direct approach: check known prefecture names from your ChatService
        const knownPrefectures = ['Ida prefektuur', 'Lääne prefektuur', 'Põhja prefektuur'];

        let totalDeleted = 0;
        let totalChecked = 0;
        let batch = firestore.batch();
        let batchCount = 0;

        for (const prefecture of knownPrefectures) {
            try {
                logger.info(`Processing prefecture: ${prefecture}`);

                // Direct access to messages subcollection
                const messagesRef = firestore
                    .collection('prefectureChat')
                    .doc(prefecture)
                    .collection('messages');

                // Get all messages (older first for deletion)
                const messagesQuery = messagesRef
                    .orderBy('timestamp', 'asc')
                    .limit(1000);

                const messagesSnapshot = await messagesQuery.get();
                totalChecked += messagesSnapshot.size;

                logger.info(`Prefecture ${prefecture}: found ${messagesSnapshot.size} messages`);

                let deletedFromThisPrefecture = 0;

                for (const messageDoc of messagesSnapshot.docs) {
                    const messageData = messageDoc.data();

                    if (messageData.timestamp) {
                        let messageTimeMs;

                        if (messageData.timestamp.toMillis) {
                            messageTimeMs = messageData.timestamp.toMillis();
                        } else if (messageData.timestamp.toDate) {
                            messageTimeMs = messageData.timestamp.toDate().getTime();
                        } else if (messageData.timestamp._seconds) {
                            messageTimeMs = messageData.timestamp._seconds * 1000;
                        } else {
                            messageTimeMs = new Date(messageData.timestamp).getTime();
                        }

                        if (messageTimeMs < fortyEightHoursAgo) {
                            batch.delete(messageDoc.ref);
                            batchCount++;
                            deletedFromThisPrefecture++;
                            totalDeleted++;

                            if (batchCount >= 450) {
                                await batch.commit();
                                logger.info(`Committed batch with ${batchCount} deletions`);
                                batch = firestore.batch();
                                batchCount = 0;
                            }
                        }
                    }
                }

                logger.info(`Prefecture ${prefecture}: deleted ${deletedFromThisPrefecture} old messages`);

            } catch (prefectureError) {
                logger.error(`Error processing ${prefecture}:`, prefectureError);
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            logger.info(`Committed final batch with ${batchCount} deletions`);
        }

        logger.info(`Cleanup completed: deleted ${totalDeleted} old messages (checked ${totalChecked} total)`);

    } catch (error) {
        logger.error("Error cleaning old chat messages:", error);
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