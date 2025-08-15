// src/components/tutorial/steps/trainingSteps.ts
import { TutorialStep } from '../types/tutorial.types';

export const TRAINING_CENTER_TUTORIAL_STEPS: TutorialStep[] = [
    {
        step: 11,
        targetElement: '.attributes-container',
        title: 'Treeningkeskus',
        content: 'Oled jõudnud treeningkeskusesse ja siin saad arendada oma mängija omadusi. Iga omadus mõjutab sinu võimekust erinevates olukordades.',
        position: 'bottom'
    },
    {
        step: 12,
        targetElement: '.training-counter',
        title: 'Treeningute limiit',
        content: 'Kuna treenimine ei saa kesta lõputult siis iga tund on võimalik mängijal sooritada kuni 50 korda igat tegevust. Iga täistund saab uuesti sooritada 50 kordust, kuid mitte rohkem.',
        position: 'bottom'
    },
    {
        step: 13,
        targetElement: '.activity-dropdown',
        title: 'Vali treening',
        content: 'Selleks, et alustada treeninguga palun vali siit menüüst, millist treeningut soovid alustada.',
        position: 'top',
        requiresAction: true
    },
    {
        step: 14,
        targetElement: '.train-button',
        title: 'Soorita treening',
        content: 'Nüüd oled valinud sobiva treeningu ja vajuta Treeni, et sooritada üks treeningu kordus.',
        position: 'top',
        requiresAction: true
    }
];

export const PATROL_INTRODUCTION_STEPS: TutorialStep[] = [
    {
        step: 15,
        targetElement: '.back-to-dashboard',
        title: 'Tagasi töölauale',
        content: 'Suurepärane! Oled omandanud põhilised oskused. Nüüd liigume tagasi töölauale, et alustada oma esimese patrulliga.',
        position: 'bottom',
        requiresAction: true
    }
];