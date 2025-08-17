// src/data/courses.ts
import { Course } from '../types';

export const ABIPOLITSEINIK_COURSES: Course[] = [
    {
        id: 'basic_police_training_abipolitseinik',
        name: 'Abipolitseiniku baaskursus',
        description: 'Põhiline koolitus kõigile uutele liikmetele. Õpid seadusi, protseduure ja ohutustehnikaid.',
        duration: 10,
        requirements: {
            level: 1,
            totalWorkedHours: 0

        },
        rewards: {
            experience: 50,
            reputation: 10,
        },
        category: 'abipolitseinik'
    },
    {
        id: 'firearm_training_abipolitseinik',
        name: 'Tulirelva koolitus',
        description: 'Omanda tulirelva käsitsemise oskused ja ohutusnõuded. Õpid relva hooldust, laskmistehnikaid ja taktikalist relvakasutust.',
        duration: 300,
        requirements: {
            level: 5,
            completedCourses: ['basic_police_training_abipolitseinik'],
            totalWorkedHours: 1
        },
        rewards: {
            experience: 50,
            reputation: 20
        },
        category: 'abipolitseinik'
    },
    {
      id: 'electrical_shock_weapon_abipolitseinik',
      name: 'Elektrišokirelva koolitus',
      description: 'Omanda elektrišokirelva käsitsemise oskused ja ohutusnõuded. Õpid taseri hooldust, laskmistehnikaid ja elektrirelva kasutust.',
      duration: 600,
      requirements: {
          level: 5,
          completedCourses: ['basic_police_training_abipolitseinik'],
          totalWorkedHours: 2
      },
      rewards: {
          experience: 75,
          reputation: 30,
      },
      category: 'abipolitseinik'
    },
    {
      id: 'police_apollo_usage_abipolitseinik',
      name: 'E-Politsei kasutamise õigus',
      description: 'Omanda baasteadmised ja kasutusõigus e-politsei rakenduse "Apollo" jaoks.',
      duration: 900,
      requirements: {
          level: 7,
          completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
          totalWorkedHours: 4
      },
      rewards: {
        experience: 100,
        reputation: 50,
      },
      category: 'abipolitseinik'
    },
    {
      id: 'police_car_training_abipolitseinik',
      name: 'Alarmsõiduki juhtimise koolitus',
      description: 'Omanda teadmised ja oskused ohutuks ja efektiivseks alarmsõiduki juhtimiseks.',
      duration: 1200,
      requirements: {
          level: 9,
          completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
          totalWorkedHours: 10
      },
      rewards: {
          experience: 150,
          reputation: 50,
      },
      category: "abipolitseinik"
    },
    {
        id: 'speed_measurement_abipolitseinik',
        name: 'Kiirusmõõtja pädevus',
        description: 'Spetsialiseeritud koolitus liikluskiiruse mõõtmise seadmete kasutamiseks ja liiklusrikkumiste dokumenteerimiseks.',
        duration: 1200,
        requirements: {
            level: 10,
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
            totalWorkedHours: 10
        },
        rewards: {
            experience: 150,
            reputation: 50,
        },
        category: 'abipolitseinik'
    },
    {
        id: 'independent_competence_abipolitseinik',
        name: 'Iseseisva pädevuse koolitus (IPAP)',
        description: 'Põhjalik koolitus iseseisva tööülesannete täitmiseks. Omandad oskused iseseisvaks patrullimiseks ja otsuste tegemiseks.',
        duration: 7200,
        requirements: {
            level: 15,
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik', 'speed_measurement_abipolitseinik', 'police_apollo_usage_abipolitseinik', 'police_car_training_abipolitseinik'],
            totalWorkedHours: 10,
            attributes: {
                intelligence: 5,
                strength: 5,
                endurance: 5,
            }
        },
        rewards: {
            experience: 300,
            reputation: 100,
        },
        category: 'abipolitseinik'
    }
];

export const SISEKAITSEAKADEEMIA_COURSES: Course[] = [
    {
        id: 'sisekaitseakadeemia_entrance',
        name: 'Sisekaitseakadeemia sisseastumine',
        description: 'Ettevalmistuskursus Sisekaitseakadeemiasse astumiseks. Tutvud Sisekaitseakadeemiaga avatud uste päeval ja uurid võimalusi Politseikolledži kohta.',
        duration: 14400, // 4 hours in seconds
        requirements: {
            level: 20,
            completedCourses: ['independent_competence_abipolitseinik'],
            totalWorkedHours: 20
        },
        rewards: {
            experience: 1000,
            reputation: 300,
            unlocksRank: 'Nooreminspektor',
            unlocksStatus: 'Kadett'
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'law_studies_curriculum',
        name: 'Õigusteaduste õppekava',
        description: 'Põhjalik õigusteaduse kursus, mis hõlmab kriminaalõigust, karistusseadustikku ja menetlusõigust.',
        duration: 7200, // 2 hours
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance'],
            totalWorkedHours: 20,
            attributes: {
                intelligence: 10
            }
        },
        rewards: {
            experience: 300,
            reputation: 50,
            money: 250
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'physical_preparation',
        name: 'Füüsilised ettevalmistused',
        description: 'Intensiivne füüsilise ettevalmistuse programm, mis arendab jõudu, vastupidavust ja taktilist valmisolekut.',
        duration: 7200, // 2 hours
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance'],
            totalWorkedHours: 20,
            attributes: {
                strength: 10,
                endurance: 5
            }
        },
        rewards: {
            experience: 400,
            reputation: 50,
            money: 250
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'firearm_handling_glock',
        name: 'Tulirelva käsitsemine - Glock',
        description: 'Spetsialiseeritud koolitus Glock teenistusrelva käsitsemiseks. Täiustab lasketehnikat ja taktilist relvakasutust.',
        duration: 7200, // 2 hours
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance'],
            totalWorkedHours: 20,
            attributes: {
                dexterity: 5,
                agility: 5
            }
        },
        rewards: {
            experience: 300,
            reputation: 50,
            money: 250,
            grantsAbility: 'firearm_carry_enhanced',
            replacesAbility: 'firearm_carry_abipolitseinik'
        },
        category: 'sisekaitseakadeemia'
    }
];

// Combine all courses
export const ALL_COURSES: Course[] = [
    ...ABIPOLITSEINIK_COURSES,
    ...SISEKAITSEAKADEEMIA_COURSES,
];

// Helper function to get course by ID
export const getCourseById = (courseId: string): Course | undefined => {
    return ALL_COURSES.find(course => course.id === courseId);
};

// Helper function to get courses by category
export const getCoursesByCategory = (category: 'abipolitseinik' | 'basic' | 'advanced' | 'specialist'): Course[] => {
    return ALL_COURSES.filter(course => course.category === category);
};