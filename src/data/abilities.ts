// src/data/abilities.ts
import { IconType } from 'react-icons';
import {GiPistolGun, GiElectric, GiPoliceCar, GiMachineGunMagazine, GiSniffingDog, GiStrong} from 'react-icons/gi';
import { MdSpeed } from 'react-icons/md';
import {FaTabletAlt, FaMedkit, FaClinicMedical} from 'react-icons/fa';
import {FaComputer, FaPeopleGroup, FaPeopleLine, FaShieldDog} from 'react-icons/fa6';
import { GoLaw } from 'react-icons/go';
import {PiDetectiveBold} from "react-icons/pi";

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
      ],
        replacedBy: 'electrical_weapon_usage_police'

    },
    {
        id: 'electrical_weapon_usage_police',
        name: 'Elektrišokirelva oskuslik käsitsemine',
        description: 'Elektrišokirelva täiendkoolitus paremaks käsitsemiseks',
        icon: GiElectric,
        requiredCourse: 'self-defence_training',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.05 },
            { attribute: 'agility', percentage: 0.05 },
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
        ],
        replacedBy: 'speed_measurement_police'
    },
    {
        id: 'speed_measurement_police',
        name: 'Oskuslik kiiruse mõõtja pädevus',
        description: 'Oskus kasutada kõiki kiiruse mõõtmise seadeid',
        icon: MdSpeed,
        requiredCourse: 'response_training',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.1 }
        ]
    },
    {
        id: 'police_e_politsei_usage_abipolitseinik',
        name: 'E-Politsei kasutamine - Abipolitseinik',
        description: 'Oskus ja õigus kasutada Apollot',
        icon: FaTabletAlt,
        requiredCourse: 'police_apollo_usage_abipolitseinik',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.05 }
        ],
        replacedBy: 'police_e_politsei_usage_police'
    },
    {
        id: 'police_e_politsei_usage_police',
        name: 'Politsei andmebaaside kasutamise oskus',
        description: 'Oskus ja õigus kasutada kohusetundlikult politsei andmebaase',
        icon: FaComputer,
        requiredCourse: 'procedural_practice',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.1 }
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
        ],
        replacedBy: 'police_car_usage_right_police'
    },
    {
        id: 'police_car_usage_right_police',
        name: 'Alarmsõiduki oskuslik juhtimine',
        description: 'Alarmsõiduki täiendkoolituse läbinud ametnik',
        icon: GiPoliceCar,
        requiredCourse: 'response_training',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.08 }
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
        ],
        replacedBy: 'law_advanced_police'
    },
    {
        id: 'law_advanced_police',
        name: 'Süüteomenetluse põhjalikud teadmised',
        description: 'Oled omandanud süüteomenetluses täiendavad teadmised ja oskad viia läbi kõiki menetlusliike.',
        icon: GoLaw,
        requiredCourse: 'enhanced_law_studies',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.15 }
        ]
    },
    {
        id: 'police_ground_force_lead',
        name: 'Välijuhtimise oskus',
        description: 'Oled omandanud teadmised ja oskused efektiivseks välitöö juhtimiseks',
        icon: FaPeopleGroup,
        requiredCourse: 'police_ground_leader_course',
        trainingBonuses: [
            { attribute: 'strength', percentage: 0.10 },
            { attribute: 'dexterity', percentage: 0.10 }
        ]
    },
    {
        id: 'police_medical_officer',
        name: 'Esmaabi andmise oskus',
        description: 'Oled omandanud teadmised ja oskused efektiivseks esmaabi andmiseks välitöös',
        icon: FaMedkit,
        requiredCourse: 'medical_course_police',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.05 },
            { attribute: 'endurance', percentage: 0.05 }
        ],
        replacedBy: 'police_medical_officer_advanced'
    },
    {
        id: 'police_medical_officer_advanced',
        name: 'Taktikaline meedik',
        description: 'Oled omandanud põhjalikud TCCC teadmised ja oled oma üksuse meedik ',
        icon: FaClinicMedical,
        requiredCourse: 'medical_course_police_advanced',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.10 },
            { attribute: 'endurance', percentage: 0.10 }
        ]
    },
    {
        id: 'doggys_favorite',
        name: 'Koertega tegutsemine',
        description: 'Oled läbinud koolituse koos K9 üksusega edukaks tegutsemiseks',
        icon: GiSniffingDog,
        requiredCourse: 'dog_handler_course',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.05 },
            { attribute: 'agility', percentage: 0.05 }
        ],
        replacedBy: 'doggys_master'
    },
    {
        id: 'doggys_master',
        name: 'Koertega tegutsemine',
        description: 'Oled läbinud spetsialistide käe all personaalse koolituse koertega professionaalseks tegutsemiseks',
        icon: FaShieldDog,
        requiredCourse: 'dog_master_course_01',
        trainingBonuses: [
            { attribute: 'dexterity', percentage: 0.08 },
            { attribute: 'agility', percentage: 0.08 }
        ]
    },
    {
        id: 'master_detective',
        name: 'Teadmistega jälitaja',
        description: 'Tead jälitustegevuse seadusandlust, oskad teha rahvusvaheliselt koostööd',
        icon: PiDetectiveBold,
        requiredCourse: 'detective_course_advanced_02',
        trainingBonuses: [
            { attribute: 'intelligence', percentage: 0.1 },
            { attribute: 'dexterity', percentage: 0.1 }
        ]
    },
    {
        id: 'group_leader',
        name: 'Grupi liider',
        description: 'Oled läbinud grupijuhi algkoolituse ja oskad grupi juhtida',
        icon: GiStrong,
        requiredCourse: 'police_group_leader_course',
        trainingBonuses: [
            { attribute: 'strength', percentage: 0.05 },
            { attribute: 'intelligence', percentage: 0.05 }
        ],
        replacedBy: 'group_leader_advanced'
    },
    {
        id: 'group_leader_advanced',
        name: 'Grupi mainekas liider',
        description: 'Oled läbinud grupijuhi täiendkoolituse ja oskad grupi edukalt juhtida',
        icon: FaPeopleLine,
        requiredCourse: 'police_group_leader_course_advanced',
        trainingBonuses: [
            { attribute: 'strength', percentage: 0.08 },
            { attribute: 'intelligence', percentage: 0.08 }
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