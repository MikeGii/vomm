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
    vipBenefit?: string; // NEW: VIP benefit description
    isVipExclusive?: boolean; // NEW: VIP-only actions
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
            label: 'Treening & oskuste arendamine',
            disabled: !canTrain,
            action: () => navigate('/training'),
            disabledReason: !hasCompletedBasicTraining
                ? 'Lõpeta esmalt abipolitseiniku baaskursus'
                : undefined,
            vipBenefit: stats.isVip ? '100 klikki tunnis' : '50 klikki tunnis' // VIP benefit
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
            vipBenefit: stats.isVip ? '30 klikki töö ajal' : '10 klikki töö ajal' // VIP benefit
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

    // Enhanced info text with VIP context
    let infoText: string;

    if (!hasCompletedBasicTraining) {
        infoText = 'Alusta abipolitseiniku baaskursusega koolituste lehel!';
    } else if (!hasLevel2OrHigher) {
        const trainingBonus = stats.isVip ? ' VIP kasutajana said 100 klikki tunnis!' : '';
        infoText = `Suurepärane! Nüüd treeni natuke, et jõuda tasemele 2 ja saada tööle minna.${trainingBonus}`;
    } else if (stats.activeWork) {
        const workBonus = stats.isVip ? ' VIP kasutajana said töö ajal 30 klikki tunnis!' : '';
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
        const vipBonus = stats.isVip ? ' VIP staatusega on sul juurdepääs kõigile eelisetsle!' : '';
        infoText = `Kõik funktsioonid on avatud! Vali tegevus menüüst.${vipBonus}`;
    }

    return (
        <div className={`quick-actions-container ${stats.isVip ? 'vip-quick-actions' : ''}`}>
            <div className="quick-actions-header">
                <h3 className="quick-actions-title">Kiirmenüü</h3>
                {stats.isVip && (
                    <span className="vip-status-indicator">
                        <span className="vip-crown">👑</span>
                        VIP
                    </span>
                )}
            </div>
            <div className="quick-actions-grid">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className={`quick-action-button ${action.disabled ? 'disabled' : ''} ${
                            action.isVipExclusive ? 'vip-exclusive' : ''
                        } ${stats.isVip && !action.disabled ? 'vip-enhanced' : ''}`}
                        disabled={action.disabled}
                        onClick={action.disabled ? undefined : action.action}
                        title={action.disabledReason || ''}
                    >
                        <div className="action-content">
                            <span className="action-icon">{action.icon}</span>
                            <span className="action-label">{action.label}</span>

                            {/* VIP Benefit Display */}
                            {action.vipBenefit && (
                                <span className={`vip-benefit ${stats.isVip ? 'vip-active' : 'vip-inactive'}`}>
                                    {action.vipBenefit}
                                </span>
                            )}

                            {/* VIP Exclusive Badge */}
                            {action.isVipExclusive && (
                                <span className="vip-exclusive-badge">
                                    VIP
                                </span>
                            )}
                        </div>

                        {action.disabled && action.disabledReason && (
                            <span className="disabled-reason">{action.disabledReason}</span>
                        )}

                        {/* VIP Sparkle Effect */}
                        {stats.isVip && !action.disabled && (
                            <div className="vip-sparkles">
                                <span className="sparkle">✨</span>
                                <span className="sparkle">✨</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>
            <p className={`quick-actions-info ${stats.isVip ? 'vip-info' : ''}`}>
                {infoText}
            </p>
        </div>
    );
};