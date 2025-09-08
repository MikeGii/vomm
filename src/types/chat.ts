// src/types/chat.ts
import { Timestamp } from 'firebase/firestore';

export interface PrefectureMessage {
    id: string;
    userId: string;
    username: string;
    prefecture: string;
    message: string;
    timestamp: Timestamp;
    badgeNumber?: string;
}

export interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    prefecture: string;
    currentUserId: string;
    currentUsername: string;
}