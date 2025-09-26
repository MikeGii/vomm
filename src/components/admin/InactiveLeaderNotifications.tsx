// src/components/admin/InactiveLeaderNotifications.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    InactiveLeader,
    detectInactiveLeaders,
    demoteInactiveLeader
} from '../../services/InactiveLeaderService';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/admin/InactiveLeaderNotifications.css';

export const InactiveLeaderNotifications: React.FC = () => {
    const [inactiveLeaders, setInactiveLeaders] = useState<InactiveLeader[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingDemotion, setProcessingDemotion] = useState<string | null>(null);
    const { showToast } = useToast();

    // Wrap loadInactiveLeaders in useCallback to prevent infinite loops
    const loadInactiveLeaders = useCallback(async () => {
        setLoading(true);
        try {
            const leaders = await detectInactiveLeaders();
            setInactiveLeaders(leaders);
        } catch (error) {
            console.error('Viga mitteaktiivsete juhtide laadimisel:', error);
            showToast('Viga mitteaktiivsete juhtide laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]); // Add showToast as dependency

    useEffect(() => {
        loadInactiveLeaders();
    }, [loadInactiveLeaders]); // Now we can safely add it as dependency

    const handleDemote = async (leader: InactiveLeader) => {
        // Fixed: Use window.confirm instead of global confirm
        if (!window.confirm(`Kas oled kindel, et soovid ${leader.username} maha võtta ${getPositionName(leader.position)} positsioonilt?`)) {
            return;
        }

        setProcessingDemotion(leader.userId);

        try {
            await demoteInactiveLeader(
                leader.userId,
                leader.position,
                leader.department,
                leader.departmentUnit
            );

            showToast(`${leader.username} on edukalt maha võetud juhi positsioonilt`, 'success');

            // Eemalda listist
            setInactiveLeaders(prev => prev.filter(l => l.userId !== leader.userId));
        } catch (error) {
            console.error('Viga juhi maha võtmisel:', error);
            showToast('Viga juhi maha võtmisel', 'error');
        } finally {
            setProcessingDemotion(null);
        }
    };

    const getPositionName = (position: string): string => {
        const positions: Record<string, string> = {
            'grupijuht_patrol': 'Patrullitalituse grupijuht',
            'grupijuht_investigation': 'Menetlustalituse grupijuht',
            'grupijuht_emergency': 'Kiirreageerimise grupijuht',
            'grupijuht_k9': 'K9 grupijuht',
            'grupijuht_cyber': 'Küberkuritegevuse grupijuht',
            'grupijuht_crimes': 'Kuritegude grupijuht',
            'talituse_juht_patrol': 'Patrullitalituse juht',
            'talituse_juht_investigation': 'Menetlustalituse juht',
            'talituse_juht_emergency': 'Kiirreageerimise talituse juht',
            'talituse_juht_k9': 'K9 talituse juht',
            'talituse_juht_cyber': 'Küberkuritegevuse talituse juht',
            'talituse_juht_crimes': 'Kuritegude talituse juht'
        };
        return positions[position] || position;
    };

    const formatLastSeen = (date: Date): string => {
        return date.toLocaleDateString('et-EE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="inactive-leaders-section">
                <div className="loading">Kontrollin mitteaktiivseid juhte...</div>
            </div>
        );
    }

    if (inactiveLeaders.length === 0) {
        return null; // Ära näita midagi kui kõik juhid on aktiivsed
    }

    return (
        <div className="inactive-leaders-section">
            <div className="section-header">
                <h4>⚠️ Mitteaktiivsed juhid</h4>
                <span className="inactive-count">{inactiveLeaders.length} juht(i) vajab tähelepanu</span>
            </div>

            <div className="inactive-leaders-list">
                {inactiveLeaders.map(leader => (
                    <div key={leader.userId} className="inactive-leader-card">
                        <div className="leader-info">
                            <div className="leader-main">
                                <h5>{leader.username}</h5>
                                <span className="position-badge">{getPositionName(leader.position)}</span>
                            </div>
                            <div className="leader-details">
                                <span className="department">{leader.department} - {leader.departmentUnit}</span>
                                <span className="last-seen">
                  Viimati aktiivne: {formatLastSeen(leader.lastSeen)}
                </span>
                                <span className="days-inactive">
                  ({leader.daysInactive} päeva tagasi)
                </span>
                            </div>
                        </div>

                        <div className="leader-actions">
                            <button
                                className="demote-btn"
                                onClick={() => handleDemote(leader)}
                                disabled={processingDemotion === leader.userId}
                            >
                                {processingDemotion === leader.userId ?
                                    'Töötlen...' :
                                    'Võta maha positsioonilt'
                                }
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="section-footer">
                <p className="info-text">
                    ℹ️ Juhid, kes pole olnud aktiivsed 14+ päeva, võetakse automaatselt maha juhi positsioonilt
                    ja viiakse tagasi tavaliseks töötajaks samas üksuses.
                </p>
            </div>
        </div>
    );
};