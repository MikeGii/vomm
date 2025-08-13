// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerStats } from '../../types';
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

    // Check if we're in tutorial mode and haven't reached courses yet
    const inTutorial = !stats.tutorialProgress?.isCompleted;
    const shouldLockActions = inTutorial && stats.tutorialProgress?.currentStep < 3;

    // Check what features are available based on progress
    const canTrain = stats.hasCompletedTraining; // Can do training after basic course
    const canWork = stats.hasCompletedTraining && !stats.isEmployed; // Can go to work after training
    const canAccessDepartment = stats.isEmployed; // Can access department when employed

    const actions: ActionItem[] = [
        {
            icon: '📚',
            label: 'Koolitused',
            disabled: false,
            action: () => navigate('/courses'),
            highlighted: stats.tutorialProgress?.currentStep === 3,
            locked: false  // Never locked
        },
        {
            icon: shouldLockActions ? '🔒' : '🎯',
            label: 'Treening',
            disabled: !canTrain || shouldLockActions,
            locked: shouldLockActions,
            action: () => navigate('/training')
        },
        {
            icon: shouldLockActions ? '🔒' : '🚓',
            label: 'Mine tööle',
            disabled: !canWork || shouldLockActions,
            locked: shouldLockActions,
            action: () => navigate('/patrol')
        },
        {
            icon: shouldLockActions ? '🔒' : '👥',
            label: 'Osakond',
            disabled: !canAccessDepartment || shouldLockActions,
            locked: shouldLockActions,
            action: () => navigate('/department')
        }
    ];

    // Determine info text based on player state
    let infoText: string;
    if (shouldLockActions) {
        infoText = 'Järgi õpetust, et avada kõik funktsioonid!';
    } else if (!stats.hasCompletedTraining) {
        infoText = 'Alusta abipolitseiniku koolitusega!';
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