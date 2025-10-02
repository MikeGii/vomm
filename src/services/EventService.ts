// Update src/services/EventService.ts

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    limit,
    getDocs,
    Timestamp,
    deleteDoc,
    setDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ActiveWork, WorkEvent, EventChoice, PlayerStats } from '../types';
import { selectRandomEvent } from '../data/events';
import { completeWork } from './WorkService';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

// Trigger event for completed work (70% chance)
export const triggerWorkEvent = async (
    userId: string,
    activeWork: ActiveWork
): Promise<boolean> => {
    // 70% chance for event
    if (Math.random() > 0.7) return false;

    const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
    const statsDoc = await getDoc(doc(firestore, 'playerStats', serverSpecificId));
    if (!statsDoc.exists()) return false;

    const stats = statsDoc.data() as PlayerStats;
    const selectedEvent = selectRandomEvent(activeWork.workId, stats.level);

    if (!selectedEvent) return false;

    // Store active event
    const currentServer = getCurrentServer();
    const eventId = currentServer === 'beta'
        ? `${userId}_${activeWork.workSessionId}`
        : `${userId}_${activeWork.workSessionId}_${currentServer}`;
    const eventRef = doc(firestore, 'activeEvents', eventId);

    await setDoc(eventRef, {
        eventId: selectedEvent.id,
        userId,
        workSessionId: activeWork.workSessionId,
        triggeredAt: Timestamp.now()
    });

    return true;
};

// Get active event for user
export const getActiveEvent = async (userId: string): Promise<{
    event: WorkEvent;
    documentId: string;
} | null> => {
    const eventsQuery = query(
        collection(firestore, 'activeEvents'),
        where('userId', '==', userId),
        limit(10)
    );

    const snapshot = await getDocs(eventsQuery);
    if (snapshot.empty) return null;

    const currentServer = getCurrentServer();

    // Filter for current server's event
    const serverEvent = snapshot.docs.find(doc => {
        const docId = doc.id;
        if (currentServer === 'beta') {
            return !docId.includes('_server');
        } else {
            return docId.endsWith(`_${currentServer}`);
        }
    });

    if (!serverEvent) return null;

    const activeEvent = serverEvent.data();

    // Get event data
    const { ALL_EVENTS } = await import('../data/events');
    const eventData = ALL_EVENTS.find(e => e.id === activeEvent.eventId);

    if (!eventData) return null;

    return {
        event: eventData,
        documentId: serverEvent.id
    };
};

// Process player's event choice
export const processEventChoice = async (
    userId: string,
    eventDocId: string,
    choice: EventChoice
): Promise<boolean> => {
    try {
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
        const statsRef = doc(firestore, 'playerStats', serverSpecificId);
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) return false;

        const stats = statsDoc.data() as PlayerStats;

        // Apply consequences
        const updates: any = {};

        // FIXED: Health calculation without arbitrary cap
        if (choice.consequences.health && stats.health) {
            const newHealthCurrent = stats.health.current + choice.consequences.health;
            const maxHealth = stats.health.max || 100; // Use player's actual max health

            updates['health.current'] = Math.max(0, Math.min(maxHealth, newHealthCurrent));
        }

        if (choice.consequences.money) {
            updates.money = Math.max(0, stats.money + choice.consequences.money);
        }

        if (choice.consequences.reputation) {
            updates.reputation = Math.max(0,
                stats.reputation + choice.consequences.reputation);
        }

        if (choice.consequences.experience) {
            updates.experience = Math.max(0,
                stats.experience + choice.consequences.experience);
        }

        // Apply consequences
        await updateDoc(statsRef, updates);

        // Delete the event
        await deleteDoc(doc(firestore, 'activeEvents', eventDocId));

        // Complete the work
        await completeWork(userId);

        return true;
    } catch (error) {
        console.error('Error processing event:', error);
        return false;
    }
};