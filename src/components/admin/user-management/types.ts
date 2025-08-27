// src/components/admin/user-management/types.ts
import {PlayerStats} from "../../../types";

export interface SearchResult {
    user: PlayerStats;
    userId: string;
}

export interface EditableField {
    path: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
}

export interface FieldSection {
    id: string;
    title: string;
    fields: EditableField[];
}