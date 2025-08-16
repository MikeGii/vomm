// src/data/courses.ts
import { Course } from '../types';

export const ABIPOLITSEINIK_COURSES: Course[] = [
    {
        id: 'basic_police_training_abipolitseinik',
        name: 'Abipolitseiniku baaskursus',
        description: 'Põhiline koolitus kõigile uutele liikmetele. Õpid seadusi, protseduure ja ohutustehnikaid.',
        duration: 10, // 10 seconds for testing
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
        duration: 300, // 5 minutes
        requirements: {
            level: 5,
            completedCourses: ['basic_police_training_abipolitseinik'],
            totalWorkedHours: 1
        },
        rewards: {
            experience: 150,
            reputation: 50
        },
        category: 'abipolitseinik'
    },
    {
        id: 'speed_measurement_abipolitseinik',
        name: 'Kiirusmõõtja pädevus',
        description: 'Spetsialiseeritud koolitus liikluskiiruse mõõtmise seadmete kasutamiseks ja liiklusrikkumiste dokumenteerimiseks.',
        duration: 1200, // 20 minutes
        requirements: {
            level: 10,
            completedCourses: ['basic_police_training_abipolitseinik'],
            totalWorkedHours: 5
        },
        rewards: {
            experience: 200,
            reputation: 75
        },
        category: 'abipolitseinik'
    },
    {
        id: 'independent_competence_abipolitseinik',
        name: 'Iseseisva pädevuse koolitus (IPAP)',
        description: 'Põhjalik koolitus iseseisva tööülesannete täitmiseks. Omandad oskused iseseisvaks patrullimiseks ja otsuste tegemiseks.',
        duration: 7200, // 2 hours
        requirements: {
            level: 15,
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
            totalWorkedHours: 10
        },
        rewards: {
            experience: 500,
            reputation: 200,
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