// src/data/workActivities/helpers/playerStatus.ts
import { PlayerStatus } from '../types';

// Helper function to determine player status from police position
export const getPlayerStatus = (
    policePosition: string | null | undefined
): PlayerStatus => {
    if (!policePosition) return 'unknown';

    // Direct mapping for basic positions
    if (policePosition === 'abipolitseinik') return 'abipolitseinik';
    if (policePosition === 'kadett') return 'kadett';
    if (policePosition === 'patrullpolitseinik') return 'patrullpolitseinik';

    // New unit positions
    if (policePosition === 'uurija') return 'uurija';
    if (policePosition === 'kiirreageerija') return 'kiirreageerija';
    if (policePosition === 'koerajuht') return 'koerajuht';
    if (policePosition === 'küberkriminalist') return 'küberkriminalist';
    if (policePosition === 'jälitaja') return 'jälitaja';

    // Group leaders
    if (policePosition === 'grupijuht_patrol') return 'grupijuht_patrol';
    if (policePosition === 'grupijuht_investigation') return 'grupijuht_investigation';
    if (policePosition === 'grupijuht_emergency') return 'grupijuht_emergency';
    if (policePosition === 'grupijuht_k9') return 'grupijuht_k9';
    if (policePosition === 'grupijuht_cyber') return 'grupijuht_cyber';
    if (policePosition === 'grupijuht_crimes') return 'grupijuht_crimes';

    // Higher positions work as patrullpolitseinik for now
    if (policePosition === 'talituse_juht') return 'patrullpolitseinik';

    return 'unknown';
};