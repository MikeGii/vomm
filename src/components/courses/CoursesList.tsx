// src/components/courses/CoursesList.tsx
import React from 'react';
import { Course, PlayerStats } from '../../types';
import { CourseCard } from './CourseCard';
import '../../styles/components/courses/CoursesList.css';

interface CoursesListProps {
    courses: Course[];
    isCompleted?: boolean;
    isStatusTab?: boolean;
    statusCategory?: string;
    onEnroll?: (courseId: string) => void;
    isEnrolling?: boolean;
    hasActiveCourse?: boolean;
    activeCourseId?: string;
    remainingTime?: number;
    playerStats?: PlayerStats;
}

export const CoursesList: React.FC<CoursesListProps> = ({
                                                            courses,
                                                            isCompleted = false,
                                                            isStatusTab = false,
                                                            statusCategory,
                                                            onEnroll,
                                                            isEnrolling = false,
                                                            hasActiveCourse = false,
                                                            activeCourseId,
                                                            remainingTime = 0,
                                                            playerStats
                                                        }) => {
    // Helper function to get status category label
    const getStatusCategoryLabel = (category?: string): string => {
        switch(category) {
            case 'abipolitseinik': return 'Abipolitseiniku';
            case 'sisekaitseakadeemia': return 'Sisekaitseakadeemia';
            case 'advanced': return 'edasijõudnud';
            case 'specialist': return 'spetsialisti';
            default: return '';
        }
    };

    if (courses.length === 0) {
        return (
            <div className="no-courses">
                {isCompleted ? (
                    <p>Sa pole veel ühtegi koolitust läbinud.</p>
                ) : isStatusTab ? (
                    <p>Selles {getStatusCategoryLabel(statusCategory)} kategoorias pole koolitusi saadaval.</p>
                ) : (
                    <>
                        <p>Hetkel pole ühtegi koolitust saadaval.</p>
                        <p className="hint">Tõsta oma taset ja mainet, et avada uusi koolitusi!</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="courses-grid">
            {courses.map(course => {
                // Check if course is completed for status tabs
                const isCourseCompleted = playerStats?.completedCourses?.includes(course.id) || false;

                return (
                    <CourseCard
                        key={course.id}
                        course={course}
                        isCompleted={isCompleted || (isStatusTab && isCourseCompleted)}
                        isStatusCourse={isStatusTab}  // Pass the status tab indicator
                        onEnroll={onEnroll}  // Always pass onEnroll, CourseCard will handle when to show it
                        isEnrolling={isEnrolling}
                        hasActiveCourse={hasActiveCourse || Boolean(playerStats?.activeWork)}
                        isActive={course.id === activeCourseId}
                        remainingTime={course.id === activeCourseId ? remainingTime : 0}
                        playerStats={playerStats}
                    />
                );
            })}
        </div>
    );
};