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
            experience: 1500,
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
            experience: 1500,
            reputation: 200,
            money: 1500,
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
        category: 'politsei',
        completionQuestion: {
            question: 'Mille vastu kaitseb politseile väljastatud massiohje varustus?',
            answers: [
                'Tuli, torked ja gaas',
                'III klassi kuulikaitse, torked, gaas',
                'torked, gaas ja keemia',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 500,
                money: 500,
                reputation: 75,
            }
        }
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
            experience: 2000,
            reputation: 150,
            money: 1500,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Kes juhib Eesti Vabariigis kohtueelset kriminaalmenetlust?',
            answers: [
                'Prokuratuur',
                'Politsei- ja Piirivalveamet',
                'Kohus',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 600,
                money: 600,
                reputation: 75,
            }
        }
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
            experience: 2000,
            reputation: 200,
            money: 1500,
        },
        category: 'politsei'
    },
    {
        id: 'dog_handler_course',
        name: 'Politseikoerte baaskoolitus',
        description: 'Baaskoolitus õppimaks tundma politseikoerte liike, käitumismustreid ja tegutsemisviise sündmuskohal',
        duration: 18000,
        requirements: {
            level: 45,
            completedCourses: ['medical_course_police'],
            totalWorkedHours: 70
        },
        rewards: {
            experience: 2500,
            reputation: 250,
            money: 2000,
            grantsAbility: 'doggys_favorite',
        },
        category: 'politsei'
    },
    {
        id: 'basic_computer_course',
        name: 'Arvutisüsteemide algkoolitus',
        description: 'Baasõpe ja sissejuhatus IT süsteemidesse',
        duration: 10800,
        requirements: {
            level: 45,
            completedCourses: ['lopueksam'],
            totalWorkedHours: 50
        },
        rewards: {
            experience: 2500,
            reputation: 150,
            money: 1500
        },
        category: 'politsei'
    },
    {
        id: 'advanced_computer_skills',
        name: 'Arvutisüsteemide täiendkoolitus',
        description: 'Täiendkoolitus arvutivõrkude ja IT süsteemidest edasijõudnutele',
        duration: 14400,
        requirements: {
            level: 50,
            completedCourses: ['basic_computer_course'],
            totalWorkedHours: 60
        },
        rewards: {
            experience: 4500,
            reputation: 250,
            money: 2000
        },
        category: 'politsei'
    },
    {
        id: 'cyber_crime_course',
        name: 'Küberturvalisuse baaskursus',
        description: 'Baaskoolitus küberturvalisuse teadmistest',
        duration: 18000,
        requirements: {
            level: 50,
            completedCourses: ['enhanced_law_studies', 'basic_computer_course'],
            totalWorkedHours: 60
        },
        rewards: {
            experience: 5500,
            reputation: 250,
            money: 2000
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
            experience: 4000,
            reputation: 300,
            money: 2000,
        },
        category: 'politsei'
    },
    {
        id: 'detective_course',
        name: 'Jälitustegevuse ja profileerimise kursus',
        description: 'Koolitus jälitustegevuse õiguslikeks alusteks, praktilised käitumisjuhendid ja isikute profileerimine',
        duration: 18000,
        requirements: {
            level: 50,
            completedCourses: ['evidence_place_course'],
            totalWorkedHours: 80
        },
        rewards: {
            experience: 4500,
            reputation: 400,
            money: 3000,
        },
        category: 'politsei'
    },
    {
        id: 'narcotic_psyhotropic_substances',
        name: 'Narkootiliste ja psühhotroopsete ainete koolitus',
        description: 'Koolitus, kus õpid tundma narkootiliste ja psühhotroopsete ainete tundemärke, lihtsamaid keemilisi koostiosasi ja ' +
            'isikute käitumismustreid',
        duration: 18000,
        requirements: {
            level: 60,
            completedCourses: ['detective_course'],
            totalWorkedHours: 100
        },
        rewards: {
            experience: 6500,
            reputation: 500,
            money: 4000,
        },
        category: 'politsei'
    },
    {
        id: 'forensics_basics',
        name: 'Kohtuekspertiisi algkoolitus',
        description: 'Põhjalik koolitus tõendite kogumiseks, säilitamiseks ja analüüsimiseks. Õpid DNA analüüsi, sõrmejälgede võtmist,' +
            ' ballistikat ja muud kohtumeditsiini alaseid oskusi.',
        duration: 18000,
        requirements: {
            level: 65,
            completedCourses: ['detective_course'],
            totalWorkedHours: 120
        },
        rewards: {
            experience: 8500,
            reputation: 600,
            money: 5000,
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
            experience: 4000,
            reputation: 500,
            money: 3000,
        },
        category: 'politsei'
    }
];