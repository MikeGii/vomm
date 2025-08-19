// src/components/courses/CourseBoosterPanel.tsx
import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { getCourseTimeBoosters, applyCourseTimeBooster } from '../../services/CourseBoosterService';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/courses/CourseBoosterPanel.css';

interface CourseBoosterPanelProps {
    inventory: InventoryItem[];
    currentUserId: string;
    activeCourseEndTime: Date;
    onBoosterApplied: () => void;
}

export const CourseBoosterPanel: React.FC<CourseBoosterPanelProps> = ({
                                                                          inventory,
                                                                          currentUserId,
                                                                          activeCourseEndTime,
                                                                          onBoosterApplied
                                                                      }) => {
    const [isApplying, setIsApplying] = useState(false);
    const { showToast } = useToast();

    const courseBoosters = getCourseTimeBoosters(inventory);

    const handleApplyBooster = async (boosterItemId: string) => {
        if (isApplying) return;

        setIsApplying(true);
        try {
            const result = await applyCourseTimeBooster(currentUserId, boosterItemId);

            if (result.success) {
                showToast(result.message, 'success');
                onBoosterApplied(); // Refresh parent component
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga boosteri rakendamisel', 'error');
        } finally {
            setIsApplying(false);
        }
    };

    const formatTimeRemaining = (endTime: Date): string => {
        const now = new Date();
        const timeDiff = endTime.getTime() - now.getTime();

        if (timeDiff <= 0) return 'Lõppenud';

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else {
            return `${minutes}min`;
        }
    };

    if (courseBoosters.length === 0) {
        return (
            <div className="course-booster-panel">
                <h3 className="booster-title">🚀 Kursuse Kiirendajad</h3>
                <div className="no-boosters">
                    <p>Sul pole kursuse kiirendajaid.</p>
                    <p className="booster-hint">Osta VIP pooest Pollidega!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="course-booster-panel">
            <h3 className="booster-title">🚀 Kursuse Kiirendajad</h3>
            <div className="course-status">
                <p className="time-remaining">
                    Aega jäänud: <span className="time-value">{formatTimeRemaining(activeCourseEndTime)}</span>
                </p>
            </div>

            <div className="boosters-list">
                {courseBoosters.map((booster) => (
                    <div key={booster.id} className="booster-item">
                        <div className="booster-info">
                            <h4 className="booster-name">{booster.name}</h4>
                            <p className="booster-description">{booster.description}</p>
                            <div className="booster-effect">
                                -{booster.consumableEffect?.value}% kursuse aeg
                            </div>
                        </div>
                        <button
                            className="apply-booster-btn"
                            onClick={() => handleApplyBooster(booster.id)}
                            disabled={isApplying}
                        >
                            {isApplying ? 'Rakendab...' : 'Kasuta'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};