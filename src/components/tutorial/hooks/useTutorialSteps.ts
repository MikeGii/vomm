// src/components/tutorial/hooks/useTutorialSteps.ts
import { useMemo } from 'react';
import { TutorialStep, TutorialPage } from '../types/tutorial.types';
import {
    DASHBOARD_MAIN_STEPS,
    TRAINING_INTRODUCTION_STEPS,
    PATROL_DASHBOARD_STEPS,
    COURSES_TUTORIAL_STEPS,
    COURSES_COMPLETED_TUTORIAL_STEPS,
    TRAINING_CENTER_TUTORIAL_STEPS,
    PATROL_INTRODUCTION_STEPS,
    PATROL_PAGE_STEPS
} from '../steps';

export const useTutorialSteps = (page: TutorialPage, currentStep: number): TutorialStep[] => {
    return useMemo(() => {
        if (page === 'dashboard' && currentStep <= 3) {
            return DASHBOARD_MAIN_STEPS;
        } else if (page === 'courses' && currentStep >= 3 && currentStep <= 6) {
            return COURSES_TUTORIAL_STEPS;
        } else if (page === 'courses' && currentStep >= 7 && currentStep <= 8) {
            return COURSES_COMPLETED_TUTORIAL_STEPS;
        } else if (page === 'dashboard' && currentStep >= 9 && currentStep <= 10) {
            return TRAINING_INTRODUCTION_STEPS;
        } else if (page === 'training' && currentStep >= 11 && currentStep <= 14) {
            return TRAINING_CENTER_TUTORIAL_STEPS;
        } else if (page === 'training' && currentStep === 15) {
            return PATROL_INTRODUCTION_STEPS;
        } else if (page === 'dashboard' && currentStep === 16) {
            return PATROL_DASHBOARD_STEPS;
        } else if (page === 'patrol' && currentStep >= 17 && currentStep <= 24) {
            return PATROL_PAGE_STEPS;
        }
        return [];
    }, [page, currentStep]);
};