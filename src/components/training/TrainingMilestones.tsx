// src/components/training/TrainingMilestones.tsx
import React from 'react';
import { TRAINING_ACTIVITIES } from '../../data/trainingActivities';
import '../../styles/components/training/TrainingMilestones.css';

interface TrainingMilestonesProps {
    currentLevel: number;
}

export const TrainingMilestones: React.FC<TrainingMilestonesProps> = ({ currentLevel }) => {
    // Get all unique level requirements from training activities
    const levelMilestones = [...new Set(
        TRAINING_ACTIVITIES.map(activity => activity.requiredLevel)
    )].sort((a, b) => a - b);

    // Find the next milestone
    const nextMilestone = levelMilestones.find(level => level > currentLevel);

    // Check if there are locked activities
    const hasLockedActivities = TRAINING_ACTIVITIES.some(
        activity => activity.requiredLevel > currentLevel
    );

    if (!hasLockedActivities) {
        return null; // Don't show anything if all activities are unlocked
    }

    if (!nextMilestone) return null;

    // Calculate progress percentage
    const prevMilestone = levelMilestones.filter(level => level <= currentLevel).pop() || 1;
    const progress = ((currentLevel - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

    return (
        <div className="milestone-compact">
            <div className="milestone-text">
                <span>Uued treeningud avanevad tasemel {nextMilestone}</span>
                <span className="milestone-remaining">({nextMilestone - currentLevel} taset puudu)</span>
            </div>
            <div className="milestone-progress-bar">
                <div
                    className="milestone-progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};