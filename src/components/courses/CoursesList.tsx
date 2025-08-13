// src/components/courses/CoursesList.tsx
import React from 'react';
import { Course } from '../../types';
import { CourseCard } from './CourseCard';
import '../../styles/components/courses/CoursesList.css';

interface CoursesListProps {
    courses: Course[];
    isCompleted?: boolean;
    onEnroll?: (courseId: string) => void;
    isEnrolling?: boolean;
    hasActiveCourse?: boolean;
}

export const CoursesList: React.FC<CoursesListProps> = ({
                                                            courses,
                                                            isCompleted = false,
                                                            onEnroll,
                                                            isEnrolling = false,
                                                            hasActiveCourse = false
                                                        }) => {
    if (courses.length === 0) {
        return (
            <div className="no-courses">
                {isCompleted ? (
                    <p>Sa pole veel ühtegi koolitust läbinud.</p>
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
            {courses.map(course => (
                <CourseCard
                    key={course.id}
                    course={course}
                    isCompleted={isCompleted}
                    onEnroll={onEnroll}
                    isEnrolling={isEnrolling}
                    hasActiveCourse={hasActiveCourse}
                />
            ))}
        </div>
    );
};