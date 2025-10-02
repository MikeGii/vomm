// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
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
    vipBenefit?: string;
    isVipExclusive?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ stats, onShowInstructions }) => {
    const navigate = useNavigate();
    const { isVip } = usePlayerStats();

    const hasCompletedBasicTraining = stats.completedCourses?.includes('basic_police_training_abipolitseinik') || false;
    const hasGraduated = stats.completedCourses?.includes('lopueksam') || false;
    const hasLevel2OrHigher = stats.level >= 2;
    const hasPrefecture = !!stats.prefecture;
    const hasDepartment = !!stats.department;

    const canTrain = hasCompletedBasicTraining;
    const canWork = hasLevel2OrHigher;
    const canAccessDepartment = hasGraduated && hasPrefecture && hasDepartment;

    const actions: ActionItem[] = [
        {
            icon: '📖',
            label: 'Õpetus',
            disabled: false,
            action: () => {
                console.log('🔍 DEBUG: Instructions button clicked!');
                console.log('🔍 DEBUG: onShowInstructions exists:', !!onShowInstructions);
                console.log('🔍 DEBUG: onShowInstructions type:', typeof onShowInstructions);

                if (onShowInstructions) {
                    console.log('🔍 DEBUG: Calling onShowInstructions...');
                    onShowInstructions();
                    console.log('🔍 DEBUG: onShowInstructions called successfully!');
                } else {
                    console.error('🔍 DEBUG: onShowInstructions is not defined!');
                }
            }
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
                : undefined,
            vipBenefit: isVip && canTrain ? '100 klikki tunnis' : undefined
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
                    : undefined,
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

    // Generate info text
    let infoText: string;

    if (!hasCompletedBasicTraining) {
        infoText = 'Alusta abipolitseiniku baaskursusega koolituste lehel!';
    } else if (!hasLevel2OrHigher) {
        const trainingBonus = isVip ? ' VIP kasutajana saad 100 klikki tunnis!' : '';
        infoText = `Suurepärane! Nüüd treeni natuke, et jõuda tasemele 2 ja saada tööle minna.${trainingBonus}`;
    } else if (stats.activeWork) {
        const workBonus = isVip ? ' VIP kasutajana saad töö ajal 30 klikki tunnis!' : '';
        infoText = `Sa juba töötad! Oota kuni praegune töö lõppeb.${workBonus}`;
    } else if (stats.activeCourse) {
        infoText = 'Sa oled koolituses. Treening on saadaval, töö mitte.';
    } else if (!hasGraduated) {
        infoText = 'Jätka koolitustega, et jõuda Sisekaitseakadeemiasse ja lõpuks lõpetada!';
    } else if (!hasPrefecture) {
        infoText = 'Vali maakond, kus soovid töötada!';
    } else if (!hasDepartment) {
        infoText = 'Vali osakond, kus soovid töötada!';
    } else {
        const vipBonus = isVip ? ' VIP staatusega on sul juurdepääs kõigile eelistele!' : '';
        infoText = `Kõik funktsioonid on avatud! Vali tegevus menüüst.${vipBonus}`;
    }

    return (
        <div className={`quick-actions-container ${isVip ? 'vip-quick-actions' : ''}`}>
            <div className="quick-actions-header">
                <h3 className="section-title">Kiirmenüü</h3>
            </div>

            <div className="quick-actions-grid">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className={`quick-action-button ${action.disabled ? 'disabled' : ''} ${
                            isVip && !action.disabled ? 'vip-enhanced' : ''
                        }`}
                        disabled={action.disabled}
                        onClick={action.disabled ? undefined : action.action}
                        title={action.disabled ? action.disabledReason : undefined}
                    >
                        {isVip && !action.disabled && <div className="vip-glow"></div>}

                        <div className="action-content">
                            <span className="action-icon">{action.icon}</span>
                            <span className="action-label">{action.label}</span>

                            {action.vipBenefit && (
                                <span className="vip-benefit">
                                    ✨ {action.vipBenefit}
                                </span>
                            )}
                        </div>

                        {isVip && !action.disabled && (
                            <div className="vip-sparkles">
                                <span className="sparkle">✨</span>
                                <span className="sparkle">💎</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className={`quick-actions-info ${isVip ? 'vip-info' : ''}`}>
                <p>{infoText}</p>
            </div>
        </div>
    );
};