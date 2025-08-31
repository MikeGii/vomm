// src/components/department/tabs/VacantPositionsTab.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayerStats } from '../../../types';
import { PositionProcessor, PositionInfo } from '../../../utils/positionProcessor';
import { PositionApplicationService } from '../../../services/PositionApplicationService';
import { PositionCard } from './vacantPositions/PositionCard';
import { PositionModal } from './vacantPositions/PositionModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import '../../../styles/components/department/tabs/VacantPositionsTab.css';

interface VacantPositionsTabProps {
    playerStats: PlayerStats;
    onPlayerStatsUpdate?: () => void;
}

type CategoryFilter = 'frontline' | 'group_leaders' | 'unit_leaders';

export const VacantPositionsTab: React.FC<VacantPositionsTabProps> = ({
                                                                          playerStats,
                                                                          onPlayerStatsUpdate
                                                                      }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [positions, setPositions] = useState<PositionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('frontline');
    const [selectedPosition, setSelectedPosition] = useState<PositionInfo | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

    // Memoize these objects so they don't change on every render
    const positionProcessor = useMemo(() => new PositionProcessor(playerStats), [playerStats]);
    const applicationService = useMemo(() => new PositionApplicationService(), []);

    const loadPositions = useCallback(async () => {
        setLoading(true);

        try {
            const allPositions = await positionProcessor.generateAllPositions();

            // Check for existing applications
            if (playerStats.username) {
                const pendingApplications = await applicationService.checkExistingApplications(playerStats.username);

                // Update positions with application status
                allPositions.forEach(position => {
                    if ((position.isGroupLeader || position.isUnitLeader) && pendingApplications.has(position.positionId)) {
                        position.canApply = false;
                        position.missingRequirements.push('Sul on juba avaldus esitatud');
                    }
                });
            }

            setPositions(allPositions);
        } catch (error) {
            console.error('Error loading positions:', error);
            showToast('Viga ametikohtade laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [playerStats, applicationService, positionProcessor, showToast]);

    useEffect(() => {
        loadPositions();
    }, [loadPositions]);

    const handlePositionAction = async (positionId: string, actionType: 'switch' | 'apply') => {
        if (!currentUser || !playerStats.username || processing) return;

        const position = positions.find(p => p.positionId === positionId);
        if (!position) return;

        setProcessing(positionId);

        try {
            if (actionType === 'apply') {
                const { canApply, message } = await applicationService.canSubmitApplication(
                    playerStats.username,
                    positionId
                );

                if (!canApply) {
                    showToast(message || 'Ei saa avaldust esitada', 'warning');
                    return;
                }

                await applicationService.submitApplication(playerStats, currentUser.uid, positionId);
                showToast(`Avaldus edukalt esitatud positsioonile: ${position.positionName}`, 'success');
            } else {
                await applicationService.switchUnit(currentUser.uid, positionId, position.unitName);
                showToast(`Edukalt üle viidud üksusesse: ${position.unitName}`, 'success');
            }

            if (onPlayerStatsUpdate) {
                onPlayerStatsUpdate();
            }

            await loadPositions();

        } catch (error) {
            console.error('Error processing position action:', error);
            showToast(
                actionType === 'apply' ? 'Viga avalduse esitamisel' : 'Viga üksuse vahetamisel',
                'error'
            );
        } finally {
            setProcessing(null);
        }
    };

    const getFilteredPositions = () => {
        return positions.filter(position => {
            switch (selectedCategory) {
                case 'frontline':
                    return !position.isGroupLeader && !position.isUnitLeader;
                case 'group_leaders':
                    return position.isGroupLeader;
                case 'unit_leaders':
                    return position.isUnitLeader;
                default:
                    return false;
            }
        });
    };

    const getCategoryCount = (category: CategoryFilter): number => {
        switch (category) {
            case 'frontline':
                return positions.filter(p => !p.isGroupLeader && !p.isUnitLeader).length;
            case 'group_leaders':
                return positions.filter(p => p.isGroupLeader).length;
            case 'unit_leaders':
                return positions.filter(p => p.isUnitLeader).length;
            default:
                return 0;
        }
    };

    if (loading) {
        return (
            <div className="vacant-positions-tab">
                <div className="loading">Laadin ametikohtade andmeid...</div>
            </div>
        );
    }

    const filteredPositions = getFilteredPositions();

    return (
        <div className="vacant-positions-tab">
            <div className="tab-header">
                <h3>Ametikohad - {playerStats.department}</h3>
                <div className="category-filters">
                    <button
                        className={`filter-btn ${selectedCategory === 'frontline' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('frontline')}
                    >
                        Eesliini töötajad ({getCategoryCount('frontline')})
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'group_leaders' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('group_leaders')}
                    >
                        Grupijuhid ({getCategoryCount('group_leaders')})
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'unit_leaders' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('unit_leaders')}
                    >
                        Talituse juhid ({getCategoryCount('unit_leaders')})
                    </button>
                </div>
            </div>

            <div className="positions-list">
                {filteredPositions.length === 0 ? (
                    <div className="no-positions">
                        Selles kategoorias pole ametikohti.
                    </div>
                ) : (
                    filteredPositions.map(position => (
                        <PositionCard
                            key={position.positionId}
                            position={position}
                            onViewDetails={setSelectedPosition}
                        />
                    ))
                )}
            </div>

            {selectedPosition && (
                <PositionModal
                    position={selectedPosition}
                    onClose={() => setSelectedPosition(null)}
                    onAction={handlePositionAction}
                    isProcessing={processing === selectedPosition.positionId}
                />
            )}
        </div>
    );
};