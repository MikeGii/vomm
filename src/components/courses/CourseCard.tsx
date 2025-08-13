// src/components/courses/CourseCard.tsx
import React from 'react';
import { Course } from '../../types';
import '../../styles/components/courses/CourseCard.css';

interface CourseCardProps {
    course: Course;
    onEnroll?: (courseId: string) => void;
    isCompleted?: boolean;
    isEnrolling?: boolean;
    hasActiveCourse?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
                                                          course,
                                                          onEnroll,
                                                          isCompleted = false,
                                                          isEnrolling = false,
                                                          hasActiveCourse = false
                                                      }) => {
    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds} sekundit`;
        const mins = Math.floor(seconds / 60);
        return `${mins} ${mins === 1 ? 'minut' : 'minutit'}`;
    };

    const getCategoryLabel = (category: string): string => {
        switch(category) {
            case 'basic': return 'Baaskoolitus';
            case 'advanced': return 'Edasijõudnud';
            case 'specialist': return 'Spetsialist';
            default: return category;
        }
    };

    if (isCompleted) {
        return (
            <div className="course-card completed">
                <div className="course-header">
                    <h2 className="course-name">{course.name}</h2>
                    <span className="completed-badge">✅ Läbitud</span>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="completion-rewards">
                    <p>Saadud tasud:</p>
                    <ul>
                        <li>{course.rewards.experience} XP</li>
                        {course.rewards.reputation && (
                            <li>{course.rewards.reputation} mainet</li>
                        )}
                        {course.rewards.unlocksRank && (
                            <li>Auaste: {course.rewards.unlocksRank}</li>
                        )}
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="course-card">
            <div className="course-header">
                <h2 className="course-name">{course.name}</h2>
                <span className={`course-category category-${course.category}`}>
                    {getCategoryLabel(course.category)}
                </span>
            </div>
            <p className="course-description">{course.description}</p>

            <div className="course-requirements">
                <h4>Nõuded:</h4>
                <ul>
                    {course.requirements.level && (
                        <li>Tase: {course.requirements.level}</li>
                    )}
                    {course.requirements.reputation && (
                        <li>Maine: {course.requirements.reputation}</li>
                    )}
                    {course.requirements.completedCourses && (
                        <li>Eelnevad koolitused läbitud</li>
                    )}
                </ul>
            </div>

            <div className="course-rewards">
                <h4>Tasu:</h4>
                <ul>
                    <li>+{course.rewards.experience} XP</li>
                    {course.rewards.reputation && (
                        <li>+{course.rewards.reputation} mainet</li>
                    )}
                    {course.rewards.unlocksRank && (
                        <li>Avab: {course.rewards.unlocksRank}</li>
                    )}
                </ul>
            </div>

            <div className="course-footer">
                <span className="course-duration">
                    ⏱️ {formatDuration(course.duration)}
                </span>
                {onEnroll && (
                    <button
                        className="enroll-button"
                        onClick={() => onEnroll(course.id)}
                        disabled={isEnrolling || hasActiveCourse}
                    >
                        {hasActiveCourse ? 'Koolitus käib' : 'Alusta'}
                    </button>
                )}
            </div>
        </div>
    );
};