// src/components/tutorial/hooks/useTutorialHandlers.ts
import { useEffect } from 'react';
import { PlayerStats } from '../../../types';
import { TutorialPage } from '../types/tutorial.types';
import { updateTutorialProgress } from '../../../services/PlayerService';

interface HandlerProps {
    page: TutorialPage;
    currentStep: number;
    isVisible: boolean;
    userId: string;
    stats: PlayerStats;
    setCurrentStep: (step: number) => void;
    setIsVisible: (visible: boolean) => void;
    removeHighlight: () => void;
    onTutorialComplete: () => void;
}

export const useTutorialHandlers = ({
                                        page,
                                        currentStep,
                                        isVisible,
                                        userId,
                                        stats,
                                        setCurrentStep,
                                        setIsVisible,
                                        removeHighlight,
                                        onTutorialComplete
                                    }: HandlerProps) => {

    // Handle step 6 - Course enrollment
    useEffect(() => {
        if (currentStep === 6 && isVisible) {
            const handleEnrollClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                const card = document.querySelector('#basic_police_training_abipolitseinik');
                if (card && card.contains(target) && target.classList.contains('enroll-button')) {
                    removeHighlight();
                    setIsVisible(false);
                }
            };

            document.addEventListener('click', handleEnrollClick, true);
            return () => document.removeEventListener('click', handleEnrollClick, true);
        }
    }, [currentStep, isVisible, removeHighlight, setIsVisible]);

    // Handle step 8 - Back to dashboard from courses
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
            return () => document.removeEventListener('click', handleBackClick, true);
        }
    }, [currentStep, isVisible, userId, removeHighlight, setIsVisible]);

    // Handle step 10 - Training button click
    useEffect(() => {
        if (currentStep === 10 && isVisible) {
            const handleTrainingClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                const trainingButton = document.querySelector('.quick-action-button:nth-child(2)');
                if (trainingButton && trainingButton.contains(target)) {
                    await updateTutorialProgress(userId, 11);
                    removeHighlight();
                    setIsVisible(false);
                }
            };

            document.addEventListener('click', handleTrainingClick, true);
            return () => document.removeEventListener('click', handleTrainingClick, true);
        }
    }, [currentStep, isVisible, userId, removeHighlight, setIsVisible]);

    // Handle step 13 - Activity selection
    useEffect(() => {
        if (currentStep === 13 && isVisible) {
            const handleActivitySelect = async (e: Event) => {
                const target = e.target as HTMLElement;
                const dropdown = document.querySelector('.activity-dropdown') as HTMLSelectElement;
                if (dropdown && target === dropdown && dropdown.value) {
                    removeHighlight();
                    setTimeout(() => {
                        setCurrentStep(14);
                        setIsVisible(true);
                    }, 100);
                }
            };

            document.addEventListener('change', handleActivitySelect, true);
            return () => document.removeEventListener('change', handleActivitySelect, true);
        }
    }, [currentStep, isVisible, removeHighlight, setCurrentStep, setIsVisible]);

    // Handle step 14 - Train button click
    useEffect(() => {
        if (currentStep === 14 && isVisible) {
            const handleTrainClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('train-button')) {
                    await updateTutorialProgress(userId, 15);
                    removeHighlight();
                    setIsVisible(false);
                    setTimeout(() => {
                        setCurrentStep(15);
                        setIsVisible(true);
                    }, 100);
                }
            };

            document.addEventListener('click', handleTrainClick, true);
            return () => document.removeEventListener('click', handleTrainClick, true);
        }
    }, [currentStep, isVisible, userId, removeHighlight, setCurrentStep, setIsVisible]);

    // Handle step 15 - Back to dashboard from training
    useEffect(() => {
        if (currentStep === 15 && isVisible) {
            const handleBackClick = async (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('back-to-dashboard') || target.closest('.back-to-dashboard')) {
                    await updateTutorialProgress(userId, 16);
                    removeHighlight();
                    setIsVisible(false);
                }
            };

            document.addEventListener('click', handleBackClick, true);
            return () => document.removeEventListener('click', handleBackClick, true);
        }
    }, [currentStep, isVisible, userId, removeHighlight, setIsVisible]);

    // Handle step 16 - Patrol button click
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
            return () => document.removeEventListener('click', handlePatrolClick, true);
        }
    }, [currentStep, isVisible, userId, removeHighlight, setIsVisible]);

    // Handle step 20 - Department selection
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
            return () => document.removeEventListener('change', handleDepartmentSelect, true);
        }
    }, [currentStep, isVisible, userId, removeHighlight, setCurrentStep, setIsVisible]);

    // Handle step 21 - Start work button
    useEffect(() => {
        if (currentStep === 21 && isVisible) {
            const handleStartWork = async (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('start-work-button')) {
                    removeHighlight();
                    setTimeout(() => {
                        setCurrentStep(22);
                        setIsVisible(true);
                    }, 500);
                }
            };

            document.addEventListener('click', handleStartWork, true);
            return () => document.removeEventListener('click', handleStartWork, true);
        }
    }, [currentStep, isVisible, removeHighlight, setCurrentStep, setIsVisible]);

    // Handle progression from step 22 to 23
    useEffect(() => {
        if (currentStep === 22 && page === 'patrol' && !stats.tutorialProgress.isCompleted) {
            if (!stats.activeWork) {
                console.log('Tutorial work completed, progressing to step 23...');

                const timer = setTimeout(async () => {
                    await updateTutorialProgress(userId, 23);
                    setCurrentStep(23);
                    setIsVisible(true);
                }, 1500);

                return () => clearTimeout(timer);
            }
        }
        // No automatic completion - tutorial ends only when user clicks button on step 24
    }, [currentStep, page, stats.activeWork, stats.tutorialProgress.isCompleted, userId,
        setCurrentStep, setIsVisible]);
};