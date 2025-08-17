import { WorkEvent } from '../../types/events.types';

export const PATROL_EVENTS: WorkEvent[] = [
    {
        id: 'youth_drinking',
        title: 'Noorte joomine',
        description: 'Patrulli ajal kohtasid gruppi noori, kes jõid alkoholi mahajäetud majas. Kui nad sind nägid, hakkasid nad eri suundades jooksma.',
        choices: [
            {
                id: 'chase_fall',
                text: 'Üritasid neid jälitada, kuid kukkusid trepil',
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
                resultText: 'Võtsid leitud raha endale. Teenisid 100€, kuid kaotasid maine.'
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
        description: 'Peatasid sõiduki liikluskontrolliks. Juht tundub närviline ja auto lõhnab kahtlaselt.',
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
        title: 'Kodune tüli',
        description: 'Naabrid on teatanud valjust tülist korteris. Kohal olles kuuled karjumist.',
        choices: [
            {
                id: 'immediate_entry',
                text: 'Sisestad korterisse kohe',
                consequences: {
                    health: -20,
                    experience: 30
                },
                resultText: 'Leidsid füüsilise konflikti ja sekkusid. Said kerge vigastuse.'
            },
            {
                id: 'knock_talk',
                text: 'Koputtad ja üritad rahulikult rääkida',
                consequences: {
                    reputation: 10
                },
                resultText: 'Konflikt lahenes rahumeelselt. Osapooled rahunes maha.'
            },
            {
                id: 'wait_backup',
                text: 'Ootad lisajõude',
                consequences: {
                    experience: -10
                },
                resultText: 'Kuni ootasid, rahunes olukord iseenesest. Kaotasid asjatult aega.'
            }
        ],
        activityTypes: ['patrol_third_member', 'patrol_second_member']
    }
];