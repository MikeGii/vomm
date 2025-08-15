// src/components/patrol/WorkedHoursDisplay.tsx
import React from 'react';
import '../../styles/components/patrol/WorkedHoursDisplay.css';

interface WorkedHoursDisplayProps {
    totalHours: number;
}

export const WorkedHoursDisplay: React.FC<WorkedHoursDisplayProps> = ({ totalHours }) => {
    return (
        <div className="worked-hours-display">
            <h3>Töötundide statistika</h3>
            <div className="hours-stat">
                <span className="hours-label">Kokku töötatud:</span>
                <span className="hours-value">{totalHours} tundi</span>
            </div>
        </div>
    );
};