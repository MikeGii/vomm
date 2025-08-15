// src/components/tutorial/steps/dashboardSteps.ts
import { TutorialStep } from '../types/tutorial.types';

export const DASHBOARD_MAIN_STEPS: TutorialStep[] = [
    {
        step: 1,
        targetElement: '.stats-card',
        title: 'Sinu karakteri andmed',
        content: 'Siin näed oma karakteri peamisi andmeid nagu tase, ametikoht, auaste, töökoha osakond ja reputatsioon. Samuti näed lahendatud juhtumite statistikat ja ka kokku tabatud kurjategijaid.',
        position: 'bottom'
    },
    {
        step: 2,
        targetElement: '.quick-actions-container',
        title: 'Kiirmenüü',
        content: 'Siin on sinu kiirmenüü tegevuste jaoks. Kuna hetkel oled töötu ja ei oma mingit politseilist väljaõpet, pead esmalt läbima abipolitseiniku koolituse, et alustada oma karjääri politsei ridades.',
        position: 'top'
    },
    {
        step: 3,
        targetElement: '.quick-action-button:first-child',
        title: 'Alusta koolitusega',
        content: 'Selleks, et esitada avaldus abipolitseiniku koolitusele vajuta koolitused nuppu.',
        position: 'top',
        requiresAction: true
    }
];

export const TRAINING_INTRODUCTION_STEPS: TutorialStep[] = [
    {
        step: 9,
        targetElement: '.stats-card',
        title: 'Õnnitleme!',
        content: 'Vägev, oled edukalt nüüd abipolitseinik ja saad alustada oma tegevusi. Esmalt peaksid end väheke treenima, et tulevikus tänavatel paremini hakkama saada ja selleks on sul nüüd võimalik kasutada enda prefektuuri treeningu võimalusi',
        position: 'bottom'
    },
    {
        step: 10,
        targetElement: '.quick-action-button:nth-child(2)',
        title: 'Treeningu alustamine',
        content: 'Jätkamiseks liigume treeningu lehele',
        position: 'top',
        requiresAction: true
    }
];

export const PATROL_DASHBOARD_STEPS: TutorialStep[] = [
    {
        step: 16,
        targetElement: '.quick-action-button:nth-child(3)',
        title: 'Esimene patrull',
        content: 'Nüüd oled valmis minema oma esimesele patrullile! Abipolitseinikuna saad osaleda patrullides ja saada väärtuslikke kogemusi.',
        position: 'top',
        requiresAction: true
    }
];