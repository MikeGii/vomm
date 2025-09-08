import { WorkEvent } from '../../types';
import { PATROL_EVENTS } from './patrolEvents';
import { ACADEMY_EVENTS } from './academyEvents';

// Combine all events
export const ALL_EVENTS: WorkEvent[] = [
    ...PATROL_EVENTS,
    ...ACADEMY_EVENTS
];

// Get events for specific activity type
export const getEventsForActivity = (activityId: string, playerLevel: number): WorkEvent[] => {
    return ALL_EVENTS.filter(event => {
        // Check if event is for this activity type
        if (!event.activityTypes.includes(activityId)) return false;

        // Check level requirement if exists
        if (event.minLevel && playerLevel < event.minLevel) return false;

        return true;
    });
};

// Randomly select an event (70% chance)
export const selectRandomEvent = (activityId: string, playerLevel: number): WorkEvent | null => {
    // 70% chance for event
    if (Math.random() > 0.7) return null;

    const availableEvents = getEventsForActivity(activityId, playerLevel);
    if (availableEvents.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * availableEvents.length);
    return availableEvents[randomIndex];
};