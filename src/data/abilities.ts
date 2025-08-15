// src/data/abilities.ts

export interface Ability {
    id: string;
    name: string;
    description: string;
    icon: string;
    requiredCourse: string;
}

export const ABILITIES: Ability[] = [
    {
        id: 'firearm_carry',
        name: 'Tulirelva kandmine',
        description: 'Õigus kanda ja kasutada tulirelva',
        icon: '🔫',
        requiredCourse: 'firearm_training'
    },
    {
        id: 'speed_measurement',
        name: 'Kiiruse mõõtmine',
        description: 'Oskus kasutada kiirusmõõtmise seadmeid',
        icon: '📡',
        requiredCourse: 'speed_measurement'
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