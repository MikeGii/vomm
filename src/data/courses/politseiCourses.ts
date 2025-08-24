// src/data/courses/politseiCourses.ts
import { Course } from '../../types';

export const POLITSEI_COURSES: Course[] = [
    {
        id: 'police_ground_leader_course',
        name: 'Välijuhi koolitus',
        description: 'Koolitus edukaks välitöö juhtimiseks',
        duration: 10800,
        requirements: {
            level: 35,
            completedCourses: ['lopueksam'],
            totalWorkedHours: 60
        },
        rewards: {
            experience: 1000,
            reputation: 200,
            money: 2000
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on politsei välijuhi eesmärk sündmustel?',
            answers: [
                'Delegeerida ülesandeid politsei, kiirabi ja pääste üksustele sündmuskohal',
                'Juhtida politsei tegevusi sündmuskohal',
                'Lahendada olukorda sündmuse keskel koos oma kolleegidega hea ülevaate saamiseks',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 400,
                money: 500,
                reputation: 75,
            }
        }
    },
    {
        id: 'medical_course_police',
        name: 'Meditsiini täiendõpe',
        description: 'Koolitus efektiivseks ja kiireks esmaabi andmiseks',
        duration: 7200,
        requirements: {
            level: 35,
            completedCourses: ['lopueksam'],
            totalWorkedHours: 40
        },
        rewards: {
            experience: 800,
            reputation: 150,
            money: 1200,
            grantsItems: [
                { itemId: 'medical_kit', quantity: 3 }
            ]
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mida käsitleb AVPU skaala?',
            answers: [
                'Traumahaigete vigastuste klassifitseerimise süsteem',
                'Elutähtsate näitajate jälgimise skaala',
                'Isiku teadvuse hindamise skaala',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 300,
                money: 400,
                reputation: 60,
            }
        }
    },
    {
        id: 'riot_police_course',
        name: 'Massiohje koolitus',
        description: 'Koolitus teadmiste omandamiseks ja tegutsemiseks massirahutuste korral',
        duration: 10800,
        requirements: {
            level: 40,
            completedCourses: ['medical_course_police'],
            totalWorkedHours: 50
        },
        rewards: {
            experience: 1500,
            reputation: 150,
            money: 1500,
            grantsEquipment: ['riot_helmet']
        },
        category: 'politsei'
    },
    {
        id: 'enhanced_law_studies',
        name: 'Süüteomenetluse täiendkoolitus',
        description: 'Koolitus põhjalikumaks süüteomenetluse läbiviimiseks',
        duration: 10800,
        requirements: {
            level: 40,
            completedCourses: ['lopueksam'],
            totalWorkedHours: 60
        },
        rewards: {
            experience: 1500,
            reputation: 150,
            money: 1500,
        },
        category: 'politsei'
    },
    {
        id: 'police_drone_course',
        name: 'Politseidrooni kasutamise koolitus',
        description: 'Koolitus professionaalseks ja sihipäraseks drooni kasutamise oskuseks',
        duration: 7200,
        requirements: {
            level: 40,
            completedCourses: ['lopueksam'],
            totalWorkedHours: 60
        },
        rewards: {
            experience: 1500,
            reputation: 200,
            money: 1500,
        },
        category: 'politsei'
    },
    {
        id: 'police_atv_course',
        name: 'Politsei ATV kasutamise koolitus',
        description: 'Koolitus ATV kasutamiseks politseiteenistuses',
        duration: 10800,
        requirements: {
            level: 40,
            completedCourses: ['lopueksam'],
            totalWorkedHours: 60
        },
        rewards: {
            experience: 1500,
            reputation: 200,
            money: 1500,
        },
        category: 'politsei'
    },
    {
        id: 'evidence_place_course',
        name: 'Sündmuskoha vormistamise koolitus',
        description: 'Koolitus koos kogenud kriminalistiga, kuidas edukalt säilitada ja vaadelda sündmuskohta',
        duration: 14400,
        requirements: {
            level: 45,
            completedCourses: ['enhanced_law_studies'],
            totalWorkedHours: 70
        },
        rewards: {
            experience: 2000,
            reputation: 300,
            money: 2000,
        },
        category: 'politsei'
    },
    {
        id: 'police_group_leader_course',
        name: 'Grupijuhi teadmiste koolitus',
        description: 'Koolitus ja ettevalmistus meeskonna juhtimiseks ja grupijuhi ülesannete täitmiseks',
        duration: 14400,
        requirements: {
            level: 45,
            completedCourses: ['police_ground_leader_course', 'enhanced_law_studies', 'medical_course_police'],
            totalWorkedHours: 80
        },
        rewards: {
            experience: 3000,
            reputation: 500,
            money: 3000,
        },
        category: 'politsei'
    },
];