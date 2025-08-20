// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerStats } from '../../types';
import '../../styles/components/QuickActions.css';

interface QuickActionsProps {
    stats: PlayerStats;
    onShowInstructions?: () => void;
}

interface ActionItem {
    icon: string;
    label: string;
    disabled: boolean;
    action?: () => void;
    disabledReason?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ stats, onShowInstructions }) => {

    const navigate = useNavigate();

    const hasCompletedBasicTraining = stats.completedCourses?.includes('basic_police_training_abipolitseinik') || false;
    const hasGraduated = stats.completedCourses?.includes('lopueksam') || false;
    const hasLevel2OrHigher = stats.level >= 2;
    const hasPrefecture = !!stats.prefecture;
    const hasDepartment = !!stats.department;

    // Check what features are available based on progress
    const canTrain = hasCompletedBasicTraining;
    const canWork = hasLevel2OrHigher;
    const canAccessDepartment = hasGraduated && hasPrefecture && hasDepartment;

    const actions: ActionItem[] = [
        {
            icon: '📖',
            label: 'Õpetus',
            disabled: false,
            action: onShowInstructions
        },
        {
            icon: '📚',
            label: 'Koolitused',
            disabled: false,
            action: () => navigate('/courses')
        },
        {
            icon: canTrain ? '🎯' : '🔒',
            label: 'Treening',
            disabled: !canTrain,
            action: () => navigate('/training'),
            disabledReason: !hasCompletedBasicTraining
                ? 'Lõpeta esmalt abipolitseiniku baaskursus'
                : undefined
        },
        {
            icon: canWork ? '🚓' : '🔒',
            label: 'Mine tööle',
            disabled: !canWork,
            action: () => navigate('/patrol'),
            disabledReason: !hasCompletedBasicTraining
                ? 'Lõpeta esmalt abipolitseiniku baaskursus'
                : !hasLevel2OrHigher
                    ? 'Jõua tasemele 2 (treeni natuke!)'
                    : undefined
        },
        {
            icon: canAccessDepartment ? '👥' : '🔒',
            label: 'Osakond',
            disabled: !canAccessDepartment,
            action: () => navigate('/department'),
            disabledReason: !hasGraduated
                ? 'Lõpeta esmalt Sisekaitseakadeemia'
                : !hasPrefecture
                    ? 'Vali esmalt maakond'
                    : !hasDepartment
                        ? 'Vali esmalt osakond'
                        : undefined
        }
    ];

    // Determine info text based on player state
    let infoText: string;

    if (!hasCompletedBasicTraining) {
        infoText = 'Alusta abipolitseiniku baaskursusega koolituste lehel!';
    } else if (!hasLevel2OrHigher) {
        infoText = 'Suurepärane! Nüüd treeni natuke, et jõuda tasemele 2 ja saada tööle minna.';
    } else if (stats.activeWork) {
        infoText = 'Sa juba töötad! Oota kuni praegune töö lõppeb.';
    } else if (stats.activeCourse) {
        infoText = 'Sa oled koolituses. Treening on saadaval, töö mitte.';
    } else if (!hasGraduated) {
        infoText = 'Jätka koolitustega, et jõuda Sisekaitseakadeemiasse ja lõpuks lõpetada!';
    } else if (!hasPrefecture) {
        infoText = 'Vali maakond, kus soovid töötada!';
    } else if (!hasDepartment) {
        infoText = 'Vali osakond, kus soovid töötada!';
    } else {
        infoText = 'Kõik funktsioonid on avatud! Vali tegevus menüüst.';
    }

    return (
        <div className="quick-actions-container">
            <h3 className="quick-actions-title">Kiirmenüü</h3>
            <div className="quick-actions-grid">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className={`quick-action-button ${action.disabled ? 'disabled' : ''}`}
                        disabled={action.disabled}
                        onClick={action.disabled ? undefined : action.action}
                        title={action.disabledReason || ''}
                    >
                        <span className="action-icon">{action.icon}</span>
                        <span className="action-label">{action.label}</span>
                        {action.disabled && action.disabledReason && (
                            <span className="disabled-reason">{action.disabledReason}</span>
                        )}
                    </button>
                ))}
            </div>
            <p className="quick-actions-info">{infoText}</p>
        </div>
    );
};