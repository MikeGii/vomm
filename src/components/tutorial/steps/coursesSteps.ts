// src/components/tutorial/steps/coursesSteps.ts
import { TutorialStep } from '../types/tutorial.types';

export const COURSES_TUTORIAL_STEPS: TutorialStep[] = [
    {
        step: 4,
        targetElement: '.courses-container',
        title: 'Koolituste lehekülg',
        content: 'Siin leheküljel näed koolitusi, mida on sul võimalik läbida ja ka neid koolitusi, mis on sul juba läbitud.',
        position: 'top'
    },
    {
        step: 5,
        targetElement: '#basic_police_training',
        title: 'Abipolitseiniku baaskoolitus',
        content: 'Praegu on sul võimalik läbida abipolitseiniku baaskursus ning läbi selle alustada oma teekonda politsei rindel. Samuti on näha koolituskaardil, mis on vajalikud nõuded koolituse läbimiseks ja ka mis on tulemus, mida koolituse läbimisel saad.',
        position: 'bottom'
    },
    {
        step: 6,
        targetElement: '#basic_police_training',
        title: 'Alusta koolitust',
        content: 'Selleks, et alustada abipolitseiniku baaskursusega vajuta "Alusta" ning selle koolituse läbimiseks pead ootama 10 sekundit.',
        position: 'bottom',
        requiresAction: true
    }
];

export const COURSES_COMPLETED_TUTORIAL_STEPS: TutorialStep[] = [
    {
        step: 7,
        targetElement: '.course-card.completed',
        title: 'Läbitud koolitus',
        content: 'Siin näed enda läbitud koolitusi ja hetkel oled edukalt läbinud abipolitseiniku baaskursuse.',
        position: 'bottom'
    },
    {
        step: 8,
        targetElement: '.back-to-dashboard',
        title: 'Tagasi töölauale',
        content: 'Nüüd liigume tagasi töölauale, et jätkata järgmiste sammudega.',
        position: 'bottom',
        requiresAction: true
    }
];