// src/data/workActivities/types.ts

// Re-export WorkActivity from main types to keep imports clean
export type { WorkActivity } from '../../types';

// Player status type - extraheerime see workActivities konteksti
export type PlayerStatus =
    | 'kadett'
    | 'abipolitseinik'
    | 'patrullpolitseinik'
    | 'uurija'
    | 'kiirreageerija'
    | 'koerajuht'
    | 'küberkriminalist'
    | 'jälitaja'
    | 'grupijuht_patrol'
    | 'grupijuht_investigation'
    | 'grupijuht_emergency'
    | 'grupijuht_k9'
    | 'grupijuht_cyber'
    | 'grupijuht_crimes'
    | 'unknown';

// Work rewards interface
export interface WorkRewards {
    experience: number;
    money: number;
}