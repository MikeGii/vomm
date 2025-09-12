// src/components/admin/user-management/utils/dataUpdateUtils.ts
import { PlayerStats } from '../../../../types';
import {Timestamp} from "firebase/firestore";

/**
 * Deep comparison to find only changed fields
 */
export const getChangedFields = (original: PlayerStats, edited: PlayerStats): Record<string, any> => {
    const changes: Record<string, any> = {};

    const compareObjects = (orig: any, edit: any, path: string = '') => {
        if (orig === edit) return;

        // Handle null/undefined cases
        if (orig == null && edit != null) {
            changes[path] = edit;
            return;
        }
        if (orig != null && edit == null) {
            changes[path] = null;
            return;
        }

        // Handle primitive values
        if (typeof edit !== 'object' || edit instanceof Date) {
            if (orig !== edit) {
                changes[path] = edit;
            }
            return;
        }

        // Handle objects
        if (typeof edit === 'object' && edit !== null) {
            // Get all keys from both objects
            const allKeys = new Set([
                ...Object.keys(orig || {}),
                ...Object.keys(edit || {})
            ]);

            for (const key of allKeys) {
                const newPath = path ? `${path}.${key}` : key;
                const origValue = orig?.[key];
                const editValue = edit?.[key];

                compareObjects(origValue, editValue, newPath);
            }
        }
    };

    compareObjects(original, edited);
    return changes;
};

/**
 * Convert dot notation paths to nested object for Firestore update
 */
export const convertToFirestoreUpdate = (changes: Record<string, any>): Record<string, any> => {
    const update: Record<string, any> = {};

    for (const [path, value] of Object.entries(changes)) {
        // Special handling for admin permissions
        if (path === 'adminPermissions' && value) {
            update[path] = {
                ...value,
                // Ensure allowedTabs is always saved as an array
                allowedTabs: Array.isArray(value.allowedTabs)
                    ? value.allowedTabs
                    : [],
                // Convert Date to Timestamp for Firebase
                grantedAt: value.grantedAt instanceof Date
                    ? Timestamp.fromDate(value.grantedAt)
                    : Timestamp.now()
            };
        }
        // Handle other Date fields
        else if (value instanceof Date) {
            update[path] = Timestamp.fromDate(value);
        }
        // Use dot notation directly for Firestore
        else {
            update[path] = value;
        }
    }

    return update;
};

/**
 * Validate that changes don't include critical system fields and have valid values
 */
export const validateChanges = (changes: Record<string, any>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Protected system fields that admins shouldn't modify
    const protectedFields = [
        'createdAt',
        'lastSeen',
        'sessionId',
        'activeWork.startTime',
        'activeWork.completionTime',
        'lastHealthUpdate'
    ];

    for (const field of protectedFields) {
        if (field in changes) {
            errors.push(`Kaitstud väli '${field}' ei tohi olla muudetud`);
        }
    }

    // Validate numeric fields
    const numericFields = ['level', 'experience', 'money', 'pollid', 'reputation', 'casesCompleted', 'criminalsArrested', 'totalWorkedHours'];
    for (const field of numericFields) {
        if (field in changes) {
            const value = changes[field];
            if (typeof value === 'number' && (value < 0 || !Number.isFinite(value))) {
                errors.push(`Väli '${field}' peab olema positiivne arv`);
            }
        }
    }

    // Validate rank field
    if ('rank' in changes && changes.rank !== null) {
        const validRanks = [
            'nooreminspektor', 'inspektor', 'vaneminspektor', 'üleminspektor',
            'komissar', 'vanemkomissar', 'politseileitnant', 'politseikapten',
            'politseimajor', 'politseikolonelleitnant'
        ];

        if (changes.rank && !validRanks.includes(changes.rank)) {
            errors.push(`Vigane auaste: ${changes.rank}`);
        }
    }

    // Validate police position
    if ('policePosition' in changes && changes.policePosition !== null) {
        const validPositions = [
            'abipolitseinik', 'kadett', 'patrullpolitseinik', 'uurija', 'kiirreageerija',
            'koerajuht', 'küberkriminalist', 'jälitaja', 'grupijuht_patrol',
            'grupijuht_investigation', 'grupijuht_emergency', 'grupijuht_k9',
            'grupijuht_cyber', 'grupijuht_crimes', 'talituse_juht_patrol',
            'talituse_juht_investigation', 'talituse_juht_emergency', 'talituse_juht_k9',
            'talituse_juht_cyber', 'talituse_juht_crimes'
        ];

        if (changes.policePosition && !validPositions.includes(changes.policePosition)) {
            errors.push(`Vigane positsioon: ${changes.policePosition}`);
        }
    }

    // Validate level constraints
    if ('level' in changes) {
        const level = changes.level;
        if (level < 1 || level > 999) {
            errors.push('Tase peab olema vahemikus 1-999');
        }
    }

    // Validate attribute levels
    const attributeFields = [
        'attributes.strength.level', 'attributes.agility.level', 'attributes.dexterity.level',
        'attributes.endurance.level', 'attributes.intelligence.level', 'attributes.cooking.level',
        'attributes.brewing.level', 'attributes.chemistry.level', 'attributes.sewing.level',
        'attributes.medicine.level', 'attributes.printing.level', 'attributes.lasercutting.level'
    ];

    for (const attrField of attributeFields) {
        if (attrField in changes) {
            const value = changes[attrField];
            if (typeof value === 'number' && (value < 0 || value > 100)) {
                errors.push(`Omaduse tase peab olema vahemikus 0-100: ${attrField.split('.')[1]}`);
            }
        }
    }

    // Validate training clicks
    const trainingFields = [
        'trainingData.remainingClicks',
        'kitchenLabTrainingData.remainingClicks',
        'handicraftTrainingData.remainingClicks'
    ];

    for (const trainingField of trainingFields) {
        if (trainingField in changes) {
            const value = changes[trainingField];
            if (typeof value === 'number' && (value < 0 || value > 100)) {
                errors.push(`Treeningklikid peab olema vahemikus 0-100: ${trainingField.split('.')[0]}`);
            }
        }
    }

    // Validate health values
    if ('health.current' in changes && 'health.max' in changes) {
        const current = changes['health.current'];
        const max = changes['health.max'];
        if (current > max) {
            errors.push('Praegune tervis ei saa olla suurem kui maksimaalne tervis');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};