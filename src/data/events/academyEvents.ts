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
        id: 'hangover_after_hard_evening',
        title: 'Raske koolipäeva hommik',
        description: 'Eelmise õhtu saunapidu läks pikale. Ärkad ühikatoas hommikul ja tunned, et pole veel täielikult kaineks saanud. Kuid koolis on tähtsate õppeainete tunnid, kus peab kindlasti kohal olema',
        choices: [
            {
                id: 'stop_physically',
                text: 'Lähed tundi, kuid õppejõud tunneb alkoholilõhna',
                consequences: {
                    health: 20,
                    reputation: -15
                },
                resultText: 'Õppejõud saatis sind tunnist ära ühikasse kaineks magama, õppedistsipliin sai juhtunust teada. Halb!'
            },
            {
                id: 'call_security',
                text: 'Jääd ühikatuppa magama, kuna kardad, et jääd alkoholilõhnadega vahele',
                consequences: {
                    reputation: -10

                },
                resultText: 'Magasid end kaineks, aga pool päeva tundides ei osalenud.'
            },
            {
                id: 'follow_observe',
                text: 'Otsustad tundides osaleda',
                consequences: {
                    experience: 10
                },
                resultText: 'Seekord sul vedas, keegi ei tundnud alkoholilõhna. Ära rohkem nii tee!'
            }
        ],
        activityTypes: ['academy_guard_duty']
    },
    {
        id: 'invitation_to_marathon',
        title: 'Kutse Tartu rattamaratoni liikluse reguleerimisele',
        description: 'SKA pakub soovijatele osalemist nädalavahetusel toimuvale Tartu rattamaratonile. Sinu tööks on liikluse reguleerimine. Tasuta ööbimine, kütuse kompensatsioon ja väike lisaraha',
        choices: [
            {
                id: 'stop_physically',
                text: 'Otsustad osaleda',
                consequences: {
                    money: 100,
                    reputation: -10,
                    experience: 10
                },
                resultText: 'Osalesid rattamaratoni läbiviimisel, kuid seetõttu jäid koolitööd tegemata... '
            },
            {
                id: 'call_security',
                text: 'Ei soovi osaleda',
                consequences: {
                    experience: -5,
                    reputation: 10
                },
                resultText: 'Sa ei osalenud, seega jäid uutest kogemustest ilma, kuid jõudsid koolitöödega valmis'
            },

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