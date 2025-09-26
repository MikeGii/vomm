// src/data/courses/politseiCourses.ts
import { Course } from '../../types';

export const POLITSEI_COURSES: Course[] = [
    // Entry-level courses requiring only lopueksam
    {
        id: 'medical_course_police',
        name: 'Meditsiini täiendõpe',
        description: 'Koolitus efektiivseks ja kiireks esmaabi andmiseks',
        duration: 10800,
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
        id: 'police_ground_leader_course',
        name: 'Välijuhi koolitus 1. päev',
        description: 'Koolitus edukaks välitöö juhtimiseks',
        duration: 14400,
        requirements: {
            level: 35,
            completedCourses: ['lopueksam'],
            totalWorkedHours: 60,
            attributes: {
                intelligence: 50,
                dexterity: 40,
            }
        },
        rewards: {
            experience: 1500,
            reputation: 150,
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
        id: 'enhanced_law_studies',
        name: 'Süüteomenetluse täiendkoolitus',
        description: 'Koolitus põhjalikumaks süüteomenetluse läbiviimiseks',
        duration: 18000,
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
        id: 'basic_computer_course',
        name: 'Arvutisüsteemide algkoolitus',
        description: 'Baasõpe ja sissejuhatus IT süsteemidesse',
        duration: 14400,
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

    // Second tier courses - requiring one basic course
    {
        id: 'police_ground_leader_course_02',
        name: 'Välijuhi koolitus 2. päev',
        description: 'Koolitus edukaks välitöö juhtimiseks',
        duration: 14400,
        requirements: {
            level: 38,
            completedCourses: ['police_ground_leader_course'],
            totalWorkedHours: 60,
            attributes: {
                intelligence: 53,
                dexterity: 42,
            }
        },
        rewards: {
            experience: 2000,
            reputation: 150,
            money: 2000
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on "välijuht" kui sõna definitsioon?',
            answers: [
                'Ametikoht',
                'Tööülesanne',
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
        id: 'riot_police_course',
        name: 'Massiohje koolitus 1. päev',
        description: 'Koolitus teadmiste omandamiseks ja tegutsemiseks massirahutuste korral',
        duration: 14400,
        requirements: {
            level: 40,
            completedCourses: ['medical_course_police'],
            totalWorkedHours: 50,
            attributes: {
                strength: 40,
                endurance: 50,
            }
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
        duration: 14400,
        requirements: {
            level: 45,
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
        id: 'advanced_computer_skills',
        name: 'Arvutisüsteemide täiendkoolitus 1. osa',
        description: 'Täiendkoolitus arvutivõrkude ja IT süsteemidest edasijõudnutele',
        duration: 18000,
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

    // Third tier courses - requiring second tier courses
    {
        id: 'riot_police_course_02',
        name: 'Massiohje koolitus 2. päev',
        description: 'Koolitus teadmiste omandamiseks ja tegutsemiseks massirahutuste korral',
        duration: 14400,
        requirements: {
            level: 42,
            completedCourses: ['riot_police_course'],
            totalWorkedHours: 50,
            attributes: {
                strength: 45,
                endurance: 55,
            }
        },
        rewards: {
            experience: 2000,
            reputation: 175,
            money: 1500,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mis riigi massiohje taktikat ja algoritmi Eestis kasutatakse 2025 aastast?',
            answers: [
                'Läti',
                'Soome',
                'Norra',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 550,
                money: 500,
                reputation: 75,
            }
        }
    },
    {
        id: 'medical_course_police_advanced',
        name: 'Põhjalik esmaabi ja taktikalise meditsiini koolitus 1. päev',
        description: 'Koolitus efektiivse esmaabi andmiseks ja tegutsemine lahingolukorras meedikuna 1. päev',
        duration: 18000,
        requirements: {
            level: 65,
            completedCourses: ['medical_course_police'],
            totalWorkedHours: 120,
            attributes: {
                intelligence: 70,
                agility: 50,
            }
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
        id: 'detective_course',
        name: 'Jälitustegevuse ja profileerimise kursus',
        description: 'Koolitus jälitustegevuse õiguslikeks alusteks, praktilised käitumisjuhendid ja isikute profileerimine',
        duration: 18000,
        requirements: {
            level: 50,
            completedCourses: ['evidence_place_course'],
            totalWorkedHours: 80,
            attributes: {
                intelligence: 80,
            }
        },
        rewards: {
            experience: 4500,
            reputation: 400,
            money: 3000,
        },
        category: 'politsei'
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
        id: 'advanced_computer_skills_02',
        name: 'Arvutisüsteemide täiendkoolituse 2. osa',
        description: 'Täiendkoolitus arvutivõrkude ja IT süsteemidest edasijõudnutele 2. osa',
        duration: 18000,
        requirements: {
            level: 55,
            completedCourses: ['advanced_computer_skills'],
            totalWorkedHours: 80
        },
        rewards: {
            experience: 7500,
            reputation: 350,
            money: 3000
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on peamine erinevus 32-bitise ja 64-bitise operatsioonisüsteemi vahel?',
            answers: [
                '32-bit saab kasutada kuni 4GB mälu, 64-bit saab kasutada palju rohkem mälu',
                '32-bit töötab ainult vanemate programmidega, 64-bit ainult uute programmidega',
                '32-bit on kiirem igapäevasteks ülesanneteks, 64-bit on aeglasem',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 1000,
                money: 700,
                reputation: 120,
            }
        }
    },
    {
        id: 'cyber_crime_course',
        name: 'Küberturvalisuse baaskursus 1. osa',
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
        id: 'police_group_leader_course',
        name: 'Grupijuhi teadmiste koolitus',
        description: 'Koolitus ja ettevalmistus meeskonna juhtimiseks ja grupijuhi ülesannete täitmiseks',
        duration: 18000,
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

    // Fourth tier courses - requiring third tier courses
    {
        id: 'medical_course_police_advanced_02',
        name: 'Põhjalik esmaabi ja taktikalise meditsiini koolitus 2. päev',
        description: 'Koolitus efektiivse esmaabi andmiseks ja tegutsemine lahingolukorras meedikuna',
        duration: 21600,
        requirements: {
            level: 75,
            completedCourses: ['medical_course_police_advanced'],
            totalWorkedHours: 150,
            attributes: {
                intelligence: 90,
                agility: 60,
            }
        },
        rewards: {
            experience: 12500,
            reputation: 600,
            money: 5500,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Žguti paigaldamisel jäsemele tuleb:',
            answers: [
                'Pingutada kuni arteriaalse pulsi kadumiseni, lisada 1-2 täiendavat pööret',
                'Pingutada kuni verejooksu peatumiseni ja märkida kellaaeg',
                'Paigaldada alati kahekordne žgutt maksimaalse efektiivsuse tagamiseks',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 2500,
                money: 800,
                reputation: 300,
            }
        }
    },
    {
        id: 'dog_master_course_01',
        name: 'Loomade empaatia ja käitumismustrite kooltius 1. päev',
        description: 'Koolitus rahvusvaheliste loomaekspertide poolt. Õpid tundma loomade evolutsiooni ja käitumismustreid läbi ajaloo',
        duration: 18000,
        requirements: {
            level: 70,
            completedCourses: ['dog_specialist_course'],
            totalWorkedHours: 150
        },
        rewards: {
            experience: 12500,
            reputation: 650,
            money: 6000,
            grantsAbility: 'doggys_master',
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Milline evolutsiooniline muutus eristas esimesi koeri huntidest umbes 30 000 aastat tagasi?',
            answers: [
                'Lühemad jalad ja väiksem kehasuurus',
                'Valge karvavärv ja lõõgastunud kõrvad',
                'Vähenenud agressiivsus ja suurenenud sotsiaalsus inimestega',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 2000,
                money: 1750,
                reputation: 175,
            }
        }
    },
    {
        id: 'detective_course_advanced_01',
        name: 'Jälituse ja profileerimise täiendkursus 1.päev',
        description: 'Täiendav kursus jälitustegevuse ja profileerimise kohta. Külalisõppejõud väliriigi luureametist',
        duration: 18000,
        requirements: {
            level: 60,
            completedCourses: ['detective_course'],
            totalWorkedHours: 150,
            attributes: {
                intelligence: 160,
                dexterity: 150
            }
        },
        rewards: {
            experience: 12000,
            reputation: 600,
            money: 6000,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Kus võib toimuda piiriülene jälitamine?',
            answers: [
                'Üle vee- ja maismaapiiride',
                'Üle vee-, maismaa- ja õhupiiride',
                'Üle maismaapiiride',
            ],
            correctAnswerIndex: 2,
            rewards: {
                experience: 2500,
                money: 800,
                reputation: 125,
            }
        }
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
                'Meditsiinilisel ja teaduslikul eermärgil',
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
        id: 'cyber_crime_course_02',
        name: 'Küberturvalisuse baaskursus 2. osa',
        description: 'Baaskoolitus küberturvalisuse teadmistest 2. osa',
        duration: 21600,
        requirements: {
            level: 60,
            completedCourses: ['cyber_crime_course'],
            totalWorkedHours: 100
        },
        rewards: {
            experience: 7500,
            reputation: 250,
            money: 3000
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Mis on peamine erinevus SQL injektiooni (SQL Injection) ja Cross-Site Scripting (XSS) ' +
                'rünnakute vahel küberjulgeoleku kontekstis?',
            answers: [
                'SQL injection ründab andmebaasi struktuuri, XSS ründab kasutaja brauserit',
                'SQL injection töötab serveripoolel, XSS töötab kliendipoolel',
                'SQL injection kasutab pahatahtlikke SQL käske, XSS kasutab pahatahtlikku JavaScripti',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 1500,
                money: 500,
                reputation: 100,
            }
        }
    },
    {
        id: 'police_group_leader_course_advanced',
        name: 'Grupijuhi täiendkoolitus',
        description: 'Grupijuhi täiendkoolitus edukaks grupi manageerimiseks ja juhtimiseks koos püshholoogia põhitõdedega',
        duration: 28800,
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

    // Fifth tier courses - requiring fourth tier courses
    {
        id: 'detective_course_advanced_02',
        name: 'Jälituse ja profileerimise täiendkursus 2.päev',
        description: 'Täiendav kursus jälitustegevuse ja profileerimise kohta. Külalisõppejõud väliriigi luureametist',
        duration: 18000,
        requirements: {
            level: 60,
            completedCourses: ['detective_course_advanced_01'],
            totalWorkedHours: 150,
            attributes: {
                intelligence: 165,
                dexterity: 155
            }
        },
        rewards: {
            experience: 12000,
            reputation: 600,
            money: 6000,
            grantsAbility: 'master_detective'
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Milline FBI üksus tegeleb rahvusvahelise kuritegevuse uurimisega ja koostööga välisriikide politseiga?',
            answers: [
                'Criminal Investigation Division (CID)',
                'Legal Attaché Program (Legat)',
                'Counterterrorism Division (CTD)',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 1500,
                money: 800,
                reputation: 125,
            }
        }
    },
    {
        id: 'dog_master_course_02',
        name: 'Loomade empaatia ja käitumismustrite kooltius 2. päev',
        description: 'Koolitus rahvusvaheliste loomaekspertide poolt. Õpid tundma loomade evolutsiooni ja käitumismustreid läbi ajaloo',
        duration: 21600,
        requirements: {
            level: 75,
            completedCourses: ['dog_master_course_01'],
            totalWorkedHours: 150,
            attributes: {
                intelligence: 185,
                dexterity: 155,
                agility: 160,
            }
        },
        rewards: {
            experience: 12500,
            reputation: 650,
            money: 6000,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Millist koera tõugu kasutati esmakordselt sõjaväelistes operatsioonides Vana-Roomas?',
            answers: [
                'Molossus - suur võitluskoer',
                'Saluki - kiire jahikoer',
                'Spitz - vahikoer',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 1000,
                money: 750,
                reputation: 125,
            }
        }
    },
    {
        id: 'anatomic_basic_course',
        name: 'Anatoomia baaskursus',
        description: 'Kursus, kus õpid tundma inimese anatoomiat, mis käsitleb ka endas kehavigastusi ja nende tekke põhjuseid.',
        duration: 21600,
        requirements: {
            level: 70,
            completedCourses: ['forensics_basics'],
            totalWorkedHours: 150,
            attributes: {
                intelligence: 140,
            }
        },
        rewards: {
            experience: 12500,
            reputation: 800,
            money: 7000,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Kuidas tekivad surnulaigud (livor mortis) kehal pärast surma?',
            answers: [
                'Veri settib gravitatsiooni mõjul allapoole surutud kehaosadesse 6-12 tunni jooksul',
                'Verevalumid tekivad kohe pärast surma üle kogu keha',
                'Veri koondub ainult südame ja kopsu piirkonda',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 2500,
                money: 800,
                reputation: 225,
            }
        }
    },
    {
        id: 'anatomic_advanced_course',
        name: 'Anatoomia täiendkursus',
        description: 'Kursus, kus õpid tundma täiendavalt inimese anatoomiat, mis käsitleb ka endas kehavigastusi ja nende tekke põhjuseid.',
        duration: 25200,
        requirements: {
            level: 85,
            completedCourses: ['anatomic_basic_course'],
            totalWorkedHours: 220,
            attributes: {
                intelligence: 180,
            }
        },
        rewards: {
            experience: 17500,
            reputation: 1200,
            money: 12000,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Milline on rigor mortis’e (krambilaadsed lihasjäikused) kujunemise õige järjestus ja ajaraam pärast surma?',
            answers: [
                'Algab väikestes lihastes (nägu, kael) 2–4 tunni jooksul, levib kogu kehasse 12 tunni jooksul ja taandub 24–48 tunni möödudes',
                'Algab suurtes lihasgruppides (jalad, selg) kohe pärast surma ja püsib kuni 72 tundi',
                'Kogu keha jäikus tekib samaaegselt umbes 1 tunni jooksul ja kaob alles nädal hiljem',
            ],
            correctAnswerIndex: 0,
            rewards: {
                experience: 5000,
                money: 2000,
                reputation: 900,
            }
        }
    },
    {
        id: 'personal_systems_course',
        name: 'Personalitöö ja tööaja arvestamise algkursus',
        description: 'Algkursus tundmaks personalitöö põhimõtteid ja tööaja arvestamist ja töötajate graafiku koostamist',
        duration: 18000,
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

    // Final tier courses - highest level management
    {
        id: 'advanced_leader_course',
        name: 'Keskastme juhtide algkoolitus',
        description: 'Algkoolitus õppimaks juhtima suuremat struktuuri koos allüksuste ja nende juhtidega',
        duration: 43200,
        requirements: {
            level: 85,
            completedCourses: ['police_group_leader_course_advanced', 'personal_systems_course'],
            totalWorkedHours: 200,
            attributes: {
                intelligence: 200,
            }
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
    {
        id: 'advanced_leader_course_01',
        name: 'Keskastme juhtide täiendkoolituse 1. päev',
        description: 'Täiendkoolitus, kuidas juhtida ja hallata struktuuriüksust efektiivselt 1. päev',
        duration: 43200,
        requirements: {
            level: 100,
            completedCourses: ['advanced_leader_course'],
            totalWorkedHours: 400,
            attributes: {
                intelligence: 350,
                dexterity: 300
            }
        },
        rewards: {
            experience: 60000,
            reputation: 5000,
            money: 35000,
        },
        category: 'politsei'
    },
    {
        id: 'advanced_leader_course_02',
        name: 'Keskastme juhtide täiendkoolituse 2. päev',
        description: 'Täiendkoolitus, kuidas juhtida ja hallata struktuuriüksust efektiivselt 2. päev',
        duration: 43200,
        requirements: {
            level: 105,
            completedCourses: ['advanced_leader_course_01'],
            totalWorkedHours: 450,
            attributes: {
                intelligence: 370,
                dexterity: 310
            }
        },
        rewards: {
            experience: 80000,
            reputation: 5500,
            money: 37500,
        },
        category: 'politsei'
    },
    {
        id: 'personal_systems_course_advanced',
        name: 'Personali manageerimise täiendkursus',
        description: 'Täiendkursus, kuidas manageerida suuremat personali ning kuidas efektiivselt jagada tööaega ja koormust ilma töö kvaliteedis' +
            ' kaotamata',
        duration: 28800,
        requirements: {
            level: 105,
            completedCourses: ['personal_systems_course', 'advanced_leader_course'],
            totalWorkedHours: 450,
            attributes: {
                intelligence: 400
            }
        },
        rewards: {
            experience: 70000,
            reputation: 5000,
            money: 35000,
        },
        category: 'politsei',
        completionQuestion: {
            question: 'Milline alljärgnevatest on Eesti tööõiguses kehtiv põhimõte töötajate töökoormuse jaotamisel?',
            answers: [
                'Tööandja peab igale töötajale tagama vähemalt 10-tunnise tööpäeva',
                'Tööandja ei tohi ületada töötaja kokkulepitud tööaega, välja arvatud seaduses sätestatud juhtudel',
                'Tööandja võib ühepoolselt pikendada töötaja töölepingut ilma kokkuleppeta',
            ],
            correctAnswerIndex: 1,
            rewards: {
                experience: 5000,
                money: 3500,
                reputation: 2500,
            }
        }
    },


    // Final exams to the specific department unit leader position

    // Patrol department unit leader exam
    {
        id: 'patrol_department_unit_leader_exam',
        name: 'Juhieksam avaliku korra kaitse ja esmareageerijate tööspetsiifikas',
        description: 'Eksam kindlustamaks talituse juhi tasandil efektiivseks töökorralduseks ja ülesannete delegeerimiseks allüksustele',
        duration: 18000,
        requirements: {
            level: 95,
            completedCourses: ['advanced_leader_course_01'],
            totalWorkedHours: 250
        },
        rewards: {
            experience: 30000,
            reputation: 4500,
            money: 9000,
        },
        category: 'politsei'
    },

    // Procedural department unit leader exam
    {
        id: 'procedural_department_unit_leader_exam',
        name: 'Juhieksam menetluslikus tööspetsiifikas ja süüteomenetluslikus õigusteaduses',
        description: 'Eksam kindlustamaks talituse juhi tasandil efektiivseks töökorralduseks ja ülesannete delegeerimiseks allüksustele',
        duration: 18000,
        requirements: {
            level: 95,
            completedCourses: ['advanced_leader_course_02'],
            totalWorkedHours: 250
        },
        rewards: {
            experience: 30000,
            reputation: 4500,
            money: 9000,
        },
        category: 'politsei'
    },

    {
        id: 'expert_leader_course_01',
        name: 'Jaoskonna tasandil juhtimise koolitus 1. tsemester',
        description: 'Koolitus suurte struktuuriüksuste juhtimiseks ja koostöö teiste struktuuridega esimene täiendõppe tsemester',
        duration: 86400,
        requirements: {
            level: 145,
            completedCourses: ['advanced_leader_course_02'],
            totalWorkedHours: 1250,
            attributes: {
                intelligence: 750,
                dexterity: 675,
                endurance: 650,
                agility: 600
            }
        },
        rewards: {
            experience: 450000,
            reputation: 25000,
            money: 150000,
        },
        category: 'politsei'
    },
    {
        id: 'expert_leader_course_02',
        name: 'Jaoskonna tasandil juhtimise koolitus 2. tsemester',
        description: 'Koolitus suurte struktuuriüksuste juhtimiseks ja koostöö teiste struktuuridega teine täiendõppe tsemester',
        duration: 86400,
        requirements: {
            level: 150,
            completedCourses: ['expert_leader_course_01'],
            totalWorkedHours: 1350,
            attributes: {
                intelligence: 850,
                dexterity: 725,
                endurance: 700,
                agility: 650
            }
        },
        rewards: {
            experience: 850000,
            reputation: 35000,
            money: 175000,
        },
        category: 'politsei'
    },
    {
        id: 'expert_leader_course_03',
        name: 'Talituse erialane spetsiifika koolitus kõrgematele juhtidele',
        description: 'Kursus jaoskonna juhi positsioonile eelduseks, et kõikide allüksuste tööspetsiifika oleks tuttav',
        duration: 28800,
        requirements: {
            level: 155,
            completedCourses: ['expert_leader_course_02', 'patrol_department_unit_leader_exam', 'procedural_department_unit_leader_exam'],
            totalWorkedHours: 1350,
            attributes: {
                intelligence: 875,
                dexterity: 775,
                endurance: 750,
                agility: 675
            }
        },
        rewards: {
            experience: 1150000,
            reputation: 45000,
            money: 225000,
        },
        category: 'politsei'
    },
];