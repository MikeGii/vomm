// src/components/courses/CourseTabs.tsx
import React from 'react';
import { CourseTab, TabType} from "../../types/courseTabs.types";
import { PlayerStats} from "../../types";
import '../../styles/components/courses/CourseTabs.css';

interface CourseTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    playerStats: PlayerStats | null;
    courseCounts: Record<TabType, number>;
}

export const CourseTabs: React.FC<CourseTabsProps> = ({
                                                          activeTab,
                                                          onTabChange,
                                                          playerStats,
                                                          courseCounts
                                                      }) => {
    // Define all possible tabs
    const allTabs: CourseTab[] = [
        {
            id: 'available',
            label: 'Saadaval',
            count: courseCounts.available
        },
        {
            id: 'completed',
            label: 'Läbitud',
            count: courseCounts.completed
        },
        {
            id: 'abipolitseinik',
            label: 'Abipolitseinik',
            requiresStatus: 'Abipolitseinik',
            category: 'abipolitseinik',
            count: courseCounts.abipolitseinik
        },
        {
            id: 'sisekaitseakadeemia',
            label: 'Sisekaitseakadeemia',
            requiresStatus: 'Kadett',
            category: 'sisekaitseakadeemia',
            count: courseCounts.sisekaitseakadeemia
        },
        {
            id: 'politsei',
            label: 'Politsei',
            requiresStatus: 'Politseiametnik',
            category: 'politsei',
            count: courseCounts.politsei
        }
    ];

    const hasStatus = (requiredStatus: string): boolean => {
        if (!playerStats || !requiredStatus) return false;

        // Check if player has the required status based on completed courses
        if (requiredStatus === 'Abipolitseinik') {
            // Player is Abipolitseinik when they've completed basic training course
            return playerStats.completedCourses?.includes('basic_police_training_abipolitseinik') || false;
        }
        if (requiredStatus === 'Kadett') {
            // Player is Kadett when they've entered the academy
            return playerStats.completedCourses?.includes('sisekaitseakadeemia_entrance') || false;
        }
        if (requiredStatus === 'Politseiametnik') {
            // Player is full officer when they've graduated
            return playerStats.completedCourses?.includes('lopueksam') || false;
        }
        return false;
    };

    // Filter tabs based on unlock status
    const visibleTabs = allTabs.filter(tab => {
        // Always show available and completed tabs
        if (tab.id === 'available' || tab.id === 'completed') {
            return true;
        }
        // Show status tabs only if unlocked
        return tab.requiresStatus ? hasStatus(tab.requiresStatus) : false;
    });

    return (
        <div className="course-tabs">
            {visibleTabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                    {tab.count !== undefined && ` (${tab.count})`}
                </button>
            ))}
        </div>
    );
};