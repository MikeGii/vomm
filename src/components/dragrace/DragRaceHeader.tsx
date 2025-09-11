// src/components/dragrace/DragRaceHeader.tsx
import React from 'react';

export const DragRaceHeader: React.FC = () => {
    return (
        <div className="dr-header">
            <div className="dr-header-content">
                <h1 className="dr-page-title">
                    <span className="dr-title-icon">🏁</span>
                    Kiirendusrada
                </h1>
                <p className="dr-page-description">
                    Treeni oma sõidoskusi kiirendusrajal. Teil on 5 tasuta katset tunnis või ostke lisaks kütust.
                </p>
            </div>
        </div>
    );
};