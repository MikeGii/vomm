// src/components/tutorial/TutorialOverlay.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerStats } from '../../types';
import { updateTutorialProgress } from '../../services/PlayerService';
import '../../styles/components/TutorialOverlay.css';

interface TutorialOverlayProps {
    stats: PlayerStats;
    userId: string;
    onTutorialComplete: () => void;
    page?: 'dashboard' | 'courses';
}

interface TutorialStep {
    step: number;
    targetElement: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    requiresAction?: boolean;
}

const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
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

const COURSES_TUTORIAL_STEPS: TutorialStep[] = [
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
        content: 'Selleks, et alustada abipolitseiniku baaskursusega vajuta "Alusta" ning selle koolituse läbimiseks pead ootama 1 minuti.',
        position: 'bottom',
        requiresAction: true
    }
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
                                                                    stats,
                                                                    userId,
                                                                    onTutorialComplete,
                                                                    page = 'dashboard'
                                                                }) => {
    const [currentStep, setCurrentStep] = useState(stats.tutorialProgress.currentStep || 0);
    const [isVisible, setIsVisible] = useState(false);
    const [clickHandler, setClickHandler] = useState<(() => void) | null>(null);

    const TUTORIAL_STEPS = page === 'dashboard' ? DASHBOARD_TUTORIAL_STEPS : COURSES_TUTORIAL_STEPS;

    const removeHighlight = useCallback(() => {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            el.classList.remove('tutorial-clickable');
        });
    }, []);

    const highlightElement = useCallback((selector: string, makeClickable: boolean = false) => {
        removeHighlight();
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');
            if (makeClickable) {
                element.classList.add('tutorial-clickable');
            }
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [removeHighlight]);

    // Handle button click for step 6
    useEffect(() => {
        if (currentStep === 6 && isVisible) {
            const handleEnrollClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                // Check if clicked element is the enroll button within the basic_police_training card
                const card = document.querySelector('#basic_police_training');
                if (card && card.contains(target) && target.classList.contains('enroll-button')) {
                    // Complete tutorial
                    await updateTutorialProgress(userId, 7, true);
                    removeHighlight();
                    setIsVisible(false);
                    onTutorialComplete();
                }
            };

            document.addEventListener('click', handleEnrollClick, true);

            return () => {
                document.removeEventListener('click', handleEnrollClick, true);
            };
        }
    }, [currentStep, isVisible, userId, onTutorialComplete, removeHighlight]);

    useEffect(() => {
        if (page === 'dashboard') {
            if (!stats.tutorialProgress.isCompleted && currentStep === 0) {
                setCurrentStep(1);
                setIsVisible(true);
                updateTutorialProgress(userId, 1);
            } else if (!stats.tutorialProgress.isCompleted && currentStep > 0 && currentStep < 4) {
                setIsVisible(true);
            }
        } else if (page === 'courses') {
            if (!stats.tutorialProgress.isCompleted && currentStep >= 3 && currentStep < 7) {
                setIsVisible(true);
                if (currentStep === 3) {
                    setCurrentStep(4);
                    updateTutorialProgress(userId, 4);
                }
            }
        }
    }, [stats.tutorialProgress.isCompleted, currentStep, userId, page]);

    useEffect(() => {
        if (isVisible && currentStep > 0) {
            const stepData = TUTORIAL_STEPS.find(s => s.step === currentStep);
            if (stepData) {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    highlightElement(stepData.targetElement, stepData.requiresAction);
                }, 100);
            }
        }

        return () => {
            removeHighlight();
        };
    }, [currentStep, isVisible, highlightElement, removeHighlight, TUTORIAL_STEPS]);

    const handleNext = async () => {
        const currentStepData = TUTORIAL_STEPS.find(s => s.step === currentStep);

        if (currentStepData?.requiresAction) {
            return; // Don't do anything, wait for actual button click
        }

        const nextStep = currentStep + 1;

        if (page === 'dashboard' && nextStep > 3) {
            await updateTutorialProgress(userId, nextStep);
            removeHighlight();
            setIsVisible(false);
        } else if (page === 'courses' && nextStep > 6) {
            await updateTutorialProgress(userId, 7, true);
            removeHighlight();
            setIsVisible(false);
            onTutorialComplete();
        } else {
            setCurrentStep(nextStep);
            await updateTutorialProgress(userId, nextStep);
        }
    };

    const handleSkip = async () => {
        await updateTutorialProgress(userId, 7, true);
        removeHighlight();
        setIsVisible(false);
        onTutorialComplete();
    };

    if (!isVisible) {
        return null;
    }

    const currentTutorialStep = TUTORIAL_STEPS.find(s => s.step === currentStep);
    if (!currentTutorialStep) return null;

    const totalSteps = page === 'dashboard' ? 3 : 3;
    const displayStep = page === 'dashboard' ? currentStep : currentStep - 3;

    return (
        <>
            <div className={`tutorial-backdrop ${currentTutorialStep.requiresAction ? 'tutorial-backdrop-clickthrough' : ''}`} />
            <div className={`tutorial-box tutorial-${currentTutorialStep.position}`}>
                <div className="tutorial-header">
                    <h3 className="tutorial-title">{currentTutorialStep.title}</h3>
                    <span className="tutorial-step-indicator">
                        {displayStep}/{totalSteps}
                    </span>
                </div>
                <p className="tutorial-content">{currentTutorialStep.content}</p>
                <div className="tutorial-actions">
                    <button
                        className="tutorial-btn tutorial-btn-skip"
                        onClick={handleSkip}
                    >
                        Lõpeta õpetus
                    </button>
                    {!currentTutorialStep.requiresAction && (
                        <button
                            className="tutorial-btn tutorial-btn-next"
                            onClick={handleNext}
                        >
                            Jätka
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};