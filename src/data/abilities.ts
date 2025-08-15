// src/data/abilities.ts
export interface TrainingBonus {
    attribute: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance';
    percentage: number; // e.g., 0.05 for 5%
}

export interface Ability {
    id: string;
    name: string;
    description: string;
    icon: string;
    requiredCourse: string;
    trainingBonuses: TrainingBonus[];
    replacedBy?: string;
}


export const ABILITIES: Ability[] = [
    {
        id: 'firearm_carry_abipolitseinik',
        name: 'Tulirelva kandmine - Abipolitseinik',
        description: 'Õigus kanda ja kasutada tulirelva',
        icon: '🔫',
        requiredCourse: 'firearm_training_abipolitseinik',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.05 },
            { attribute: 'agility', percentage: 0.05 }
        ],
        replacedBy: 'firearm_carry_enhanced'  // ADD THIS
    },
    {
        id: 'firearm_carry_enhanced',
        name: 'Tulirelva kandmine',
        description: 'Täiustatud tulirelva käsitsemise oskused Glock teenistusrelvaga',
        icon: '🔫',
        requiredCourse: 'firearm_handling_glock',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.10 },
            { attribute: 'agility', percentage: 0.10 }
        ]
    },
    {
        id: 'speed_measurement_abipolitseinik',
        name: 'Kiiruse mõõtmine - Abipolitseinik',
        description: 'Oskus kasutada kiirusmõõtmise seadmeid',
        icon: '📡',
        requiredCourse: 'speed_measurement_abipolitseinik',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.05 }
        ]
    }
];

// Universal function to get active abilities (handles replacements automatically)
export const getActiveAbilities = (completedCourses: string[]): Ability[] => {
    // Get all abilities that the player has earned through courses
    const earnedAbilities = ABILITIES.filter(ability =>
        completedCourses.includes(ability.requiredCourse)
    );

    // Filter out abilities that have been replaced
    const activeAbilities = earnedAbilities.filter(ability => {
        // Check if this ability has been replaced
        if (ability.replacedBy) {
            // Check if the player has the replacement ability
            return !earnedAbilities.some(a => a.id === ability.replacedBy);
        }
        return true;
    });

    return activeAbilities;
};

// Keep the old function for backward compatibility but use the new logic
export const getAbilitiesByCompletedCourses = (completedCourses: string[]): Ability[] => {
    return getActiveAbilities(completedCourses);
};

// Get training bonus considering ability replacements
export const getTrainingBonusForAttribute = (
    completedCourses: string[],
    attribute: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance'
): number => {
    const activeAbilities = getActiveAbilities(completedCourses);
    let totalBonus = 0;

    activeAbilities.forEach(ability => {
        if (ability.trainingBonuses) {
            const bonus = ability.trainingBonuses.find(b => b.attribute === attribute);
            if (bonus) {
                totalBonus += bonus.percentage;
            }
        }
    });

    return totalBonus;
};