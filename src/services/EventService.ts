import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    deleteDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
    ActiveEvent,
    EventHistoryEntry,
    WorkEvent,
    EventChoice,
    EventConsequences
} from '../types/events.types';
import { PlayerStats } from '../types';
import { selectRandomEvent } from '../data/events';

// Create an active event for a work session
export const createActiveEvent = async (
    userId: string,
    workSessionId: string,
    workActivityId: string,
    playerLevel: number
): Promise<ActiveEvent | null> => {
    // Select random event (70% chance)
    const selectedEvent = selectRandomEvent(workActivityId, playerLevel);
    if (!selectedEvent) return null;

    const activeEvent: ActiveEvent = {
        eventId: selectedEvent.id,
        userId: userId,
        workSessionId: workSessionId,
        triggeredAt: Timestamp.now(),
        status: 'pending'
    };

    // Store in activeEvents collection
    const eventRef = doc(firestore, 'activeEvents', `${userId}_${workSessionId}`);
    await setDoc(eventRef, activeEvent);

    return activeEvent;
};

// Get pending event for user
export const getPendingEvent = async (userId: string): Promise<{
    activeEvent: ActiveEvent;
    eventData: WorkEvent;
} | null> => {
    try {
        // Query for pending events
        const eventsQuery = query(
            collection(firestore, 'activeEvents'),
            where('userId', '==', userId),
            where('status', '==', 'pending'),
            limit(1)
        );

        const snapshot = await getDocs(eventsQuery);
        if (snapshot.empty) return null;

        const activeEvent = snapshot.docs[0].data() as ActiveEvent;

        // Get the event data
        const { ALL_EVENTS } = await import('../data/events');
        const eventData = ALL_EVENTS.find(e => e.id === activeEvent.eventId);

        if (!eventData) {
            console.error('Event data not found for:', activeEvent.eventId);
            return null;
        }

        return { activeEvent, eventData };
    } catch (error) {
        console.error('Error getting pending event:', error);
        return null;
    }
};

// Apply event consequences to player stats
const applyConsequences = (
    stats: PlayerStats,
    consequences: EventConsequences
): Partial<PlayerStats> => {
    const updates: Partial<PlayerStats> = {};

    // Apply health change (minimum 0)
    if (consequences.health !== undefined && stats.health) {
        const newHealth = Math.max(0, stats.health.current + consequences.health);
        updates.health = {
            ...stats.health,
            current: newHealth
        };
    }

    // Apply money change (minimum 0)
    if (consequences.money !== undefined) {
        updates.money = Math.max(0, stats.money + consequences.money);
    }

    // Apply reputation change (minimum 0)
    if (consequences.reputation !== undefined) {
        updates.reputation = Math.max(0, stats.reputation + consequences.reputation);
    }

    // Apply experience change
    if (consequences.experience !== undefined) {
        updates.experience = stats.experience + Math.max(0, consequences.experience);
    }

    return updates;
};

// Process event choice
export const processEventChoice = async (
    userId: string,
    workSessionId: string,
    eventData: WorkEvent,
    choice: EventChoice,
    workActivityName: string
): Promise<boolean> => {
    try {
        // Get current player stats
        const statsRef = doc(firestore, 'playerStats', userId);
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) {
            console.error('Player stats not found');
            return false;
        }

        const currentStats = statsDoc.data() as PlayerStats;

        // Apply consequences
        const updates = applyConsequences(currentStats, choice.consequences);

        // Set lastHealthUpdate when health changes
        if (choice.consequences.health !== undefined) {
            updates.lastHealthUpdate = Timestamp.now();
        }

        // Update player stats
        await updateDoc(statsRef, updates);

        // Mark event as completed
        const eventRef = doc(firestore, 'activeEvents', `${userId}_${workSessionId}`);
        await updateDoc(eventRef, {
            status: 'completed',
            respondedAt: Timestamp.now(),
            choiceId: choice.id
        });

        // Add to event history
        const historyEntry: EventHistoryEntry = {
            userId: userId,
            eventId: eventData.id,
            eventTitle: eventData.title,
            choiceId: choice.id,
            choiceText: choice.text,
            consequences: choice.consequences,
            workActivityId: workSessionId,
            workActivityName: workActivityName,
            completedAt: Timestamp.now()
        };

        await addDoc(collection(firestore, 'eventHistory'), historyEntry);

        // Clean up the active event
        await deleteDoc(eventRef);

        return true;
    } catch (error) {
        console.error('Error processing event choice:', error);
        return false;
    }
};

// Get event history for user
export const getEventHistory = async (
    userId: string,
    limitCount: number = 10
): Promise<EventHistoryEntry[]> => {
    try {
        const historyQuery = query(
            collection(firestore, 'eventHistory'),
            where('userId', '==', userId),
            orderBy('completedAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(historyQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as EventHistoryEntry));
    } catch (error) {
        console.error('Error fetching event history:', error);
        return [];
    }
};

// Check if user has pending event (for redirect logic)
export const checkForPendingEvent = async (userId: string): Promise<boolean> => {
    const pendingEvent = await getPendingEvent(userId);
    return pendingEvent !== null;
};