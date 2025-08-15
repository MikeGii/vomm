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

export const getAbilitiesByCompletedCourses = (completedCourses: string[]): Ability[] => {
    return ABILITIES.filter(ability =>
        completedCourses.includes(ability.requiredCourse)
    );
};

export const getAbilityById = (abilityId: string): Ability | undefined => {
    return ABILITIES.find(ability => ability.id === abilityId);
};

// NEW FUNCTION: Calculate total training bonuses for an attribute
export const getTrainingBonusForAttribute = (
    completedCourses: string[],
    attribute: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance'
): number => {
    const abilities = getAbilitiesByCompletedCourses(completedCourses);
    let totalBonus = 0;

    abilities.forEach(ability => {
        if (ability.trainingBonuses) {
            const bonus = ability.trainingBonuses.find(b => b.attribute === attribute);
            if (bonus) {
                totalBonus += bonus.percentage;
            }
        }
    });

    return totalBonus;
};