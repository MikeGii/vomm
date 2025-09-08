// src/data/courses/sisekaitseakadeemiaCourses.ts
import { Course } from '../../types';

export const SISEKAITSEAKADEEMIA_COURSES: Course[] = [
    {
        id: 'sisekaitseakadeemia_entrance',
        name: 'Sisekaitseakadeemia sisseastumine',
        description: 'Ettevalmistuskursus Sisekaitseakadeemiasse astumiseks. Tutvud Sisekaitseakadeemiaga avatud uste päeval ja uurid võimalusi Politseikolledži kohta.',
        duration: 14400,
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Mis aastal asutati Politseikool Paikusel?',
            answers: [
                '2004',
                '1990',
                '2010',
                        ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 250,
                money: 100,
                reputation: 50,
            }
        }
    },
    {
        id: 'law_studies_curriculum',
        name: 'Õigusteaduste õppekava',
        description: 'Põhjalik õigusteaduse kursus, mis hõlmab kriminaalõigust, karistusseadustikku ja menetlusõigust.',
        duration: 10800,
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Mis annab pädevuse politseiametnikul olla menetleja?',
            answers: [
                'Menetluspraktika sooritamine Sisekaitseakadeemias',
                'Sisekaitseakadeemia lõpetamine',
                'Politseiametniku ametitõend',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 100,
                money: 100,
                reputation: 25,
            }
        }
    },
    {
        id: 'physical_preparation',
        name: 'Füüsilised ettevalmistused',
        description: 'Intensiivne füüsilise ettevalmistuse programm, mis arendab jõudu, vastupidavust ja taktilist valmisolekut.',
        duration: 10800,
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Milline nendest spordialadest ei kuulu politseiametniku kehalise ettevalmistuse nõuete hindamisele?',
            answers: [
                'Toenglamangus kätekõverdamine',
                'Ujumine',
                'Jalgrattaga sõitmine',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 200,
                money: 100,
                reputation: 25,
            }
        }
    },
    {
        id: 'firearm_handling_glock',
        name: 'Tulirelva käsitsemine - Glock',
        description: 'Spetsialiseeritud koolitus Glock teenistusrelva käsitsemiseks. Täiustab lasketehnikat ja taktilist relvakasutust.',
        duration: 10800,
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Milline seadus reguleerib politseiametniku tulirelva kasutamise aluseid?',
            answers: [
                'Korrakaitseseadus',
                'Tulirelvaseadus',
                'Karistusseadustik',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 150,
                money: 100,
                reputation: 25,
            }
        }
    },
    {
        id: 'firearm_handling_r20',
        name: 'Tugirelva käsitsemine - R20',
        description: 'Spetsialiseeritud koolitus tugirelva LMT R-20 teenistusrelva käsitsemiseks. Täiustab lasketehnikat ja taktilist relvakasutust.',
        duration: 14400,
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Politseis kasutatakse tugirelva nimega "Rahe", kes on selle relva tootja?',
            answers: [
                'Glock GmbH',
                'Lewis Machine & Tool Company',
                'Heckler & Koch',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 200,
                money: 150,
                reputation: 25,
            }
        }
    },
    {
        id: 'self-defence_training',
        name: 'Enesekaitse kursus',
        description: 'Omanda enesekaitse ja kinnipidamise võtete oskused, mida rakendada enda töös ohutult ja tulemuslikult',
        duration: 10800,
        requirements: {
            completedCourses: ['physical_preparation'],
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Mis ei ole korrakaitseseaduse mõistes erivahend?',
            answers: [
                'Pipragaas',
                'Teenistusloom',
                'Veekahur',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 150,
                money: 100,
                reputation: 25,
            }
        }
    },
    {
        id: 'medical_training',
        name: 'Meditsiini koolitus',
        description: 'Omanda baasteadmised ja oskused, kuidas anda sündmuskohal elupäästvat esmaabi erinevate traumade puhul. Õpid ohutut patsiendi käsitlemist ning stabiliseerimist. Tunned ära erinevad traumad ja haigusseisundid.',
        duration: 14400,
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Sündmusel kasutasid vahetut sundi isiku suhtes. Millal pead talle esmaabi andma?',
            answers: [
                'Kohe peale sunni kasutamist',
                'Esimesel võimalusel',
                'Ei pea esmaabi osutama ja kutsud kiirabi, kes osutab esmaabi',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 150,
                money: 100,
                reputation: 25,
            }
        }
    },
    {
        id: 'document_inspection_course',
        name: 'Dokumentide kontroll',
        description: 'Koolituse läbides oskad kontrollida isikuid ja nende dokumente',
        duration: 10800,
        requirements: {
            completedCourses: ['law_studies_curriculum'],
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Kuidas nimetatakse elementi dokumendil, millel erineva vaatenurga all värvid vahelduvad?',
            answers: [
                'IPI',
                'OVD',
                'OFV',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 150,
                money: 150,
                reputation: 25,
            }
        }
    },
    {
        id: 'traffic_accident_procedural',
        name: 'Liiklusõnnetuse vormistamise koolitus',
        description: 'Koolituse läbides oskad tegutseda liiklusõnnetusega sündmuskohal ning protokollida ja vormistada liiklusõnnetusega seonduvaid' +
            ' dokumente',
        duration: 10800,
        requirements: {
            completedCourses: ['law_studies_curriculum', 'medical_training'],
            totalWorkedHours: 25,
            attributes: {
                intelligence: 20
            }
        },
        rewards: {
            experience: 700,
            reputation: 75,
            money: 600
        },
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Liiklusõnnetuse sündmuskoha skeemi joonestamisel võetakse mõõtude alguseks:',
            answers: [
                'Mediaanpunkt',
                'Nullpunkt',
                'Alguspunkt',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 150,
                money: 150,
                reputation: 25,
            }
        }
    },
    {
        id: 'response_training',
        name: 'Avaliku korra praktika',
        description: 'Kursuse läbides oskad reageerida ja lahendada lihtsamaid väljakutseid ning koostada vajalikke protokolle',
        duration: 14400,
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
            experience: 700,
            reputation: 75,
            money: 600
        },
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Kes on avaliku korra eest vastutav isik?',
            answers: [
                'Politseiametnik',
                'Isik, kelle valduses avaliku korda rikutakse',
                'Isik, kes on rikkunud avaliku korda',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 200,
                money: 250,
                reputation: 50,
            }
        }
    },
    {
        id: 'procedural_practice',
        name: 'Menetluspraktika',
        description: 'Oled omandanud peamised oskused Sisekaitseakadeemias ja nüüd peab iseseisvalt kõiki oskuseid rakendama patrulltöös',
        duration: 18000,
        requirements: {
            completedCourses: ['response_training', 'medical_training', 'document_inspection_course'],
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
        category: 'sisekaitseakadeemia',
        completionQuestion: {
            question: 'Mis järgnevatest toimingutest ei ole süüteomenetluse alustamise toiming?',
            answers: [
                'Indikaatorvahendi kasutamise protokoll',
                'Tunnistaja ülekuulamise protokoll',
                'Sündmuskoha vaatlusprotokoll',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 500,
                money: 400,
                reputation: 75,
            }
        }
    },
    {
        id: 'lopueksam',
        name: 'Lõpueksam',
        description: 'Sisekaitseakadeemia lõpueksam. Pead demonstreerima kõiki omandatud oskusi ja teadmisi. Läbimine annab sulle politseiametniku staatuse ja inspektori auastme.',
        duration: 10800,
        requirements: {
            level: 35,
            completedCourses: ['procedural_practice', 'traffic_accident_procedural'],
            totalWorkedHours: 40,
        },
        rewards: {
            experience: 2500,
            reputation: 700,
            money: 600,
            unlocksRank: 'Inspektor',
            unlocksStatus: 'Politseiametnik'
        },
        category: 'sisekaitseakadeemia'
    }
];