import { WorkEvent } from '../../types/events.types';

export const PATROL_EVENTS: WorkEvent[] = [
    {
        id: 'youth_drinking',
        title: 'Noorte alkoholi tarbimine',
        description: 'Patrulli ajal kohtasid gruppi noori, kes jõid alkoholi mahajäetud majas. Kui nad sind nägid, hakkasid nad eri suundades jooksma.',
        choices: [
            {
                id: 'chase_fall',
                text: 'Üritasid neid jälitada, kuid kukkusid trepil.',
                consequences: {
                    health: -70,
                    money: 1000
                },
                resultText: 'Kukkusid trepil ja sind viidi haiglasse. Said tööõnnetuse hüvitiseks 1000€.'
            },
            {
                id: 'take_money',
                text: 'Ei jälitanud, kuid leidsid riiulilt 100€ ja võtsid selle',
                consequences: {
                    money: 100,
                    reputation: -10
                },
                resultText: 'Võtsid leitud raha endale. Teenisid 100€, kuid kaotasid maine, sest selline käitumine pole lubatud.'
            },
            {
                id: 'call_backup',
                text: 'Ignoreerisid põgenevaid noori ja kutsusid abi',
                consequences: {},
                resultText: 'Kutsusid teised patrullid appi. Olukord lahenes rahulikult.'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    },
    {
        id: 'traffic_stop',
        title: 'Liikluskontroll',
        description: 'Peatasid sõiduki liikluskontrolliks. Juht tundub närviline ja autos lõhnab kahtlaselt.',
        choices: [
            {
                id: 'thorough_search',
                text: 'Teed põhjaliku kontrolli',
                consequences: {
                    experience: 50,
                    reputation: 5
                },
                resultText: 'Leidsid auto pagasnikust varastatud kaupa. Juht vahistati. Hea töö!'
            },
            {
                id: 'quick_warning',
                text: 'Annad kiire hoiatuse ja lased minna',
                consequences: {
                    reputation: -5
                },
                resultText: 'Juht sõitis minema. Hiljem selgus, et tegemist oli tagaotsitavaga.'
            },
            {
                id: 'call_k9',
                text: 'Kutsud koerteüksuse',
                consequences: {
                    experience: 25
                },
                resultText: 'Koerteüksus ei leidnud midagi. Juht oli lihtsalt närviline.'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    },
    {
        id: 'domestic_dispute',
        title: 'Lähisuhtevägivald',
        description: 'Naabrid on teatanud valjust tülist korteris. Kohal olles kuuled karjumist.',
        choices: [
            {
                id: 'immediate_entry',
                text: 'Sisened kohe korterisse',
                consequences: {
                    health: -20,
                    experience: 30
                },
                resultText: 'Nägid füüsilist konflikti ja sekkusid. Said kerge vigastuse.'
            },
            {
                id: 'knock_talk',
                text: 'Koputad ja üritad rahulikult rääkida',
                consequences: {
                    reputation: 10
                },
                resultText: 'Konflikt lahenes rahumeelselt. Osapooled rahunes maha.'
            },
            {
                id: 'wait_backup',
                text: 'Ootad lisajõude',
                consequences: {},
                resultText: 'Kuni ootasid, rahunes olukord iseenesest. Kaotasid asjatult aega.'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    },
    {
        id: 'youth_smoking',
        title: '3 noort tarvitavad tubakatooteid õues',
        description: 'Patrulli ajal kohtasid 3 noort noorukit, kes tarvitasid tubakat, otsustasid kontrollida,' +
            ' noored näitasid keskmist sõrme ja hakkasid jooksma patrulli eest.',
        choices: [
            {
                id: 'chase_fall',
                text: 'Üritasid neid jälitada, kuid joostes kukkusid ja vigastasid jala.',
                consequences: {
                    health: -40,
                    money: 500
                },
                resultText: 'Said kerge jalatrauma ja sind viidi PERH-i EMO’sse. Vormistasid tööõnnetuse ning said PPA poolt hüvitiseks 500€.'
            },
            {
                id: 'take_money',
                text: 'Ei hakanud jooksma, kuid leidsid maast 70€ ja võtsid selle',
                consequences: {
                    money: 70,
                    reputation: -10
                },
                resultText: 'Võtsid maast leitud raha endale. Teenisid 70€, kuid kaotasid maine, sest selline käitumine pole lubatud.'
            },
            {
                id: 'call_backup',
                text: 'Ignoreerisid põgenevaid noori ja jätkasid patrulli, kuna ei pidanud vajalikuks neid taga ajada.',
                consequences: {},
                resultText: 'Noored jooksid ära ja jätkasid teenistust.'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    },
    {
        id: 'traffic_speeding',
        title: 'Liiklusjärelevalve',
        description: 'Liiklusjärelevalvet teostades asulasisesel teel peatad sõiduki, mis liikus 50 km/h alas 95km/h. Sõiduki juhiks osutub Poola rahvusest isik' +
            ' ning ta pakub sulle 400eur, et sa talle trahvi ei teeks.',
        choices: [
            {
                id: 'chase_fall',
                text: 'Võtad raha vastu ning teed talle suulise hoiatuse',
                consequences: {
                    reputation: -20,
                    money: 400
                },
                resultText: 'Võtsid raha endale. Juht tänas sind, kuid kaotasid maine, kuna selline tegevus ei ole politseinikule lubatud.'
            },
            {
                id: 'take_money',
                text: 'Keeldud sellest ettepanekust, kuid teed talle kiiruse ületamise eest suulise hoiatuse',
                consequences: {
                    reputation: -5,
                },
                resultText: 'Keeldusid ettepanekust, kuid üldjuhul selliste kiiruste ületamise puhul  suulisi hoiatusi ei rakenda.'
            },
            {
                id: 'call_backup',
                text: 'Keeldud sellest ettepanekust ning alustad menetlust',
                consequences: {},
                resultText: 'Tegid juhile kiirmenetluse.'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    },
    {
        id: 'helping_teammate',
        title: 'Patrullpaarilise aitamine',
        description: 'Patrulli ajal soovib patrullpaariline, et sa läheksid temaga tema' +
            ' juurde õhtuseks peoks ettevalmistusi tegema. Ta on nõus sulle selle eest maksma.',
        choices: [
            {
                id: 'chase_fall',
                text: 'Oled nõus ja lähed talle appi',
                consequences: {
                    reputation: -5,
                    money: 100
                },
                resultText: 'Olid nõus ja läksid talle appi, teil kulus aega üle kahe tunni ning seetõttu magasite tööhoos "B" prioriteediga kutse maha.'
            },
            {
                id: 'take_money',
                text: 'Ütled talle viisakalt, et töö ajal kõrvaliste tegevustega tegelemine pole eetiline.',
                consequences: {
                    health: -20,
                    reputation: 10
                },
                resultText: 'Selle lause peale paariline solvus ja terve vahetus möödus vaikuses, see mõjus sulle vaimselt halvasti'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    },
    {
        id: 'night_patrol',
        title: 'Öise vahetuse patrull',
        description: 'Öises vahetuses kell 04:14 oled patrullsõiduki roolis ning tunned, et silmad vajuvad kinni. Kõrvalistuja on esmase juhiloa omanik.',
        choices: [
            {
                id: 'chase_fall',
                text: 'Jääd sõidukiga seisma ja palud paarilisel patrullsõidukit edasi juhtida',
                consequences: {
                    reputation: -5,
                    health: 30
                },
                resultText: 'Jäid sõidukiga seisma ning paariline juhtis sõidukit edasi, kuid saite "B" prioriteediga väljakutse ning lubasid paarilisel alarmsõitu teha, ' +
                    'mida esmase juhiloa omanik teha ei tohi.'
            },
            {
                id: 'take_money',
                text: 'Juhid sõidukit edasi ja ei teavita paarilist enda väsimusest',
                consequences: {
                    health: -20,

                },
                resultText: 'Seekord vedas, ei juhtunud midagi, kuid väsimus mõjus su tervisele. '
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    },
    {
        id: 'traffic_insurance_technical',
        title: 'Ülevaatuse ja kindlustuseta sõiduk',
        description: 'Sõidate paarilisega väljakutselt jaoskonna poole. Patrullvahetuse lõpuni on mõned minutid ja' +
            ' politsei andmebaasist vastutulevale sõidukile kiirpäringut tehes selgub, et sõidukil puuduvad ülevaatus ja kindlustus 2 aastat',
        choices: [
            {
                id: 'chase_fall',
                text: 'Ei tegele sellega, kuna vahetus hakkab lõppema ja tahaksite juba jaoskonda jõuda.',
                consequences: {
                    reputation: -5,
                    health: 20
                },
                resultText: 'Ülevaatuse ja kindlustuse puudumisele lisaks puudus juhil vastava kategooria juhtimisõigus, kaotasid maine, kuid jõuad enamvähem õigel ajal jaoskonda.'
            },
            {
                id: 'take_money',
                text: 'Otsustate sõidukit ja selle juhti kontrollida',
                consequences: {
                    health: -20,
                    reputation: 15
                },
                resultText: 'Ülevaatuse ja kindlustuse puudumisele lisaks puudus sõidukit juhtinud isikul juhtimisõigus, ning teda on lähiajal korduvalt juhtimiselt kõrvaldatud. Pidasite sõidukijuhi kinni ning toimetasite ta arestimajja, teil läks patrullvahetus 2h üle. Tublid!'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    }
];