// src/types/bank.ts
import { Timestamp } from 'firebase/firestore';

export interface BankTransaction {
    id?: string;
    fromUserId: string;
    fromBadgeNumber: string;
    fromPlayerName: string;
    toUserId: string;
    toBadgeNumber: string;
    toPlayerName: string;
    amount: number;
    description: string;
    timestamp: Timestamp;
    type?: 'poll_conversion' | 'transfer';
    pollsConverted?: number;
}

export interface BankTransactionFormData {
    targetBadgeNumber: string;
    amount: string;
    description: string;
}

export interface PlayerSearchResult {
    userId: string;
    username: string;
    badgeNumber: string;
    found: boolean;
}