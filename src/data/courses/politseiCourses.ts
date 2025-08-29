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
        id: 'medical_course_police_advanced',
        name: 'Põhjalik esmaabi ja taktikalise meditsiini koolitus',
        description: 'Koolitus efektiivse esmaabi andmiseks ja tegutsemine lahingolukorras meedikuna',
        duration: 18000,
        requirements: {
            level: 70,
            completedCourses: ['medical_course_police'],
            totalWorkedHours: 120
        },
        rewards: {
            experience: 9500,
            reputation: 500,
            money: 4500,
            grantsItems: [
                { itemId: 'medical_kit', quantity: 10 }
            ]
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on esmane tegevus, kui avastad välikeskkonnas pingelise pneumotooraksi tunnused?',
            answers: [
                'Rindkere dekompressioon nõelaga',
                'Kannatanu asetamine küliliasendisse kahjustatud poolele',
                'Hapniku manustamine maski kaudu',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 1500,
                money: 500,
                reputation: 200,
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
        id: 'emergency_police_course_houses',
        name: 'Ohtlikes hoonetes liikumine ja paiknemine',
        description: 'Koolitus välitöötajatele ja kiirreageerijatele, kuidas liikuda ohtlikes hoonetes, kus võib olla relvastatud isikuid',
        duration: 14000,
        requirements: {
            level: 50,
            completedCourses: ['medical_course_police'],
            totalWorkedHours: 80
        },
        rewards: {
            experience: 4500,
            reputation: 250,
            money: 2500
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Kuidas nimetatakse politseis ruumi sisenemise eelset kontrolli ukseava juures?',
            answers: [
                '"Tagala puhastus" (Clearing the back)',
                '"Viisteist kraadi" (fiftteen degrees)',
                '"Tordi lõikamine" (Slicing the Pie)',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 700,
                money: 500,
                reputation: 100,
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
        id: 'enhanced_law_studies_advanced',
        name: 'Süüteomenetluse koolitus edasijõudnutele',
        description: 'Õpid tundma kõiki politseitööks vajalike õigusakte ning oskad prokuratuuriga teha efektiivselt koostööd kuritegude lahendamisel',
        duration: 18000,
        requirements: {
            level: 55,
            completedCourses: ['enhanced_law_studies'],
            totalWorkedHours: 110
        },
        rewards: {
            experience: 7000,
            reputation: 550,
            money: 3500,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Millal saab kahtlustatavast isikust süüdistatav isik?',
            answers: [
                'Kui Politsei- ja Piirivalveamet on koostanud süüdistusakti kriminaalmenetluse seadustiku kohaselt',
                'Kui kohus on koostanud süüdistusakti kriminaalmenetluse seadustiku § 226 kohaselt',
                'Kui prokuratuur on koostanud süüdistusakti kriminaalmenetluse seadustiku kohaselt',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 1000,
                money: 800,
                reputation: 150,
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
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on drooni lennutamise maksimaalne lubatud kõrgus Eestis?',
            answers: [
                '80m',
                '120m',
                '150m',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 400,
                money: 300,
                reputation: 75,
            }
        }
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
        category: 'politsei',
        completionQuestion: {
            question: 'Miks on Spanjel hea koeratõug narkootiliste ainete otsimisel?',
            answers: [
                'Hea üldise haistingu tunnetusega ja kiire',
                'Spanjelil on eriline haisting narkootiliste ainete otsimisel',
                'Väikest tõugu koer mahub kitsastesse kohtadesse',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 500,
                money: 500,
                reputation: 75,
            }
        }

    },
    {
        id: 'dog_specialist_course',
        name: 'Koerte treeningu ja aretaja spetsialisti koolitus',
        description: 'Täiendõpe koerte treenerikvalifikatsiooni saamiseks. Õpid tundma koerte kõiki liike, nende omadusi ja käitumismustreid',
        duration: 18000,
        requirements: {
            level: 65,
            completedCourses: ['dog_handler_course'],
            totalWorkedHours: 120
        },
        rewards: {
            experience: 6500,
            reputation: 450,
            money: 3000,
            grantsAbility: 'doggys_trainer',
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Milline omadus on teenistuskoera jaoks kõige olulisem?',
            answers: [
                'Kiirus ja vastupidavus rasketeks ülesanneteks',
                'Kuulekus ja koostöövalmidus oma juhiga',
                'Koera iseseisvus ilma juhita ka tegutseda',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 1000,
                money: 750,
                reputation: 125,
            }
        }

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
        category: 'politsei',
        completionQuestion: {
            question: 'Milline on turvaline parool?',
            answers: [
                '123qwe!123qwe!123',
                'k8dFH!8c@Pfv0gB2',
                'Emasünnipäev15!',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 500,
                money: 500,
                reputation: 75,
            }
        }

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
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on Virtuaalse privaatvõrgu (VPN) peamine funktsioon?',
            answers: [
                'Suurendab interneti kiirust ja anonüümsust',
                'Võimaldab sirvida anonüümselt, maskeerides IP',
                'Takistab pahavaral pääseda ligi sinu süsteemi',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 750,
                money: 500,
                reputation: 80,
            }
        }

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
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on peamine programmeerimise keel, mida häkkerid kasutavad?',
            answers: [
                'Java',
                'Python',
                'HTML',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 1500,
                money: 500,
                reputation: 100,
            }
        }

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
        category: 'politsei',
        completionQuestion: {
            question: 'Miks peab sündmuskohal töötav kriminalist kandma kindaid ja kaitseriietust?',
            answers: [
                'Vältida tõendite rikkumist või segamist enda bioloogilise materjaliga',
                'Kaitsta ennast sündmuskohal olevate ohtude eest',
                'Selleks, et kiiremini tööd saaks teha ja ei peaks tähelepanu pöörama välistele teguritele',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 800,
                money: 700,
                reputation: 125,
            }
        }

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
        category: 'politsei',
        completionQuestion: {
            question: 'Milline käitlemine on Eestis keelatud narkootiliste ja psühhotroopsetel ainetel?',
            answers: [
                'Meditsiinilisel ja teaduslikul eermägil',
                'Õppeotstarbe kasutamise eesmärgil',
                'Väärtegude ennetamiseks ja avastamiseks',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 1500,
                money: 800,
                reputation: 125,
            }
        }
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
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on kohtuekspertiisi ametlik lühend Eestis?',
            answers: [
                'KEEI - Kohtuekspertiisi Eesti Instituut',
                'EKEI - Eesti Kohtuekspertiisi Instituut',
                'KEIE - Kohtuekspertiisi Instituut Eestis',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 1500,
                money: 1000,
                reputation: 200,
            }
        }

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
        category: 'politsei',
        completionQuestion: {
            question: 'Kas grupijuht ja välijuht on samatähenduslik?',
            answers: [
                'jah',
                'ei',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 750,
                money: 500,
                reputation: 100,
            }
        }
    },
    {
        id: 'police_group_leader_course_advanced',
        name: 'Grupijuhi täiendkoolitus',
        description: 'Grupijuhi täiendkoolitus edukaks grupi manageerimiseks ja juhtimiseks koos püshholoogia põhitõdedega',
        duration: 18000,
        requirements: {
            level: 70,
            completedCourses: ['police_group_leader_course'],
            totalWorkedHours: 120
        },
        rewards: {
            experience: 10000,
            reputation: 900,
            money: 5000,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mis aitab juhil teenistuses usaldust luua?',
            answers: [
                'Väljaspool tööaega sõbraks olemine',
                'Avatud/aus suhtlemine ja lubadustest kinnipidamine',
                'Distsipliini jälgimine ja kuulamisoskus',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 1250,
                money: 750,
                reputation: 200,
            }
        }
    },
    {
        id: 'personal_systems_course',
        name: 'Personalitöö ja tööaja arvestamise algkursus',
        description: 'Algkursus tundmaks personalitöö põhimõtteid ja tööaja arvestamist ja töötajate graafiku koostamist',
        duration: 14400,
        requirements: {
            level: 75,
            completedCourses: ['police_group_leader_course_advanced'],
            totalWorkedHours: 150
        },
        rewards: {
            experience: 12000,
            reputation: 600,
            money: 4500,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Milline seadus reguleerib töötaja töö tegemise aega ja palga maksmise korda?',
            answers: [
                'Töö- ja puhkeaja seadus',
                'Töölepingu seadus',
                'Töötamise seadus',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 1500,
                money: 500,
                reputation: 250,
            }
        }
    },
    {
        id: 'advanced_leader_course',
        name: 'Keskastme juhtide algkoolitus',
        description: 'Algkoolitus õppimaks juhtima suuremat struktuuri koos allüksuste ja nende juhtidega',
        duration: 28800,
        requirements: {
            level: 85,
            completedCourses: ['police_group_leader_course_advanced', 'personal_systems_course'],
            totalWorkedHours: 200
        },
        rewards: {
            experience: 30000,
            reputation: 2000,
            money: 15000,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Milline juhtimisstiil sobib kõige paremini olukorras, kus allüksus peab kiiresti reageerima ootamatule sündmusele?',
            answers: [
                'Autokraatlik - kiire otsuste tegemine ja selged käsud',
                'Demokraatlik – otsuste arutamine kogu meeskonnaga',
                'Laissez-faire – lasta meeskonnal ise otsuseid teha',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 3000,
                money: 2000,
                reputation: 400,
            }
        }
    },
];