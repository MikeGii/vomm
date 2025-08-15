// src/components/tutorial/steps/patrolSteps.ts
import { TutorialStep } from '../types/tutorial.types';

export const PATROL_PAGE_STEPS: TutorialStep[] = [
    {
        step: 17,
        targetElement: '.patrol-container',
        title: 'Patrullteenistus',
        content: 'Tere tulemast patrullteenistusse! Siin saad valida tööülesandeid ja teenida kogemuspunkte.',
        position: 'top'
    },
    {
        step: 18,
        targetElement: '.health-display',
        title: 'Tervise näitaja',
        content: 'See on sinu tervis, mis sõltub jõu ja vastupidavuse omadustest. Töötamiseks peab tervis olema vähemalt 50.',
        position: 'bottom'
    },
    {
        step: 19,
        targetElement: '.patrol-container',
        title: 'Töötamise piirangud',
        content: 'Pea meeles: töötamise ajal ei saa võtta koolitusi, kuid saad treenida piiratud mahus (10 korda tunnis).',
        position: 'top'
    },
    {
        step: 20,
        targetElement: '.department-selector',
        title: 'Vali piirkond',
        content: 'Abipolitseinikuna saad valida, millises piirkonnas soovid patrullida. Vali endale sobiv piirkond.',
        position: 'bottom',
        requiresAction: true
    },
    {
        step: 21,
        targetElement: '.work-activity-selector',
        title: 'Vali tööülesanne',
        content: 'Vali tööülesanne ja määra, mitu tundi soovid töötada. Õpetuse jaoks valime 1 tunni, mis kestab vaid 20 sekundit.',
        position: 'top',
        requiresAction: true
    },
    {
        step: 22,
        targetElement: '.active-work-banner',
        title: 'Töö käib',
        content: 'Suurepärane! Sa töötad nüüd. Oota, kuni töö lõppeb. Õpetuse režiimis kestab see vaid 20 sekundit.',
        position: 'bottom'
    },
    {
        step: 23,
        targetElement: '.work-history',
        title: 'Tööajalugu',
        content: 'Siin näed oma kõiki tehtud töid. Iga töö kohta on näha kuupäev, piirkond, tegevus, töötatud tunnid ja teenitud kogemuspunktid. Õnnitleme! Oled edukalt läbinud õpetuse!',
        position: 'top'
    },
    {
        step: 24,
        targetElement: '.patrol-container',
        title: 'Õpetus läbitud!',
        content: 'Õnnitleme! Nüüd tead peamisi tegevusi ja oled edukalt lõpetanud õpetuse. Head mängu!',
        position: 'top'
    }
];