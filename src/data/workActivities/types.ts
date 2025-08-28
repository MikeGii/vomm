// src/data/workActivities/types.ts

// Re-export WorkActivity from main types to keep imports clean
export type { WorkActivity } from '../../types';

// Player status type - extraheerime see workActivities konteksti
export type PlayerStatus =
    | 'unknown'
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
    | 'talituse_juht_patrol'
    | 'talituse_juht_investigation'
    | 'talituse_juht_emergency'
    | 'talituse_juht_k9'
    | 'talituse_juht_cyber'
    | 'talituse_juht_crimes';

// Work rewards interface
export interface WorkRewards {
    experience: number;
    money: number;
}