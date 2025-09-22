// src/components/patrol/WorkedHoursDisplay.tsx
import React from 'react';
import '../../styles/components/patrol/WorkedHoursDisplay.css';

interface WorkedHoursDisplayProps {
    totalHours: number;
}

export const WorkedHoursDisplay: React.FC<WorkedHoursDisplayProps> = ({ totalHours }) => {
    // Format hours to remove decimal issues
    const formattedHours = Math.floor(totalHours);

    return (
        <div className="worked-hours-display">
            <h3>Töötundide statistika</h3>
            <div className="hours-stat">
                <span className="hours-label">Kokku töötatud:</span>
                <span className="hours-value">{formattedHours} tundi</span>
            </div>
        </div>
    );
};