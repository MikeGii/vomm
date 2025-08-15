// src/components/tutorial/types/tutorial.types.ts
import { PlayerStats } from '../../../types';

export interface TutorialStep {
    step: number;
    targetElement: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    requiresAction?: boolean;
}

export interface TutorialOverlayProps {
    stats: PlayerStats;
    userId: string;
    onTutorialComplete: () => void;
    page?: TutorialPage;
}

export type TutorialPage = 'dashboard' | 'courses' | 'training' | 'patrol';

export interface TutorialState {
    currentStep: number;
    isVisible: boolean;
}