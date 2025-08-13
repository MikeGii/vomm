// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { PlayerStats } from '../../types';
import '../../styles/components/QuickActions.css';

interface QuickActionsProps {
    stats: PlayerStats;
    onApplyForJob?: () => void;
}

interface ActionItem {
    icon: string;
    label: string;
    disabled: boolean;
    action?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ stats, onApplyForJob }) => {
    const employedActions: ActionItem[] = [
        { icon: '🚓', label: 'Alusta patrullimist', disabled: true },
        { icon: '📋', label: 'Vaata juhtumeid', disabled: true },
        { icon: '🎯', label: 'Treening', disabled: true },
        { icon: '👥', label: 'Osakond', disabled: true }
    ];

    const unemployedActions: ActionItem[] = [
        { icon: '👮', label: 'Kandideeri politseisse', disabled: false, action: onApplyForJob },
        { icon: '📚', label: 'Õpi seadusi', disabled: true },
        { icon: '🏃', label: 'Füüsiline ettevalmistus', disabled: true },
        { icon: '📰', label: 'Loe uudiseid', disabled: true }
    ];

    const actions = stats.isEmployed ? employedActions : unemployedActions;

    return (
        <div className="quick-actions-container">
            <h3 className="quick-actions-title">
                {stats.isEmployed ? 'Kiirmenüü' : 'Alusta teekonda'}
            </h3>
            <div className="quick-actions-grid">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className="quick-action-button"
                        disabled={action.disabled}
                        onClick={action.action}
                    >
                        <span className="action-icon">{action.icon}</span>
                        <span className="action-label">{action.label}</span>
                    </button>
                ))}
            </div>
            <p className="quick-actions-info">
                {stats.isEmployed
                    ? 'Rohkem funktsioone tulekul...'
                    : 'Alusta kandideerimisega politseiteenistusse!'}
            </p>
        </div>
    );
};