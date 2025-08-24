// src/utils/reputationUtils.ts
import { PlayerAttributes } from '../types';

export const calculateAttributeReputation = (attributes: PlayerAttributes | undefined): number => {
    if (!attributes) return 0;

    const attributeLevels = [
        attributes.strength?.level || 0,
        attributes.agility?.level || 0,
        attributes.dexterity?.level || 0,
        attributes.endurance?.level || 0,
        attributes.intelligence?.level || 0
    ];

    const totalAttributeLevels = attributeLevels.reduce((sum, level) => sum + level, 0);

    // Each attribute level gives 2 reputation points
    return totalAttributeLevels * 2;
};

export const calculateTotalReputation = (
    attributes: PlayerAttributes | undefined,
    baseReputation: number = 0
): number => {
    const attributeReputation = calculateAttributeReputation(attributes);
    return attributeReputation + baseReputation;
};