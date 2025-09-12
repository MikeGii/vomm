// src/types/updates.ts
import { Timestamp } from 'firebase/firestore';

export interface DatabaseUpdate {
    id?: string;
    title: string;
    content: string; // Rich text content (HTML)
    isNew: boolean;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    createdBy: string; // User ID who created
    updatedBy?: string; // User ID who last updated
}

export interface CreateUpdateData {
    title: string;
    content: string;
    isNew: boolean;
}

export interface UpdateUpdateData {
    title?: string;
    content?: string;
    isNew?: boolean;
}