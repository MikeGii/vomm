// src/components/courses/CourseCard.tsx
import React from 'react';
import {Course, PlayerStats} from '../../types';
import '../../styles/components/courses/CourseCard.css';

interface CourseCardProps {
    course: Course;
    onEnroll?: (courseId: string) => void;
    isCompleted?: boolean;
    isEnrolling?: boolean;
    hasActiveCourse?: boolean;
    isActive?: boolean;
    remainingTime?: number;
    playerStats?: PlayerStats;
}

export const CourseCard: React.FC<CourseCardProps> = ({
                                                          course,
                                                          onEnroll,
                                                          isCompleted = false,
                                                          isEnrolling = false,
                                                          hasActiveCourse = false,
                                                          isActive = false,
                                                          remainingTime = 0,
                                                          playerStats
                                                      }) => {

    // Add requirement checking
    const meetsLevelRequirement = !course.requirements.level ||
        (playerStats && playerStats.level >= course.requirements.level);

    const meetsReputationRequirement = !course.requirements.reputation ||
        (playerStats && playerStats.reputation >= course.requirements.reputation);

    const meetsPrerequisiteRequirement = !course.requirements.completedCourses ||
        (playerStats && course.requirements.completedCourses.every(
            courseId => playerStats.completedCourses?.includes(courseId)
        ));

    const meetsAllRequirements = meetsLevelRequirement &&
        meetsReputationRequirement &&
        meetsPrerequisiteRequirement;

    // formatDuration function
    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds} sekundit`;
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            return `${mins} ${mins === 1 ? 'minut' : 'minutit'}`;
        }
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (mins === 0) {
            return `${hours} ${hours === 1 ? 'tund' : 'tundi'}`;
        }
        return `${hours}t ${mins}min`;
    };

    // formatTime function for active courses
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCategoryLabel = (category: string): string => {
        switch(category) {
            case 'abipolitseinik': return 'Abipolitseinik';
            case 'basic': return 'Baaskoolitus';
            case 'advanced': return 'Edasijõudnud';
            case 'specialist': return 'Spetsialist';
            default: return category;
        }
    };

    const progressPercentage = isActive ? ((course.duration - remainingTime) / course.duration) * 100 : 0;

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
        <div className={`course-card ${!meetsAllRequirements ? 'requirements-not-met' : ''}`} id={course.id}>
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
                        <li className={meetsLevelRequirement ? 'requirement-met' : 'requirement-not-met'}>
                            Tase: {course.requirements.level}
                            {playerStats && !meetsLevelRequirement &&
                                ` (Sul on: ${playerStats.level})`}
                        </li>
                    )}
                    {course.requirements.reputation && (
                        <li className={meetsReputationRequirement ? 'requirement-met' : 'requirement-not-met'}>
                            Maine: {course.requirements.reputation}
                            {playerStats && !meetsReputationRequirement &&
                                ` (Sul on: ${playerStats.reputation})`}
                        </li>
                    )}
                    {course.requirements.completedCourses && (
                        <li className={meetsPrerequisiteRequirement ? 'requirement-met' : 'requirement-not-met'}>
                            Eelnevad koolitused läbitud
                            {!meetsPrerequisiteRequirement && ' ❌'}
                        </li>
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
                {isActive ? (
                    <div className="active-course-progress">
                        <div className="time-remaining">
                            Aega jäänud: {formatTime(remainingTime)}
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <span className="course-duration">
                            ⏱️ {formatDuration(course.duration)}
                        </span>
                        {onEnroll && (
                            <button
                                className="enroll-button"
                                onClick={() => onEnroll(course.id)}
                                disabled={isEnrolling || hasActiveCourse || !meetsAllRequirements || !!playerStats?.activeWork}
                            >
                                {!meetsAllRequirements ? 'Nõuded täitmata' :
                                    playerStats?.activeWork ? 'Töö käib' :
                                        hasActiveCourse ? 'Koolitus käib' : 'Alusta'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};