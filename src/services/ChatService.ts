// src/services/ChatService.ts
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    doc,
    getDoc,
    startAfter,
    getDocs
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PrefectureMessage } from '../types/chat';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

const MESSAGES_PER_PAGE = 20;

/**
 * Saada sõnum prefecture chat-i
 */
export const sendPrefectureMessage = async (
    userId: string,
    username: string,
    prefecture: string,
    message: string,
    badgeNumber?: string
): Promise<void> => {
    try {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || trimmedMessage.length === 0) {
            throw new Error('Sõnum ei tohi olla tühi');
        }

        if (trimmedMessage.length > 500) {
            throw new Error('Sõnum on liiga pikk (max 500 tähemärki)');
        }

        const currentServer = getCurrentServer();

        const messagesRef = currentServer === 'beta'
            ? collection(firestore, 'prefectureChat', prefecture, 'messages')
            : collection(firestore, 'prefectureChat', `${prefecture}_${currentServer}`, 'messages');

        await addDoc(messagesRef, {
            userId: getServerSpecificId(userId, currentServer), // Changed this line
            username,
            prefecture,
            message: trimmedMessage,
            timestamp: Timestamp.now(),
            badgeNumber: badgeNumber || null,
            server: currentServer // Added this line
        });
    } catch (error) {
        console.error('Viga sõnumi saatmisel:', error);
        throw error;
    }
};

/**
 * Kuula viimaste sõnumite reaalajas uuendusi
 */
export const listenToRecentMessages = (
    prefecture: string,
    callback: (messages: PrefectureMessage[]) => void
): (() => void) => {
    const currentServer = getCurrentServer();

    const messagesRef = currentServer === 'beta'
        ? collection(firestore, 'prefectureChat', prefecture, 'messages')
        : collection(firestore, 'prefectureChat', `${prefecture}_${currentServer}`, 'messages');

    // Võta ainult viimased 20 sõnumit reaalajas jälgimiseks
    const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages: PrefectureMessage[] = [];

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                userId: data.userId,
                username: data.username,
                prefecture: data.prefecture,
                message: data.message,
                timestamp: data.timestamp,
                badgeNumber: data.badgeNumber
            });
        });

        // Pööra järjestus ümber - vanemad üles, uuemad alla
        callback(messages.reverse());
    }, (error) => {
        console.error('Viga sõnumite kuulamisel:', error);
        callback([]);
    });

    return unsubscribe;
};

/**
 * Laadi vanemaid sõnumeid (pagination)
 */
export const loadOlderMessages = async (
    prefecture: string,
    oldestMessage: PrefectureMessage
): Promise<PrefectureMessage[]> => {
    try {
        const currentServer = getCurrentServer();

        const messagesRef = currentServer === 'beta'
            ? collection(firestore, 'prefectureChat', prefecture, 'messages')
            : collection(firestore, 'prefectureChat', `${prefecture}_${currentServer}`, 'messages');

        const q = query(
            messagesRef,
            orderBy('timestamp', 'desc'),
            startAfter(oldestMessage.timestamp), // Alusta sellest sõnumist
            limit(MESSAGES_PER_PAGE)
        );

        const snapshot = await getDocs(q);
        const messages: PrefectureMessage[] = [];

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                userId: data.userId,
                username: data.username,
                prefecture: data.prefecture,
                message: data.message,
                timestamp: data.timestamp,
                badgeNumber: data.badgeNumber
            });
        });

        return messages.reverse(); // Vanemad üles, uuemad alla
    } catch (error) {
        console.error('Viga vanemate sõnumite laadimisel:', error);
        return [];
    }
};

/**
 * Kontrolli kas kasutajal on õigus prefecture chat-iga liituda
 */
export const canAccessPrefectureChat = async (userId: string, prefecture: string): Promise<boolean> => {
    try {
        // UPDATED: Use server-specific player stats document
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
        const statsRef = doc(firestore, 'playerStats', serverSpecificId);
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) return false;

        const stats = statsDoc.data();
        return stats.prefecture === prefecture;
    } catch (error) {
        console.error('Viga juurdepääsu kontrollimisel:', error);
        return false;
    }
};