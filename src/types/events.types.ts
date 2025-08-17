import { Timestamp } from 'firebase/firestore';

export interface EventConsequences {
    health?: number;
    money?: number;
    reputation?: number;
    experience?: number;
}

export interface EventChoice {
    id: string;
    text: string;
    consequences: EventConsequences;
    resultText: string; // Text shown after choice is made
}

export interface WorkEvent {
    id: string;
    title: string;
    description: string;
    choices: EventChoice[];
    activityTypes: string[]; // Which work activities can trigger this event
    minLevel?: number; // Optional minimum level requirement
}

export interface ActiveEvent {
    eventId: string;
    userId: string;
    workSessionId: string; // Links to the work session
    triggeredAt: Timestamp;
    respondedAt?: Timestamp;
    choiceId?: string;
    status: 'pending' | 'completed';
}

export interface EventHistoryEntry {
    id?: string;
    userId: string;
    eventId: string;
    eventTitle: string;
    choiceId: string;
    choiceText: string;
    consequences: EventConsequences;
    workActivityId: string;
    workActivityName: string;
    completedAt: Timestamp;
}