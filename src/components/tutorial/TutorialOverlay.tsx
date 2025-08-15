// src/components/tutorial/TutorialOverlay.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayerStats } from '../../types';
import { updateTutorialProgress } from '../../services/PlayerService';
import '../../styles/components/TutorialOverlay.css';

interface TutorialOverlayProps {
    stats: PlayerStats;
    userId: string;
    onTutorialComplete: () => void;
    page?: 'dashboard' | 'courses' | 'training' | 'patrol';
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
        content: 'Selleks, et alustada abipolitseiniku baaskursusega vajuta "Alusta" ning selle koolituse läbimiseks pead ootama 20 sekundit.',
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

const TRAINING_INTRODUCTION_STEPS: TutorialStep[] = [
    {
        step: 9,
        targetElement: '.stats-card',
        title: 'Õnnitleme!',
        content: 'Vägev, oled edukalt nüüd abipolitseinik ja saad alustada oma tegevusi. Esmalt peaksid end väheke treenima, et tulevikus tänavatel paremini hakkama saada ja selleks on sul nüüd võimalik kasutada enda prefektuuri treeningu võimalusi',
        position: 'bottom'
    },
    {
        step: 10,
        targetElement: '.quick-action-button:nth-child(2)',
        title: 'Treeningu alustamine',
        content: 'Jätkamiseks liigume treeningu lehele',
        position: 'top',
        requiresAction: true
    }
];

const TRAINING_CENTER_TUTORIAL_STEPS: TutorialStep[] = [
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

const PATROL_INTRODUCTION_STEPS: TutorialStep[] = [
    {
        step: 15,
        targetElement: '.back-to-dashboard',
        title: 'Tagasi töölauale',
        content: 'Suurepärane! Oled omandanud põhilised oskused. Nüüd liigume tagasi töölauale, et alustada oma esimese patrulliga.',
        position: 'bottom',
        requiresAction: true
    }
];

const PATROL_DASHBOARD_STEPS: TutorialStep[] = [
    {
        step: 16,
        targetElement: '.quick-action-button:nth-child(3)',
        title: 'Esimene patrull',
        content: 'Nüüd oled valmis minema oma esimesele patrullile! Abipolitseinikuna saad osaleda patrullides ja saada väärtuslikke kogemusi.',
        position: 'top',
        requiresAction: true
    }
];

const PATROL_PAGE_STEPS: TutorialStep[] = [
    {
        step: 17,
        targetElement: '.patrol-container',
        title: 'Patrullteenistus',
        content: 'Tere tulemast patrullteenistusse! Siin saad valida tööülesandeid ja teenida kogemuspunkte.',
        position: 'top'
    },
    {
        step: 18,
        targetElement: '.health-display',
        title: 'Tervise näitaja',
        content: 'See on sinu tervis, mis sõltub jõu ja vastupidavuse omadustest. Töötamiseks peab tervis olema vähemalt 50.',
        position: 'bottom'
    },
    {
        step: 19,
        targetElement: '.patrol-container',
        title: 'Töötamise piirangud',
        content: 'Pea meeles: töötamise ajal ei saa võtta koolitusi, kuid saad treenida piiratud mahus (10 korda tunnis).',
        position: 'top'
    },
    {
        step: 20,
        targetElement: '.department-selector',
        title: 'Vali piirkond',
        content: 'Abipolitseinikuna saad valida, millises piirkonnas soovid patrullida. Vali endale sobiv piirkond.',
        position: 'bottom',
        requiresAction: true
    },
    {
        step: 21,
        targetElement: '.work-activity-selector',
        title: 'Vali tööülesanne',
        content: 'Vali tööülesanne ja määra, mitu tundi soovid töötada. Õpetuse jaoks valime 1 tunni, mis kestab vaid 20 sekundit.',
        position: 'top',
        requiresAction: true
    },
    {
        step: 22,
        targetElement: '.active-work-banner',
        title: 'Töö käib',
        content: 'Suurepärane! Sa töötad nüüd. Oota, kuni töö lõppeb. Õpetuse režiimis kestab see vaid 20 sekundit.',
        position: 'bottom'
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
    const TUTORIAL_STEPS = useMemo(() => {
        if (page === 'dashboard' && currentStep <= 3) {
            return DASHBOARD_TUTORIAL_STEPS;
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
        } else if (page === 'patrol' && currentStep >= 17 && currentStep <= 22) {
            return PATROL_PAGE_STEPS;
        }
        return [];
    }, [page, currentStep]);

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

    // Handle button click for step 10 (training button)
    useEffect(() => {
        if (currentStep === 10 && isVisible) {
            const handleTrainingClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                const trainingButton = document.querySelector('.quick-action-button:nth-child(2)');
                if (trainingButton && trainingButton.contains(target)) {
                    await updateTutorialProgress(userId, 11); // Complete tutorial
                    removeHighlight();
                    setIsVisible(false);
                }
            };

            document.addEventListener('click', handleTrainingClick, true);
            return () => {
                document.removeEventListener('click', handleTrainingClick, true);
            };
        }
    }, [currentStep, isVisible, userId, removeHighlight]);

    // Update the content for step 9 to include prefecture name
    useEffect(() => {
        if (currentStep === 9 && stats.prefecture) {
            const step = TUTORIAL_STEPS.find(s => s.step === 9);
            if (step) {
                step.content = `Vägev, oled edukalt nüüd abipolitseinik ${stats.prefecture}s ja saad alustada oma tegevusi. Esmalt peaksid end väheke treenima, et tulevikus tänavatel paremini hakkama saada ja selleks on sul nüüd võimalik kasutada enda prefektuuri treeningu võimalusi`;
            }
        }
    }, [currentStep, stats.prefecture, TUTORIAL_STEPS]);

    // Add handler for activity selection (step 13)
    useEffect(() => {
        if (currentStep === 13 && isVisible) {
            const handleActivitySelect = async (e: Event) => {
                const target = e.target as HTMLElement;
                const dropdown = document.querySelector('.activity-dropdown') as HTMLSelectElement;
                if (dropdown && target === dropdown && dropdown.value) {
                    // Progress automatically happens in TrainingPage
                    removeHighlight();
                    setTimeout(() => {
                        setCurrentStep(14);
                        setIsVisible(true);
                    }, 100);
                }
            };

            document.addEventListener('change', handleActivitySelect, true);
            return () => {
                document.removeEventListener('change', handleActivitySelect, true);
            };
        }
    }, [currentStep, isVisible, removeHighlight]);

// Add handler for train button click (step 14)
    useEffect(() => {
        if (currentStep === 14 && isVisible) {
            const handleTrainClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('train-button')) {
                    // Wait for tutorial progress update
                    await updateTutorialProgress(userId, 15);
                    removeHighlight();
                    setIsVisible(false);

                    // Set visibility for step 15 after a delay
                    setTimeout(() => {
                        setCurrentStep(15);
                        setIsVisible(true);
                    }, 100);
                }
            };

            document.addEventListener('click', handleTrainClick, true);
            return () => {
                document.removeEventListener('click', handleTrainClick, true);
            };
        }
    }, [currentStep, isVisible, userId, removeHighlight]);

