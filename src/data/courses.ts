// src/data/courses.ts
import { Course } from '../types';

export const BASIC_COURSES: Course[] = [
    {
        id: 'basic_police_training_abipolitseinik',
        name: 'Abipolitseiniku baaskursus',
        description: 'Põhiline koolitus kõigile uutele liikmetele. Õpid seadusi, protseduure ja ohutustehnikaid.',
        duration: 10, // 60 seconds for testing
        requirements: {
            level: 1
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
        },
        rewards: {
            experience: 150,
            reputation: 75
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
            completedCourses: ['basic_police_training_abipolitseinik']
        },
        rewards: {
            experience: 300,
            reputation: 150
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
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik']
        },
        rewards: {
            experience: 1000,
            reputation: 500,
        },
        category: 'abipolitseinik'
    }
];

// Combine all courses
export const ALL_COURSES: Course[] = [
    ...BASIC_COURSES
];

// Helper function to get course by ID
export const getCourseById = (courseId: string): Course | undefined => {
    return ALL_COURSES.find(course => course.id === courseId);
};

// Helper function to get courses by category
export const getCoursesByCategory = (category: 'abipolitseinik' | 'basic' | 'advanced' | 'specialist'): Course[] => {
    return ALL_COURSES.filter(course => course.category === category);
};