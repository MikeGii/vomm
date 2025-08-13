// src/components/courses/CourseTabs.tsx
import React from 'react';
import '../../styles/components/courses/CourseTabs.css';

interface CourseTabsProps {
    activeTab: 'available' | 'completed';
    onTabChange: (tab: 'available' | 'completed') => void;
    availableCount: number;
    completedCount: number;
}

export const CourseTabs: React.FC<CourseTabsProps> = ({
                                                          activeTab,
                                                          onTabChange,
                                                          availableCount,
                                                          completedCount
                                                      }) => {
    return (
        <div className="course-tabs">
            <button
                className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
                onClick={() => onTabChange('available')}
            >
                Saadaval ({availableCount})
            </button>
            <button
                className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => onTabChange('completed')}
            >
                Läbitud ({completedCount})
            </button>
        </div>
    );
};