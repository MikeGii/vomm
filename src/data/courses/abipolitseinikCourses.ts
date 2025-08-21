// src/data/courses/abipolitseinikCourses.ts
import { Course } from '../../types';

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