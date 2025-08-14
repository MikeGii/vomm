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

const COURSES_COMPLETED_TUTORIAL_STEPS: TutorialStep[] = [
    {
        step: 7,
        targetElement: '.course-card.completed:first-child',
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

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
                                                                    stats,
                                                                    userId,
                                                                    onTutorialComplete,
                                                                    page = 'dashboard'
                                                                }) => {
    const [currentStep, setCurrentStep] = useState(stats.tutorialProgress.currentStep || 0);
    const [isVisible, setIsVisible] = useState(false);

    // Determine which tutorial steps to use based on page and progress
    let TUTORIAL_STEPS: TutorialStep[] = [];

    if (page === 'dashboard' && currentStep <= 3) {
        TUTORIAL_STEPS = DASHBOARD_TUTORIAL_STEPS;
    } else if (page === 'courses' && currentStep >= 3 && currentStep <= 6) {
        TUTORIAL_STEPS = COURSES_TUTORIAL_STEPS;
    } else if (page === 'courses' && currentStep >= 7 && currentStep <= 8) {
        TUTORIAL_STEPS = COURSES_COMPLETED_TUTORIAL_STEPS;
    }

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

    // Handle button clicks for step 6 (enroll in course)
    useEffect(() => {
        if (currentStep === 6 && isVisible) {
            const handleEnrollClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                const card = document.querySelector('#basic_police_training');
                if (card && card.contains(target) && target.classList.contains('enroll-button')) {
                    // Don't update progress here, let the course completion handle it
                    removeHighlight();
                    setIsVisible(false);
                }
            };

            document.addEventListener('click', handleEnrollClick, true);
            return () => {
                document.removeEventListener('click', handleEnrollClick, true);
            };
        }
    }, [currentStep, isVisible, userId, removeHighlight]);

    // Handle button click for step 8 (back to dashboard)
    useEffect(() => {
        if (currentStep === 8 && isVisible) {
            const handleBackClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('back-to-dashboard') || target.closest('.back-to-dashboard')) {
                    await updateTutorialProgress(userId, 9);
                    removeHighlight();
                    setIsVisible(false);
                }
            };

            document.addEventListener('click', handleBackClick, true);
            return () => {
                document.removeEventListener('click', handleBackClick, true);
            };
        }
    }, [currentStep, isVisible, userId, removeHighlight]);

    // Initialize tutorial visibility
    useEffect(() => {
        if (!stats.tutorialProgress.isCompleted) {
            if (page === 'dashboard') {
                if (currentStep === 0) {
                    setCurrentStep(1);
                    setIsVisible(true);
                    updateTutorialProgress(userId, 1);
                } else if (currentStep > 0 && currentStep < 4) {
                    setIsVisible(true);
                } else if (currentStep === 9) {
                    // Show prefecture selection tutorial
                    setIsVisible(true);
                }
            } else if (page === 'courses') {
                if (currentStep >= 3 && currentStep <= 8) {
                    setIsVisible(true);
                    if (currentStep === 3) {
                        setCurrentStep(4);
                        updateTutorialProgress(userId, 4);
                    }
                }
            }
        }
    }, [stats.tutorialProgress.isCompleted, currentStep, userId, page]);

    // Check if course was just completed and update tutorial
    useEffect(() => {
        if (!stats.tutorialProgress.isCompleted &&
            currentStep === 6 &&
            stats.completedCourses?.includes('basic_police_training')) {
            // Course was completed, move to step 7
            setCurrentStep(7);
            updateTutorialProgress(userId, 7);
            setIsVisible(true);
        }
    }, [stats.completedCourses, currentStep, userId, stats.tutorialProgress.isCompleted]);

    // Highlight elements when visible
    useEffect(() => {
        if (isVisible && currentStep > 0) {
            const stepData = TUTORIAL_STEPS.find(s => s.step === currentStep);
            if (stepData) {
                // Add extra delay for step 7 to ensure completed tab has rendered
                const delay = currentStep === 7 ? 600 : 100;
                setTimeout(() => {
                    highlightElement(stepData.targetElement, stepData.requiresAction);
                }, delay);
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

        // Handle step transitions
        if (page === 'dashboard' && nextStep > 3 && nextStep < 9) {
            await updateTutorialProgress(userId, nextStep);
            removeHighlight();
            setIsVisible(false);
        } else if (page === 'courses' && currentStep === 7) {
            // Move to step 8
            setCurrentStep(8);
            await updateTutorialProgress(userId, 8);
        } else {
            setCurrentStep(nextStep);
            await updateTutorialProgress(userId, nextStep);
        }
    };

    const handleSkip = async () => {
        await updateTutorialProgress(userId, 10, true);
        removeHighlight();
        setIsVisible(false);
        onTutorialComplete();
    };

    if (!isVisible) {
        return null;
    }

    const currentTutorialStep = TUTORIAL_STEPS.find(s => s.step === currentStep);
    if (!currentTutorialStep) return null;

    // Calculate display step based on current page
    let totalSteps = 0;
    let displayStep = 0;

    if (page === 'dashboard' && currentStep <= 3) {
        totalSteps = 3;
        displayStep = currentStep;
    } else if (page === 'courses' && currentStep >= 4 && currentStep <= 6) {
        totalSteps = 3;
        displayStep = currentStep - 3;
    } else if (page === 'courses' && currentStep >= 7 && currentStep <= 8) {
        totalSteps = 2;
        displayStep = currentStep - 6;
    } else if (page === 'dashboard' && currentStep === 9) {
        totalSteps = 1;
        displayStep = 1;
    }

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