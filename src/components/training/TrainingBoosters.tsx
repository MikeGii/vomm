// src/components/training/TrainingBoosters.tsx - Updated with empty state message
import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { consumeTrainingBooster } from '../../services/TrainingBoosterService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/training/TrainingBoosters.css';

interface TrainingBoostersProps {
    boosters: InventoryItem[];
    currentClicks: number;
    maxClicks: number;
    onBoosterUsed: () => void;
}

export const TrainingBoosters: React.FC<TrainingBoostersProps> = ({
                                                                      boosters,
                                                                      currentClicks,
                                                                      maxClicks,
                                                                      onBoosterUsed
                                                                  }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isUsing, setIsUsing] = useState(false);

    const handleUseBooster = async (booster: InventoryItem) => {
        if (!currentUser || isUsing) return;

        if (currentClicks >= maxClicks) {
            showToast('Sul on juba maksimaalne arv treeningklõpse!', 'info');
            return;
        }

        setIsUsing(true);
        try {
            const result = await consumeTrainingBooster(currentUser.uid, booster.id);

            if (result.success) {
                showToast(result.message, 'success');
                onBoosterUsed();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga treeningtarbe kasutamisel', 'error');
        } finally {
            setIsUsing(false);
        }
    };

    // Always show the container, but with different content
    return (
        <div className="training-boosters">
            <h3 className="boosters-title">Sporditarbed</h3>

            {boosters.length === 0 ? (
                // Empty state message
                <div className="boosters-empty-state">
                    <p className="empty-state-message">
                        Treeningkorduste kiiremaks taastamiseks osta poest treeningtarbeid!
                    </p>
                    <button
                        className="go-to-shop-button"
                        onClick={() => navigate('/shop')}
                    >
                        Mine poodi
                    </button>
                </div>
            ) : (
                // Show boosters when available
                <>
                    <div className="boosters-info">
                        <p>Praegused treeningklõpsud: <strong>{currentClicks}/{maxClicks}</strong></p>
                    </div>
                    <div className="boosters-grid">
                        {boosters.map(booster => (
                            <div key={booster.id} className="booster-card">
                                <div className="booster-header">
                                    <h4 className="booster-name">{booster.name}</h4>
                                    <span className="booster-effect">
                                        +{booster.consumableEffect?.value} klõpsu
                                    </span>
                                </div>
                                <p className="booster-description">{booster.description}</p>
                                <button
                                    className="booster-use-button"
                                    onClick={() => handleUseBooster(booster)}
                                    disabled={isUsing || currentClicks >= maxClicks}
                                >
                                    {currentClicks >= maxClicks ? 'Max klõpsud' : 'Kasuta'}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};