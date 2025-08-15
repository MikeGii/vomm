// src/components/tutorial/TutorialOverlay.tsx
import React, { useState, useEffect } from 'react';
import { TutorialOverlayProps, TutorialStep } from './types/tutorial.types';
import { useTutorialSteps } from './hooks/useTutorialSteps';
import { useTutorialHighlight } from './hooks/useTutorialHighlight';
import { useTutorialHandlers } from './hooks/useTutorialHandlers';
import { calculateDisplayStep, getHighlightDelay } from './utils/stepCalculations';
import { updateTutorialProgress } from '../../services/PlayerService';
import '../../styles/components/TutorialOverlay.css';

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
                                                                    stats,
                                                                    userId,
                                                                    onTutorialComplete,
                                                                    page = 'dashboard'
                                                                }) => {
    const [currentStep, setCurrentStep] = useState(stats.tutorialProgress.currentStep || 0);
    const [isVisible, setIsVisible] = useState(false);

    // Get tutorial steps for current page and step
    const TUTORIAL_STEPS = useTutorialSteps(page, currentStep);

    // Get highlight functions
    const { removeHighlight, highlightElement } = useTutorialHighlight();

    // Setup all event handlers
    useTutorialHandlers({
        page,
        currentStep,
        isVisible,
        userId,
        stats,
        setCurrentStep,
        setIsVisible,
        removeHighlight,
        onTutorialComplete
    });

    // Update step 9 content with prefecture name
    useEffect(() => {
        if (currentStep === 9 && stats.prefecture) {
            const step = TUTORIAL_STEPS.find(s => s.step === 9);
            if (step) {
                step.content = `Vägev, oled edukalt nüüd abipolitseinik ${stats.prefecture}s ja saad alustada oma tegevusi. Esmalt peaksid end väheke treenima, et tulevikus tänavatel paremini hakkama saada ja selleks on sul nüüd võimalik kasutada enda prefektuuri treeningu võimalusi`;
            }
        }
    }, [currentStep, stats.prefecture, TUTORIAL_STEPS]);

    // Initialize tutorial visibility
    useEffect(() => {
        if (!stats.tutorialProgress.isCompleted) {
            const dbStep = stats.tutorialProgress.currentStep;

            if (page === 'dashboard') {
                // Fix: Check for step 0 and initialize to step 1
                if (dbStep === 0 && currentStep === 0) {
                    console.log('Initializing tutorial to step 1');
                    setCurrentStep(1);
                    setIsVisible(true);
                    updateTutorialProgress(userId, 1);
                } else if (dbStep === 1 || currentStep === 1) {
                    setCurrentStep(1);
                    setIsVisible(true);
                } else if ((dbStep > 1 && dbStep < 4) || (currentStep > 1 && currentStep < 4)) {
                    setIsVisible(true);
                } else if ((dbStep >= 9 && dbStep <= 10) || (currentStep >= 9 && currentStep <= 10)) {
                    setIsVisible(true);
                } else if (dbStep === 16 || currentStep === 16) {
                    setCurrentStep(16);
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
            } else if (page === 'training') {
                if (currentStep === 10) {
                    setCurrentStep(11);
                    updateTutorialProgress(userId, 11);
                    setIsVisible(true);
                } else if (currentStep >= 11 && currentStep <= 15) {
                    setIsVisible(true);
                }
            } else if (page === 'patrol') {
                if (currentStep === 16) {
                    setCurrentStep(17);
                    updateTutorialProgress(userId, 17);
                    setIsVisible(true);
                } else if (currentStep === 22 && !stats.activeWork) {
                    console.log('Page loaded at step 22 with completed work, moving to step 23');
                    setTimeout(async () => {
                        await updateTutorialProgress(userId, 23);
                        setCurrentStep(23);
                        setIsVisible(true);
                    }, 1000);
                } else if (currentStep >= 17 && currentStep <= 24) {
                    setIsVisible(true);
                }
            }
        }
    }, [stats.tutorialProgress.isCompleted, stats.tutorialProgress.currentStep,
        userId, page]);

    // Check if course was completed
    useEffect(() => {
        if (!stats.tutorialProgress.isCompleted &&
            currentStep === 6 &&
            stats.completedCourses?.includes('basic_police_training')) {
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
                const delay = getHighlightDelay(currentStep);
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
            return;
        }

        const nextStep = currentStep + 1;

        if (page === 'dashboard') {
            if (currentStep >= 1 && currentStep <= 2) {
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 9) {
                setCurrentStep(10);
                await updateTutorialProgress(userId, 10);
            }
        } else if (page === 'courses') {
            if (currentStep === 4 || currentStep === 5) {
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 7) {
                setCurrentStep(8);
                await updateTutorialProgress(userId, 8);
            }
        } else if (page === 'training') {
            if (currentStep >= 11 && currentStep <= 13) {
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 14) {
                setCurrentStep(15);
                await updateTutorialProgress(userId, 15);
            }
        } else if (page === 'patrol') {
            if (currentStep === 17 || currentStep === 18) {
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 19) {
                setCurrentStep(20);
                await updateTutorialProgress(userId, 20);
            } else if (currentStep === 22) {
                // Just hide for step 22
                removeHighlight();
                setIsVisible(false);
            } else if (currentStep === 23) {
                // Move to final step 24
                setCurrentStep(24);
                await updateTutorialProgress(userId, 24);
            } else if (currentStep === 24) {
                // Complete tutorial on step 24
                console.log('Completing tutorial at step 24...');
                await updateTutorialProgress(userId, 24, true);
                removeHighlight();
                setIsVisible(false);
                onTutorialComplete();
            }
        }
    };

    if (!isVisible) {
        return null;
    }

    const currentTutorialStep = TUTORIAL_STEPS.find(s => s.step === currentStep);
    if (!currentTutorialStep) return null;

    const { totalSteps, displayStep } = calculateDisplayStep(page, currentStep);

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
                    {!currentTutorialStep.requiresAction && (
                        <button
                            className="tutorial-btn tutorial-btn-next"
                            onClick={handleNext}
                        >
                            {currentStep === 24 ? 'Lõpeta õpetus' : 'Jätka'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};