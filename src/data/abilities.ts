// src/data/abilities.ts
import { IconType } from 'react-icons';
import { GiPistolGun, GiElectric, GiPoliceCar, GiMachineGunMagazine } from 'react-icons/gi';
import { MdSpeed } from 'react-icons/md';
import { FaTabletAlt } from 'react-icons/fa';
import { GoLaw } from 'react-icons/go';

export interface TrainingBonus {
    attribute: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance';
    percentage: number; // e.g., 0.05 for 5%
}

export interface Ability {
    id: string;
    name: string;
    description: string;
    icon: IconType;
    requiredCourse: string;
    trainingBonuses: TrainingBonus[];
    replacedBy?: string;
}


export const ABILITIES: Ability[] = [
    {
        id: 'firearm_carry_abipolitseinik',
        name: 'Tulirelva kandmine - Abipolitseinik',
        description: 'Õigus kanda ja kasutada tulirelva',
        icon: GiPistolGun,
        requiredCourse: 'firearm_training_abipolitseinik',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.05 },
            { attribute: 'agility', percentage: 0.05 }
        ],
        replacedBy: 'firearm_carry_enhanced'
    },
    {
        id: 'firearm_carry_enhanced',
        name: 'Tulirelva kandmine',
        description: 'Täiustatud tulirelva käsitsemise oskused Glock teenistusrelvaga',
        icon: GiPistolGun,
        requiredCourse: 'firearm_handling_glock',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.10 },
            { attribute: 'agility', percentage: 0.10 }
        ]
    },
    {
        id: 'firearm_carry_r20_automatic',
        name: 'Tugirelva R-20 kandmine',
        description: 'Tugirelva R-20 käsitsemise oskused',
        icon: GiMachineGunMagazine,
        requiredCourse: 'firearm_handling_r20',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.10 },
            { attribute: 'agility', percentage: 0.10 }
        ]
    },
    {
      id: 'electrical_weapon_usage_abipolitseinik',
      name: 'Elektrišokirelva kandmine - Abipoltiseinik',
      description: 'Õigus kanda ja kasutada elektrišokirelva',
      icon: GiElectric,
      requiredCourse: 'electrical_shock_weapon_abipolitseinik',
      trainingBonuses: [
          { attribute: 'dexterity', percentage: 0.02 },
          { attribute: 'agility', percentage: 0.02 },
      ]
    },
    {
        id: 'speed_measurement_abipolitseinik',
        name: 'Kiiruse mõõtmine - Abipolitseinik',
        description: 'Oskus kasutada kiirusmõõtmise seadmeid',
        icon: MdSpeed,
        requiredCourse: 'speed_measurement_abipolitseinik',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.05 }
        ]
    },
    {
        id: 'police_e_politsei_usage_abipolitseinik',
        name: 'E-Polistei kasutamine - Abipolitseinik',
        description: 'Oskus ja õigus kasutada Apollot',
        icon: FaTabletAlt,
        requiredCourse: 'police_apollo_usage_abipolitseinik',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.05 }
        ]
    },
    {
        id: 'police_car_usage_right_abipolitseinik',
        name: 'Alarmsõiduki juhtimisõigus - Abipolitseinik',
        description: 'Õigus ja oskus juhtida ohutult alarmsõidukit teenistusülesandeid täites',
        icon: GiPoliceCar,
        requiredCourse: 'police_car_training_abipolitseinik',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.05 }
        ]
    },
    {
        id: 'law_fundamentals_police',
        name: 'Süüteomenetluse algteadmised',
        description: 'Oled omandanud süüteomenetluses peamised baasteadmised ja oskad orienteeruda seadustes',
        icon: GoLaw,
        requiredCourse: 'law_studies_curriculum',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.10 }
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