// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerStats } from '../../types';
import { updateTutorialProgress } from '../../services/PlayerService';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/QuickActions.css';

interface QuickActionsProps {
    stats: PlayerStats;
}

interface ActionItem {
    icon: string;
    label: string;
    disabled: boolean;
    action?: () => void;
    highlighted?: boolean;
    locked?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ stats }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Check if we're in tutorial mode and what step we're on
    const inTutorial = !stats.tutorialProgress?.isCompleted;
    const tutorialStep = stats.tutorialProgress?.currentStep || 0;

    // Determine what should be locked based on tutorial progress
    const shouldLockActions = inTutorial && tutorialStep < 3;
    const shouldLockTraining = inTutorial && tutorialStep < 9;  // Unlock at step 9
    const shouldLockWork = inTutorial && tutorialStep < 15; // Changed from true to check step 15
    const shouldLockDepartment = true;  // Always locked in tutorial

    // Check what features are available based on progress
    const canTrain = stats.hasCompletedTraining;
    const canWork = stats.hasCompletedTraining && !stats.isEmployed;
    const canAccessDepartment = stats.isEmployed;

    const handleCoursesClick = async () => {
        // Update tutorial progress when clicking courses during tutorial
        if (!stats.tutorialProgress?.isCompleted &&
            stats.tutorialProgress?.currentStep === 3 &&
            currentUser) {
            await updateTutorialProgress(currentUser.uid, 4);
        }
        navigate('/courses');
    };

    const handleTrainingClick = async () => {
        // Update tutorial progress when clicking training during tutorial
        if (!stats.tutorialProgress?.isCompleted &&
            stats.tutorialProgress?.currentStep === 10 &&
            currentUser) {
            // This is handled in TutorialOverlay, just navigate
        }
        navigate('/training');
    };

    const actions: ActionItem[] = [
        {
            icon: '📚',
            label: 'Koolitused',
            disabled: false,
            action: handleCoursesClick,
            highlighted: tutorialStep === 3,
            locked: false
        },
        {
            icon: shouldLockTraining ? '🔒' : '🎯',
            label: 'Treening',
            disabled: shouldLockTraining || (!inTutorial && !canTrain),
            locked: shouldLockTraining,
            action: handleTrainingClick,
            highlighted: tutorialStep === 10
        },
        {
            icon: shouldLockWork ? '🔒' : '🚓',
            label: 'Mine tööle',
            disabled: shouldLockWork || (!inTutorial && !stats.hasCompletedTraining),
            locked: shouldLockWork,
            action: () => navigate('/patrol'),
            highlighted: tutorialStep === 16 // Highlight during patrol tutorial
        },
        {
            icon: shouldLockDepartment ? '🔒' : '👥',
            label: 'Osakond',
            disabled: shouldLockDepartment || (!inTutorial && !canAccessDepartment),
            locked: shouldLockDepartment,
            action: () => navigate('/department')
        }
    ];

    // Determine info text based on player state
    let infoText: string;
    if (tutorialStep === 16) {
        infoText = 'Vajuta "Mine tööle" nuppu, et alustada oma esimest patrulli!';
    } else if (tutorialStep === 10) {
        infoText = 'Vajuta Treening nuppu, et jätkata õpetusega!';
    } else if (tutorialStep === 3) {
        infoText = 'Vajuta Koolitused nuppu, et jätkata õpetusega!';
    } else if (shouldLockActions) {
        infoText = 'Järgi õpetust, et avada kõik funktsioonid!';
    } else if (!stats.hasCompletedTraining) {
        infoText = 'Alusta abipolitseiniku koolitusega!';
    } else if (stats.activeWork) {
        infoText = 'Sa juba töötad! Oota kuni praegune töö lõppeb.';
    } else if (!stats.isEmployed) {
        infoText = 'Koolitus läbitud! Nüüd saad minna tööle.';
    } else {
        infoText = 'Vali tegevus menüüst.';
    }

    return (
        <div className="quick-actions-container">
            <h3 className="quick-actions-title">Kiirmenüü</h3>
            <div className="quick-actions-grid">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className={`quick-action-button ${action.highlighted ? 'highlighted' : ''} ${action.locked ? 'locked' : ''}`}
                        disabled={action.disabled}
                        onClick={action.disabled ? undefined : action.action}
                        title={
                            action.locked
                                ? 'Lukustatud - järgi õpetust'
                                : action.disabled
                                    ? 'Pole veel kättesaadav'
                                    : ''
                        }
                    >
                        <span className="action-icon">{action.icon}</span>
                        <span className="action-label">{action.label}</span>
                    </button>
                ))}
            </div>
            <p className="quick-actions-info">{infoText}</p>
        </div>
    );
};