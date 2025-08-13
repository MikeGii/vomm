// src/data/courses.ts (new file)
import { Course } from '../types';

export const BASIC_COURSES: Course[] = [
    {
        id: 'basic_police_training',
        name: 'Abipolitseiniku esmakoolitus',
        description: 'Põhiline koolitus kõigile uutele liikmetele. Õpid seadusi, protseduure ja ohutustehnikaid.',
        duration: 60, // 60 seconds for testing
        requirements: {
            level: 1
        },
        rewards: {
            experience: 50,
            reputation: 100,
            unlocksRank: 'Abipolitseinik'
        },
        category: 'basic'
    },
    {
        id: 'patrol_training',
        name: 'Patrullpolitseiniku koolitus',
        description: 'Õpi patrullimise põhitõdesid ja taktikat linnatänavatel.',
        duration: 120, // 2 minutes
        requirements: {
            level: 2,
            completedCourses: ['basic_police_training']
        },
        rewards: {
            experience: 100,
            reputation: 50,
            unlocksRank: 'Noorinspektor'
        },
        category: 'basic'
    },
    {
        id: 'traffic_control',
        name: 'Liikluskontrolli koolitus',
        description: 'Omanda teadmised liiklusseadustest ja kontrolli läbiviimisest.',
        duration: 90,
        requirements: {
            level: 2,
            completedCourses: ['basic_police_training']
        },
        rewards: {
            experience: 75,
            reputation: 30
        },
        category: 'basic'
    }
];

export const ADVANCED_COURSES: Course[] = [
    {
        id: 'detective_training',
        name: 'Uurija baaskoolitus',
        description: 'Õpi kuritegude uurimise põhialuseid, tõendite kogumist ja analüüsi.',
        duration: 300, // 5 minutes
        requirements: {
            level: 5,
            reputation: 300,
            completedCourses: ['basic_police_training', 'patrol_training']
        },
        rewards: {
            experience: 200,
            reputation: 150,
            unlocksRank: 'Inspektor'
        },
        category: 'advanced'
    },
    {
        id: 'forensics_basics',
        name: 'Kohtuekspertiisi alused',
        description: 'Sõrmejälgede võtmine, DNA tõendid ja kuriteopaiga analüüs.',
        duration: 240,
        requirements: {
            level: 6,
            completedCourses: ['detective_training']
        },
        rewards: {
            experience: 180,
            reputation: 100
        },
        category: 'advanced'
    }
];

export const SPECIALIST_COURSES: Course[] = [
    {
        id: 'k9_unit',
        name: 'Koerajuhi koolitus',
        description: 'Spetsialiseeritud koolitus teenistuskoertega töötamiseks.',
        duration: 480, // 8 minutes
        requirements: {
            level: 8,
            reputation: 500,
            completedCourses: ['patrol_training']
        },
        rewards: {
            experience: 300,
            reputation: 200,
            unlocksRank: 'Vaneminspektor'
        },
        category: 'specialist'
    },
    {
        id: 'swat_training',
        name: 'K-komando baaskoolitus',
        description: 'Eriüksuse taktika ja kõrge riskiga olukordade lahendamine.',
        duration: 600, // 10 minutes
        requirements: {
            level: 10,
            reputation: 800,
            completedCourses: ['patrol_training', 'detective_training']
        },
        rewards: {
            experience: 500,
            reputation: 300,
            unlocksRank: 'Üleminspektor'
        },
        category: 'specialist'
    }
];

// Combine all courses
export const ALL_COURSES: Course[] = [
    ...BASIC_COURSES,
    ...ADVANCED_COURSES,
    ...SPECIALIST_COURSES
];

// Helper function to get course by ID
export const getCourseById = (courseId: string): Course | undefined => {
    return ALL_COURSES.find(course => course.id === courseId);
};

// Helper function to get courses by category
export const getCoursesByCategory = (category: 'basic' | 'advanced' | 'specialist'): Course[] => {
    return ALL_COURSES.filter(course => course.category === category);
};