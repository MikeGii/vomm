// src/components/tutorial/utils/stepCalculations.ts
import { TutorialPage } from '../types/tutorial.types';

export const calculateDisplayStep = (
    page: TutorialPage,
    currentStep: number
): { totalSteps: number; displayStep: number } => {
    if (page === 'dashboard' && currentStep <= 3) {
        return { totalSteps: 3, displayStep: currentStep };
    } else if (page === 'courses' && currentStep >= 4 && currentStep <= 6) {
        return { totalSteps: 3, displayStep: currentStep - 3 };
    } else if (page === 'courses' && currentStep >= 7 && currentStep <= 8) {
        return { totalSteps: 2, displayStep: currentStep - 6 };
    } else if (page === 'dashboard' && currentStep >= 9 && currentStep <= 10) {
        return { totalSteps: 2, displayStep: currentStep - 8 };
    } else if (page === 'training' && currentStep >= 11 && currentStep <= 14) {
        return { totalSteps: 4, displayStep: currentStep - 10 };
    } else if (page === 'training' && currentStep === 15) {
        return { totalSteps: 1, displayStep: 1 };
    } else if (page === 'dashboard' && currentStep === 16) {
        return { totalSteps: 1, displayStep: 1 };
    } else if (page === 'patrol' && currentStep >= 17 && currentStep <= 24) {
        return { totalSteps: 8, displayStep: currentStep - 16 };
    }

    return { totalSteps: 0, displayStep: 0 };
};

export const getHighlightDelay = (currentStep: number): number => {
    if (currentStep === 7) return 600;
    if (currentStep === 23) return 500; // Reduced from 2000
    if (currentStep === 17 || currentStep === 19 || currentStep === 24) return 300; // Quick for patrol page steps
    return 100;
};