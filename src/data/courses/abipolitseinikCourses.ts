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
        category: 'abipolitseinik',
        completionQuestion: {
            question: 'Millisest seadusest tulenevalt tekivad õigused ja kohustused abipolitseinikul teenistuses tegutsemiseks?',
            answers: [
                'Abipolitseiniku seadus',
                'Politsei ja piirivalve seadus',
                'Korrakaitseseadus'
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 100,
                money: 150,
                reputation: 15
            }
        }
    },
    {
        id: 'firearm_training_abipolitseinik',
        name: 'Tulirelva koolitus',
        description: 'Omanda tulirelva käsitsemise oskused ja ohutusnõuded. Õpid relva hooldust, laskmistehnikaid ja taktikalist relvakasutust.',
        duration: 600,
        requirements: {
            level: 5,
            completedCourses: ['basic_police_training_abipolitseinik'],
            totalWorkedHours: 1
        },
        rewards: {
            experience: 50,
            reputation: 20
        },
        category: 'abipolitseinik',
        completionQuestion: {
            question: 'Oled teenistuses äreval väljakutsel. Järsku haarab agressiivne isik taskust noa. ' +
                'Haarasid kohe tulirelva kuigi kõrval seisnud politseiametnik võttis gaasi. Kas tegid abipolitseinikuna õigesti?',
            answers: [
                'Ei',
                'Jah'
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 50,
                money: 50,
                reputation: 10
            }
        }
    },
    {
        id: 'electrical_shock_weapon_abipolitseinik',
        name: 'Elektrišokirelva koolitus',
        description: 'Omanda elektrišokirelva käsitsemise oskused ja ohutusnõuded. Õpid taseri hooldust, laskmistehnikaid ja elektrirelva kasutust.',
        duration: 1200,
        requirements: {
            level: 5,
            completedCourses: ['basic_police_training_abipolitseinik'],
            totalWorkedHours: 2
        },
        rewards: {
            experience: 75,
            reputation: 30,
        },
        category: 'abipolitseinik',
        completionQuestion: {
            question: 'Millal võib abipolitseinik elektrišokirelva kasutada?',
            answers: [
                'Üksnes hädakaitses, seejuures hädakaitse piire ületamata',
                'Tõkestada vahetult eelseisva või juba asetleidva esimese astme kuriteo toimepanemist',
                'Pidada kinni isik või takistada tema põgenemist'
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 50,
                money: 100,
                reputation: 10
            }
        }
    },
    {
        id: 'police_apollo_usage_abipolitseinik',
        name: 'E-Politsei kasutamise õigus',
        description: 'Omanda baasteadmised ja kasutusõigus e-politsei rakenduse "Apollo" jaoks.',
        duration: 1200,
        requirements: {
            level: 7,
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
            totalWorkedHours: 4
        },
        rewards: {
            experience: 100,
            reputation: 50,
        },
        category: 'abipolitseinik',
        completionQuestion: {
            question: 'Patrullpaariline lahkub autost, et kontrollida peatatud sõidukijuhi alkoholijoovet. Sina oled autos olles abipolitseinik ning läbi paarilise konto teostad kiirpäringu peatatud sõiduki kohta. Kas tegevus oli õiguspärane?',
            answers: [
                'Ei',
                'Jah'
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 50,
                money: 100,
                reputation: 25
            }
        }
    },
    {
        id: 'police_car_training_abipolitseinik',
        name: 'Alarmsõiduki juhtimise koolitus',
        description: 'Omanda teadmised ja oskused ohutuks ja efektiivseks alarmsõiduki juhtimiseks.',
        duration: 1800,
        requirements: {
            level: 9,
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
            totalWorkedHours: 10
        },
        rewards: {
            experience: 150,
            reputation: 50,
        },
        category: "abipolitseinik",
        completionQuestion: {
            question: 'Teostasid alarmsõitu ja sõitsid kiiruskaamerasse. Alarmsõidukil põlesid sinised märgutuled/vilkurid. ' +
                'Hiljem vahetu juht nõuab kiiruskaameratrahvi tasumist, sest alarmsõit polnud tema hinnangul õiguspärane. ' +
                'Kas vahetu juhi nõudmine on õiguspärane?',
            answers: [
                'Jah',
                'Ei'
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 50,
                money: 50,
                reputation: 25
            }
        }
    },
    {
        id: 'speed_measurement_abipolitseinik',
        name: 'Kiirusmõõtja pädevus',
        description: 'Spetsialiseeritud koolitus liikluskiiruse mõõtmise seadmete kasutamiseks ja liiklusrikkumiste dokumenteerimiseks.',
        duration: 1800,
        requirements: {
            level: 10,
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
            totalWorkedHours: 10
        },
        rewards: {
            experience: 150,
            reputation: 50,
        },
        category: 'abipolitseinik',
        completionQuestion: {
            question: 'Teenistuses olles abipolitseinikuna kasutasid kiirusmõõturit ja mõõtsid sõidukite ' +
                'liikumiskiirust. Patrullpaariline hiljem palub sul teha kiirusmõõturikasutamise protokolli. Kas saad olla protokollija ' +
                'kui ise mõõtsid eelnevalt kiiruse?',
            answers: [
                'Jah',
                'Ei'
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 50,
                money: 50,
                reputation: 25
            }
        }
    },
    {
        id: 'riot_course_abipolitseinik',
        name: 'Kriis ja kriisirolli koolitus',
        description: 'Koolitus abipolitsienikele hädaolukorras, eriolukorras ja sõjaseisukorra ajal.',
        duration: 3600,
        requirements: {
            level: 12,
            completedCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
            totalWorkedHours: 15,
            attributes: {
                intelligence: 5,
                strength: 5,
                endurance: 5,
            }
        },
        rewards: {
            experience: 200,
            reputation: 50,
        },
        category: 'abipolitseinik',
        completionQuestion: {
            question: 'Kas kriisirolliga abipolitseinikul on õigus keelduda töö tegemisest tööandja juures, kellega tal on sõlmitud tööleping, kui' +
                'ta kaasatakse kriisi lahendamisse?',
            answers: [
                'Ei, aga teatud tingimustel on',
                'Jah'
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 50,
                money: 50,
                reputation: 25
            }
        }
    },
    {
        id: 'independent_competence_abipolitseinik',
        name: 'Iseseisva pädevuse koolitus (IPAP)',
        description: 'Põhjalik koolitus iseseisva tööülesannete täitmiseks. Omandad oskused iseseisvaks patrullimiseks ja otsuste tegemiseks.',
        duration: 14400,
        requirements: {
            level: 15,
            completedCourses: ['speed_measurement_abipolitseinik', 'police_apollo_usage_abipolitseinik', 'police_car_training_abipolitseinik', 'riot_course_abipolitseinik', 'electrical_shock_weapon_abipolitseinik'],
            totalWorkedHours: 15,
            attributes: {
                intelligence: 10,
                strength: 10,
                endurance: 10,
            }
        },
        rewards: {
            experience: 500,
            reputation: 150,
        },
        category: 'abipolitseinik',
        completionQuestion: {
            question: 'Kas iseseisva pädevusega abipolitseinikul on rohkem õiguseid vahetu sunni rakendamisel ' +
                'võrreldes tavalise abipolitseinikuga?',
            answers: [
                'Ei',
                'Jah'
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 150,
                money: 100,
                reputation: 50
            }
        }
    }
];