// src/components/tutorial/TutorialOverlay.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TutorialOverlayProps } from './types/tutorial.types';
import { useTutorialSteps } from './hooks/useTutorialSteps';
import { useTutorialHighlight } from './hooks/useTutorialHighlight';
import { useTutorialHandlers } from './hooks/useTutorialHandlers';
import { useSmartPosition } from './hooks/useSmartPosition';
import { calculateDisplayStep, getHighlightDelay } from './utils/stepCalculations';
import { updateTutorialProgress } from '../../services/PlayerService';
import { TutorialWaitingIndicator } from './TutorialWaitingIndicator';
import { getRemainingTime } from '../../services/CourseService';
import { getRemainingWorkTime } from '../../services/WorkService';
import '../../styles/components/TutorialOverlay.css';

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
                                                                    stats,
                                                                    userId,
                                                                    onTutorialComplete,
                                                                    page = 'dashboard'
                                                                }) => {
    const [currentStep, setCurrentStep] = useState(stats.tutorialProgress.currentStep || 0);
    const [isVisible, setIsVisible] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [waitingMessage, setWaitingMessage] = useState('');
    const [waitingTime, setWaitingTime] = useState(0);

    // Track last page to detect page changes
    const lastPageRef = useRef(page);
    const isInitializedRef = useRef(false);

    // Get tutorial steps for current page and step
    const TUTORIAL_STEPS = useTutorialSteps(page, currentStep);
    const currentTutorialStep = TUTORIAL_STEPS.find(s => s.step === currentStep);
    const lastProcessedDbStep = useRef(stats.tutorialProgress.currentStep);

    // Use smart positioning for tutorial box
    const { position, arrowPosition } = useSmartPosition(
        currentTutorialStep?.targetElement || '',
        currentTutorialStep?.position || 'bottom',
        isVisible && !isWaiting
    );

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

    // Define handleWaitingComplete BEFORE it's used in useEffects
    const handleWaitingComplete = useCallback(() => {
        setIsWaiting(false);

        // Progress to next step based on context
        if (currentStep === 6) {
            // Course completed, move to step 7
            setCurrentStep(7);
            updateTutorialProgress(userId, 7);
            setIsVisible(true);
        } else if (currentStep === 22) {
            // Work completed, move to step 23
            setTimeout(async () => {
                await updateTutorialProgress(userId, 23);
                setCurrentStep(23);
                setIsVisible(true);
            }, 1500); // Small delay to let work completion process
        }
    }, [currentStep, userId]);

    // Handle waiting states for course and work completion
    useEffect(() => {
        // Course completion waiting (step 6)
        if (currentStep === 6 && stats.activeCourse?.status === 'in_progress') {
            const remaining = getRemainingTime(stats.activeCourse);
            if (remaining > 0) {
                setIsWaiting(true);
                setWaitingMessage('Oota koolituse lõppemist...');
                setWaitingTime(remaining);
                setIsVisible(false); // Hide main tutorial box
            }
        }
        // Work completion waiting (step 22)
        else if (currentStep === 22 && stats.activeWork?.status === 'in_progress') {
            const remaining = getRemainingWorkTime(stats.activeWork);
            if (remaining > 0) {
                setIsWaiting(true);
                setWaitingMessage('Oota töö lõppemist...');
                setWaitingTime(remaining);
                setIsVisible(false); // Hide main tutorial box
            }
        } else {
            setIsWaiting(false);
        }
    }, [currentStep, stats.activeCourse, stats.activeWork]);

    // Periodic update for the waiting time
    useEffect(() => {
        if (!isWaiting) return;

        const updateWaitingTime = () => {
            if (currentStep === 6 && stats.activeCourse?.status === 'in_progress') {
                const remaining = getRemainingTime(stats.activeCourse);
                setWaitingTime(remaining);
                if (remaining <= 0) {
                    handleWaitingComplete();
                }
            } else if (currentStep === 22 && stats.activeWork?.status === 'in_progress') {
                const remaining = getRemainingWorkTime(stats.activeWork);
                setWaitingTime(remaining);
                if (remaining <= 0) {
                    handleWaitingComplete();
                }
            }
        };

        const interval = setInterval(updateWaitingTime, 1000);
        return () => clearInterval(interval);
    }, [isWaiting, currentStep, stats.activeCourse, stats.activeWork, handleWaitingComplete]);

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
        if (!stats.tutorialProgress.isCompleted && !isWaiting) {
            const dbStep = stats.tutorialProgress.currentStep;
            const pageChanged = lastPageRef.current !== page;

            // Update page ref
            if (pageChanged) {
                lastPageRef.current = page;
            }

            // Initialize only once when we first load with step 0
            if (dbStep === 0 && currentStep === 0 && page === 'dashboard' && !isInitializedRef.current) {
                console.log('Initializing tutorial to step 1');
                setCurrentStep(1);
                setIsVisible(true);
                isInitializedRef.current = true;
                updateTutorialProgress(userId, 1).catch(console.error);
                return;
            }

            // Sync step from database if different (but only once per page load)
            if (dbStep !== currentStep && dbStep > 0 && pageChanged) {
                setCurrentStep(dbStep);
            }

            // Rest of the page-specific logic
            if (page === 'dashboard') {
                if (dbStep === 1 || currentStep === 1) {
                    setIsVisible(true);
                } else if ((dbStep > 1 && dbStep < 4) || (currentStep > 1 && currentStep < 4)) {
                    setIsVisible(true);
                } else if ((dbStep >= 9 && dbStep <= 10) || (currentStep >= 9 && currentStep <= 10)) {
                    setIsVisible(true);
                } else if (dbStep === 16 || currentStep === 16) {
                    setIsVisible(true);
                }
            } else if (page === 'courses') {
                // Always process courses page navigation
                if (currentStep >= 3 && currentStep <= 8) {
                    setIsVisible(true);
                    if (currentStep === 3 && pageChanged) {
                        setCurrentStep(4);
                        updateTutorialProgress(userId, 4).catch(console.error);
                    }
                }
            } else if (page === 'training') {
                // Always process training page navigation
                if (currentStep === 10 && pageChanged) {
                    setCurrentStep(11);
                    updateTutorialProgress(userId, 11).catch(console.error);
                    setIsVisible(true);
                } else if (currentStep >= 11 && currentStep <= 15) {
                    setIsVisible(true);
                }
            } else if (page === 'patrol') {
                // Always process patrol page navigation
                if (currentStep === 16 && pageChanged) {
                    setCurrentStep(17);
                    updateTutorialProgress(userId, 17).catch(console.error);
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
        userId, page, isWaiting, currentStep, stats.activeWork]);

    // Check if course was completed during waiting
    useEffect(() => {
        if (!stats.tutorialProgress.isCompleted &&
            currentStep === 6 &&
            stats.completedCourses?.includes('basic_police_training_abipolitseinik') &&
            !stats.activeCourse) {
            // Course completed, trigger waiting complete
            handleWaitingComplete();
        }
    }, [stats.completedCourses, currentStep, stats.activeCourse, stats.tutorialProgress.isCompleted, handleWaitingComplete]);

    // Check if work was completed during waiting
    useEffect(() => {
        if (!stats.tutorialProgress.isCompleted &&
            currentStep === 22 &&
            !stats.activeWork &&
            isWaiting) {
            // Work completed, trigger waiting complete
            handleWaitingComplete();
        }
    }, [currentStep, stats.activeWork, isWaiting, stats.tutorialProgress.isCompleted, handleWaitingComplete]);

    // Highlight elements when visible
    useEffect(() => {
        if (isVisible && !isWaiting && currentStep > 0) {
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
    }, [currentStep, isVisible, isWaiting, highlightElement, removeHighlight, TUTORIAL_STEPS]);

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

    const handleSkip = async () => {
        // Optional: Add confirmation before skipping
        if (window.confirm('Kas oled kindel, et soovid õpetuse vahele jätta? Saad selle hiljem uuesti lubada seadetest.')) {
            await updateTutorialProgress(userId, 24, true);
            removeHighlight();
            setIsVisible(false);
            setIsWaiting(false);
            onTutorialComplete();
        }
    };

    // Show waiting indicator if in waiting state
    if (isWaiting && waitingTime > 0) {
        // Determine what to highlight during waiting
        let highlightSelector = '';
        if (currentStep === 6) {
            highlightSelector = '.active-course-banner'; // Highlight active course progress
        } else if (currentStep === 22) {
            highlightSelector = '.active-work-banner'; // Highlight active work progress
        }

        return (
            <>
                <div className="tutorial-backdrop" />
                <TutorialWaitingIndicator
                    message={waitingMessage}
                    totalTime={waitingTime}
                    onComplete={handleWaitingComplete}
                    onSkip={handleSkip}
                    highlightElement={highlightSelector}
                />
            </>
        );
    }

    if (!isVisible) {
        return null;
    }

    if (!currentTutorialStep) return null;

    const { totalSteps, displayStep } = calculateDisplayStep(page, currentStep);

    // Determine if we should show skip button (after step 5)
    const showSkipButton = currentStep > 5;

    return (
        <>
            <div className={`tutorial-backdrop ${currentTutorialStep.requiresAction ? 'tutorial-backdrop-clickthrough' : ''}`} />
            <div
                className={`tutorial-box ${arrowPosition}`}
                style={position}
            >
                <div className="tutorial-header">
                    <h3 className="tutorial-title">{currentTutorialStep.title}</h3>
                    <span className="tutorial-step-indicator">
                        {displayStep}/{totalSteps}
                    </span>
                </div>
                <p className="tutorial-content">{currentTutorialStep.content}</p>
                <div className="tutorial-actions">
                    {showSkipButton && (
                        <button
                            className="tutorial-btn tutorial-btn-skip"
                            onClick={handleSkip}
                        >
                            Jäta vahele
                        </button>
                    )}
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