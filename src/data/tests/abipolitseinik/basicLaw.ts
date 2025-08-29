// src/data/tests/abipolitseinik/basicLaw.ts
import { Test } from '../../../types';

export const BASIC_LAW_TEST: Test = {
    id: 'abipolitseinik_basic_law',
    name: 'Abipolitseiniku seadusandlus',
    description: 'Test põhiliste õigusaktide ja seaduste kohta abipolitseinikele',
    category: 'abipolitseinik',
    requiredCourses: ['basic_police'],
    baseReward: {
        experience: 50,
        reputation: 10
    },
    perfectScoreBonus: {
        pollid: 20
    },
    timeLimit: 15,
    questions: [
        {
            id: 'q1',
            question: 'Abipolitseinikuks võib nimetada?',
            answers: [
                'Abipolitseinikuks võib nimetada 18-aastaseks saanud vähemalt algharidusega Eesti kodaniku, ' +
                'kes oskab eesti keelt vähemalt C2-tasemel ning kes vastab abipolitseiniku kutsesobivuse nõuetele.',

                'Abipolitseinikuks võib nimetada 18-aastaseks saanud vähemalt põhiharidusega Eesti kodaniku, kes oskab ' +
                'eesti keelt vähemalt B2-tasemel ning kes vastab abipolitseiniku kutsesobivuse nõuetele',

                'Abipolitseinikuks võib nimetada 18-aastaseks saanud vähemalt keskharidusega Eesti kodaniku, kes ' +
                'oskab eesti keelt vähemalt B1-tasemel ning kes vastab abipolitseiniku kutsesobivuse nõuetele.',
            ],
            correctAnswerIndex: 1
        },
        {
            id: 'q2',
            question: 'Isikud, keda võetakase abipolitseinikuks?',
            answers: [
                'Kes on teovõimeline, karistatud tahtlikult toimepandud I.astme kuriteo eest, kes ei ole kriminaalmenetluses ' +
                'kahtlustatav või süüdistatav, kellelt on ära võetud kohtuotsusega töödata pol.ametnikuga ametikohal töötamise õigust, ' +
                'kes ei ole sõltuvuses alkoholi ega isiksuse- või käitumishäirega.',

                'kes on teovõimetu, ei ole karistatud tahtlikult toimepandud I.astme kuriteo eest,kes ei ole kriminaalmenetluses kahtlustatav või süüdistatav, ' +
                'kellelt ei ole jõustunud kohtuotsusega ära võetud pol.ametnikuga ametniku töötamise õigust, kes ei ole sellise tervisehäirega, mis takistab tal ' +
                'abipolitseiniku ülesannete täitmist',

                'kes on teovõimeline, ei ole karistatud tahtlikult toimepandud I.astme kuriteo eest, kes ei ole kriminaalmenetluses kahtlustatav ' +
                'või süüdistatav, kellelt ei ole jõustunud kohtuotsusega ära võetud pol.ametniku ametikohal töötamise õigust, kes ei ole sõltuvuses ' +
                'alkoholi ega isiksuse- või käitumishäirega'
            ],
            correctAnswerIndex: 2
        },
        {
            id: 'q3',
            question: 'Abipolitseiniku kandidaat peab läbima esimese astme õppe, kui kaua kestab esimese astme koolitus?',
            answers: [
                '40 tundi',
                '48 tundi',
                '50 tundi'
            ],
            correctAnswerIndex: 0
        },
        {
            id: 'q4',
            question: 'Kas abipolitseinik saab õiguse kanda teenistuses tulirelva?',
            answers: [
                'Abipolitseinik, kellel on abipolitseiniku ülesande täitmisel vajalik kanda tulirelva, peab lisaks esmaõppele läbima tulirelvaõppe. ' +
                'Tulirelva õpe kestab vähemalt 40 tundi ning lõpeb arvestusega',

                'Abipolitseinik, kellel on abipolitseiniku ülesande täitmisel vajalik kanda tulirelva, peab lisaks täiendõppele läbima tulirelvaõppe. ' +
                'Tulirelva õpe kestab vähemalt 48 tundi ning lõpeb arvestusega',

                'Abipolitseinik, kellel on abipolitseiniku ülesande täitmisel vajalik kanda tulirelva, peab lisaks täiendõppele läbima tulirelvaõppe. ' +
                'Tulirelva õpe kestab vähemalt 60 tundi ning lõpeb arvestusega'
            ],
            correctAnswerIndex: 0
        },
        {
            id: 'q5',
            question: 'Kas abipolitseinik saab õiguse kanda teenistuses elektrišokirelva?',
            answers: [
                'Abipolitseinik, kellel on abipolitseiniku ülesande täitmisel vajalik kanda elektrišokirelva, peab lisaks esmaõppele läbima elektrišokirelva õppe. ' +
                'Elektrišokipüstoli õpe kestab vähemalt 24 tundi ning lõpeb lasketestiga',

                'Abipolitseinik, kellel on abipolitseiniku ülesande täitmisel vajalik kanda elektrišokirelva, peab lisaks esmaõppele läbima elektrišokirelva õppe. ' +
                'Elektrišokirelva õpe kestab vähemalt 16 tundi ning lõpeb arvestusega.',

                'Abipolitseinik, kellel on abipolitseiniku ülesande täitmisel vajalik kanda elektrišokirelva, peab lisaks täiendõppele läbima elektrišokirelva õppe. ' +
                'Erivahendpüstoli õpe kestab vähemalt 16 tundi ning lõpeb arvestusega'
            ],
            correctAnswerIndex: 1
        },
        {
            id: 'q6',
            question: 'Abipolitseiniku kandidaat peab läbima esimese astme õppe, kui kaua kestab esimese astme koolitus?',
            answers: [
                '40 tundi',
                '48 tundi',
                '50 tundi'
            ],
            correctAnswerIndex: 0
        },
        {
            id: 'q7',
            question: 'Abipolitseiniku kandidaat peab läbima esimese astme õppe, kui kaua kestab esimese astme koolitus?',
            answers: [
                '40 tundi',
                '48 tundi',
                '50 tundi'
            ],
            correctAnswerIndex: 0
        },
        {
            id: 'q8',
            question: 'Abipolitseiniku kandidaat peab läbima esimese astme õppe, kui kaua kestab esimese astme koolitus?',
            answers: [
                '40 tundi',
                '48 tundi',
                '50 tundi'
            ],
            correctAnswerIndex: 0
        },
        {
            id: 'q9',
            question: 'Abipolitseiniku kandidaat peab läbima esimese astme õppe, kui kaua kestab esimese astme koolitus?',
            answers: [
                '40 tundi',
                '48 tundi',
                '50 tundi'
            ],
            correctAnswerIndex: 0
        },
        {
            id: 'q10',
            question: 'Abipolitseiniku kandidaat peab läbima esimese astme õppe, kui kaua kestab esimese astme koolitus?',
            answers: [
                '40 tundi',
                '48 tundi',
                '50 tundi'
            ],
            correctAnswerIndex: 0
        },
    ]
};