    useEffect(() => {
        if (currentStep === 15 && isVisible) {
            const handleBackClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('back-to-dashboard') || target.closest('.back-to-dashboard')) {
                    // Update to step 16 when clicking back to dashboard
                    await updateTutorialProgress(userId, 16);
                    removeHighlight();
                    setIsVisible(false);
                    // The dashboard will show step 16 when it loads
                }
            };

            document.addEventListener('click', handleBackClick, true);
            return () => {
                document.removeEventListener('click', handleBackClick, true);
            };
        }
    }, [currentStep, isVisible, userId, removeHighlight]);

    // Add handler for step 16 (patrol button click)
    useEffect(() => {
        if (currentStep === 16 && isVisible) {
            const handlePatrolClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                const patrolButton = document.querySelector('.quick-action-button:nth-child(3)');
                if (patrolButton && patrolButton.contains(target)) {
                    await updateTutorialProgress(userId, 17);
                    removeHighlight();
                    setIsVisible(false);
                }
            };

            document.addEventListener('click', handlePatrolClick, true);
            return () => {
                document.removeEventListener('click', handlePatrolClick, true);
            };
        }
    }, [currentStep, isVisible, userId, removeHighlight]);

    // Add handler for step 20 (department selection)
    useEffect(() => {
        if (currentStep === 20 && isVisible) {
            const handleDepartmentSelect = async (e: Event) => {
                const target = e.target as HTMLElement;
                const dropdown = document.querySelector('.department-dropdown') as HTMLSelectElement;
                if (dropdown && target === dropdown && dropdown.value) {
                    await updateTutorialProgress(userId, 21);
                    removeHighlight();
                    setTimeout(() => {
                        setCurrentStep(21);
                        setIsVisible(true);
                    }, 100);
                }
            };

            document.addEventListener('change', handleDepartmentSelect, true);
            return () => {
                document.removeEventListener('change', handleDepartmentSelect, true);
            };
        }
    }, [currentStep, isVisible, userId, removeHighlight]);

    // Add handler for step 21 (start work button)
    useEffect(() => {
        if (currentStep === 21 && isVisible) {
            const handleStartWork = async (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('start-work-button')) {
                    // Progress is handled in PatrolPage
                    removeHighlight();
                    setTimeout(() => {
                        setCurrentStep(22);
                        setIsVisible(true);
                    }, 500);
                }
            };

            document.addEventListener('click', handleStartWork, true);
            return () => {
                document.removeEventListener('click', handleStartWork, true);
            };
        }
    }, [currentStep, isVisible, removeHighlight]);

    // Handle tutorial completion after work is done
    useEffect(() => {
        if (currentStep === 22 && !stats.activeWork && stats.tutorialProgress.isCompleted) {
            removeHighlight();
            setIsVisible(false);
            onTutorialComplete();
        }
    }, [currentStep, stats.activeWork, stats.tutorialProgress.isCompleted, removeHighlight, onTutorialComplete]);

    // Initialize tutorial visibility
    useEffect(() => {
        if (!stats.tutorialProgress.isCompleted) {
            const dbStep = stats.tutorialProgress.currentStep;

            if (page === 'dashboard') {
                if (dbStep === 0 || currentStep === 0) {
                    setCurrentStep(1);
                    setIsVisible(true);
                    updateTutorialProgress(userId, 1);
                } else if ((dbStep > 0 && dbStep < 4) || (currentStep > 0 && currentStep < 4)) {
                    setIsVisible(true);
                } else if ((dbStep >= 9 && dbStep <= 10) || (currentStep >= 9 && currentStep <= 10)) {
                    setIsVisible(true);
                } else if (dbStep === 16 || currentStep === 16) {
                    setCurrentStep(16);
                    setIsVisible(true);  // Show immediately
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
                } else if (currentStep >= 17 && currentStep <= 22) {
                    setIsVisible(true);
                }
            }
        }
    }, [stats.tutorialProgress.isCompleted, stats.tutorialProgress.currentStep, userId, page, currentStep]);

    // Check if course was just completed and update tutorial
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
            return; // Don't do anything, wait for actual action
        }

        const nextStep = currentStep + 1;

        // Handle step transitions based on page and current step
        if (page === 'dashboard') {
            if (currentStep >= 1 && currentStep <= 2) {
                // Steps 1-2: Continue on dashboard
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 9) {
                // Step 9 -> 10: Continue on dashboard (training introduction)
                setCurrentStep(10);
                await updateTutorialProgress(userId, 10);
            }
        } else if (page === 'courses') {
            if (currentStep === 4 || currentStep === 5) {
                // Steps 4-5: Continue on courses page
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 7) {
                // Step 7 -> 8: Continue on courses page (completed courses)
                setCurrentStep(8);
                await updateTutorialProgress(userId, 8);
            }
        } else if (page === 'training') {
            if (currentStep >= 11 && currentStep <= 13) {
                // Steps 11-13: Continue on training page
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 14) {
                // Step 14 -> 15: Move to patrol introduction
                setCurrentStep(15);
                await updateTutorialProgress(userId, 15);
            }
        } else if (page === 'patrol') {
            if (currentStep === 17 || currentStep === 18) {
                // Steps 17-18: Continue on patrol page
                setCurrentStep(nextStep);
                await updateTutorialProgress(userId, nextStep);
            } else if (currentStep === 19) {
                // Step 19 -> 20: Continue to department selection
                setCurrentStep(20);
                await updateTutorialProgress(userId, 20);
            } else if (currentStep === 22) {
                // Step 22: Tutorial complete (work finished)
                // This is handled elsewhere when work completes
                removeHighlight();
                setIsVisible(false);
            }
        }
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
    } else if (page === 'dashboard' && currentStep >= 9 && currentStep <= 10) {
        totalSteps = 2;
        displayStep = currentStep - 8;
    } else if (page === 'training' && currentStep >= 11 && currentStep <= 14) {
        totalSteps = 4;
        displayStep = currentStep - 10;
    } else if (page === 'training' && currentStep === 15) {
        totalSteps = 1;
        displayStep = 1;
    } else if (page === 'dashboard' && currentStep === 16) {
        totalSteps = 1;
        displayStep = 1;
    } else if (page === 'patrol' && currentStep >= 17 && currentStep <= 22) {
        totalSteps = 6;
        displayStep = currentStep - 16;
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