// src/components/tutorial/TutorialOverlay.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { updateTutorialProgress } from '../../services/PlayerService';
import '../../styles/components/TutorialOverlay.css';

interface TutorialOverlayProps {
    stats: PlayerStats;
    userId: string;
    onTutorialComplete: () => void;
}

interface TutorialStep {
    step: number;
    targetElement: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
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
        position: 'top'
    }
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
                                                                    stats,
                                                                    userId,
                                                                    onTutorialComplete
                                                                }) => {
    const [currentStep, setCurrentStep] = useState(stats.tutorialProgress.currentStep || 0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Start tutorial if not completed and step is 0
        if (!stats.tutorialProgress.isCompleted && currentStep === 0) {
            setCurrentStep(1);
            setIsVisible(true);
            updateTutorialProgress(userId, 1);
        } else if (!stats.tutorialProgress.isCompleted && currentStep > 0) {
            setIsVisible(true);
        }
    }, []);

    useEffect(() => {
        if (isVisible && currentStep > 0 && currentStep <= TUTORIAL_STEPS.length) {
            highlightElement(TUTORIAL_STEPS[currentStep - 1].targetElement);
        }

        return () => {
            removeHighlight();
        };
    }, [currentStep, isVisible]);

    const highlightElement = (selector: string) => {
        removeHighlight();
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const removeHighlight = () => {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    };

    const handleNext = async () => {
        const nextStep = currentStep + 1;

        if (nextStep > TUTORIAL_STEPS.length) {
            // Tutorial completed
            await updateTutorialProgress(userId, nextStep, true);
            removeHighlight();
            setIsVisible(false);
            onTutorialComplete();
        } else {
            // Go to next step
            setCurrentStep(nextStep);
            await updateTutorialProgress(userId, nextStep);

            // If we're on step 3, wait for user to click the Koolitused button
            if (nextStep === 3) {
                // The tutorial will continue when they navigate to courses
                setTimeout(() => {
                    setIsVisible(false);
                }, 5000); // Hide after 5 seconds to let them click
            }
        }
    };

    const handleSkip = async () => {
        await updateTutorialProgress(userId, TUTORIAL_STEPS.length + 1, true);
        removeHighlight();
        setIsVisible(false);
        onTutorialComplete();
    };

    if (!isVisible || currentStep === 0 || currentStep > TUTORIAL_STEPS.length) {
        return null;
    }

    const currentTutorialStep = TUTORIAL_STEPS[currentStep - 1];

    return (
        <>
            <div className="tutorial-backdrop" />
            <div className={`tutorial-box tutorial-${currentTutorialStep.position}`}>
                <div className="tutorial-header">
                    <h3 className="tutorial-title">{currentTutorialStep.title}</h3>
                    <span className="tutorial-step-indicator">
                        {currentStep}/{TUTORIAL_STEPS.length}
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
                    <button
                        className="tutorial-btn tutorial-btn-next"
                        onClick={handleNext}
                    >
                        {currentStep === TUTORIAL_STEPS.length ? 'Valmis' : 'Jätka'}
                    </button>
                </div>
            </div>
        </>
    );
};