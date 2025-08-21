// src/data/courses/sisekaitseakadeemiaCourses.ts
import { Course } from '../../types';

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
    },
    {
        id: 'firearm_handling_r20',
        name: 'Tugirelva käsitsemine - R20',
        description: 'Spetsialiseeritud koolitus tugirelva LMT R-20 teenistusrelva käsitsemiseks. Täiustab lasketehnikat ja taktilist relvakasutust.',
        duration: 10800, // 3 hours
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance'],
            totalWorkedHours: 25,
            attributes: {
                dexterity: 10,
                agility: 10
            }
        },
        rewards: {
            experience: 500,
            reputation: 50,
            money: 450,
            grantsAbility: 'firearm_carry_r20_automatic',
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'self-defence_training',
        name: 'Enesekaitse kursus',
        description: 'Omanda enesekaitse ja kinnipidamise võtete oskused, mida rakendada enda töös ohutult ja tulemuslikult',
        duration: 7200,
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance', 'physical_preparation'],
            totalWorkedHours: 20,
            attributes: {
                strength: 10,
                agility: 10
            }
        },
        rewards: {
            experience: 400,
            reputation: 50,
            money: 300
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'document_inspection_course',
        name: 'Dokumentide kontroll',
        description: 'Koolituse läbides oskad kontrollida isikuid ja nende dokumente',
        duration: 7200, // 2 hours
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance', 'law_studies_curriculum'],
            totalWorkedHours: 20,
            attributes: {
                intelligence: 15
            }
        },
        rewards: {
            experience: 300,
            reputation: 50,
            money: 400
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'response_training',
        name: 'Avaliku korra praktika',
        description: 'Kursuse läbides oskad reageerida ja lahendada lihtsamaid väljakutseid ning koostada vajalikke protokolle',
        duration: 10800, // 3 hours
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance', 'self-defence_training', 'law_studies_curriculum', 'firearm_handling_glock'],
            totalWorkedHours: 20,
            attributes: {
                intelligence: 15,
                agility: 15,
                endurance: 15
            }
        },
        rewards: {
            experience: 500,
            reputation: 75,
            money: 600
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'medical_training',
        name: 'Meditsiini koolitus',
        description: 'Omanda baasteadmised ja oskused, kuidas anda sündmuskohal elupäästvat esmaabi erinevate traumade puhul. Õpid ohutut patsiendi käsitlemist ning stabiliseerimist. Tunned ära erinevad traumad ja haigusseisundid.',
        duration: 10800,
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance'],
            totalWorkedHours: 20,
            attributes: {
                intelligence: 15
            }
        },
        rewards: {
            experience: 400,
            reputation: 50,
            money: 300
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'procedural_practice',
        name: 'Menetluspraktika',
        description: 'Oled omandanud peamised oskused Sisekaitseakadeemias ja nüüd peab iseseisvalt kõiki oskuseid rakendama patrulltöös',
        duration: 14400,
        requirements: {
            completedCourses: ['sisekaitseakadeemia_entrance', 'response_training', 'medical_training', 'document_inspection_course'],
            totalWorkedHours: 30,
            attributes: {
                intelligence: 20,
                agility: 20,
                endurance: 20,
                strength: 20,
                dexterity: 20
            }
        },
        rewards: {
            experience: 1500,
            reputation: 100,
            money: 1000
        },
        category: 'sisekaitseakadeemia'
    },
    {
        id: 'lopueksam',
        name: 'Lõpueksam',
        description: 'Sisekaitseakadeemia lõpueksam. Pead demonstreerima kõiki omandatud oskusi ja teadmisi. Läbimine annab sulle politseiametniku staatuse ja inspektori auastme.',
        duration: 7200, // 2 hours
        requirements: {
            level: 30,
            completedCourses: ['procedural_practice'],
            totalWorkedHours: 30,
        },
        rewards: {
            experience: 1000,
            reputation: 500,
            money: 250,
            unlocksRank: 'Inspektor',
            unlocksStatus: 'Politseiametnik'
        },
        category: 'sisekaitseakadeemia'
    }
];