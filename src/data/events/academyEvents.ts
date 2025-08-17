import { WorkEvent } from '../../types/events.types';

export const ACADEMY_EVENTS: WorkEvent[] = [
    {
        id: 'academy_visitor_suspicious',
        title: 'Kahtlane külastaja',
        description: 'Valvelauas töötades märkad kahtlaselt käituvat külastajat, kes üritab minna piiratud alale.',
        choices: [
            {
                id: 'stop_physically',
                text: 'Peatad füüsiliselt',
                consequences: {
                    health: -10,
                    experience: 20
                },
                resultText: 'Peatad isiku, kes osutus eksinu tudengiks. Said kerge tõuke.'
            },
            {
                id: 'call_security',
                text: 'Kutsud turvameeskonna',
                consequences: {
                    reputation: 5
                },
                resultText: 'Turvameeskond peatas isiku professionaalselt. Hea meeskonnatöö!'
            },
            {
                id: 'follow_observe',
                text: 'Jälgid ja vaatled',
                consequences: {
                    experience: 10
                },
                resultText: 'Isik lahkus ise, kui märkas sind jälgimas. Olukord lahenes.'
            }
        ],
        activityTypes: ['academy_guard_duty']
    },
    {
        id: 'practice_mistake',
        title: 'Praktika viga',
        description: 'Praktika ajal jaoskonnas tegid vormistamisel vea. Vanem ametnik märkas seda.',
        choices: [
            {
                id: 'admit_mistake',
                text: 'Tunnistad vea kohe üles',
                consequences: {
                    reputation: 10,
                    experience: 15
                },
                resultText: 'Vanem ametnik hindas ausust ja õpetas, kuidas paremini teha.'
            },
            {
                id: 'try_fix_secretly',
                text: 'Üritad salaja parandada',
                consequences: {
                    reputation: -15
                },
                resultText: 'Jäid vahele parandusi tehes. Vanem ametnik oli pettunud.'
            },
            {
                id: 'blame_system',
                text: 'Süüdistad arvutisüsteemi',
                consequences: {
                    experience: -20
                },
                resultText: 'Vanem ametnik nägi läbi vabanduse. Kaotasid usaldusväärsust.'
            }
        ],
        activityTypes: ['academy_police_practice']
    }
];