// src/components/courses/CourseCard.tsx
import React from 'react';
import { Course, PlayerAttributes, PlayerStats } from '../../types';
import { calculateEquipmentBonuses} from "../../services/EquipmentBonusService";
import '../../styles/components/courses/CourseCard.css';
import {getCourseById} from "../../data/courses";

interface CourseCardProps {
    course: Course;
    onEnroll?: (courseId: string) => void;
    isCompleted?: boolean;
    isStatusCourse?: boolean;
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
                                                          isStatusCourse = false,
                                                          isEnrolling = false,
                                                          hasActiveCourse = false,
                                                          isActive = false,
                                                          remainingTime = 0,
                                                          playerStats
                                                      }) => {

    // Helper function for attribute names
    const getAttributeName = (attr: string): string => {
        const names: { [key: string]: string } = {
            strength: 'Jõud',
            agility: 'Kiirus',
            dexterity: 'Osavus',
            intelligence: 'Intelligentsus',
            endurance: 'Vastupidavus'
        };
        return names[attr] || attr;
    };

    // Get prerequisite course details
    const getPrerequisiteDetails = () => {
        if (!course.requirements.completedCourses || course.requirements.completedCourses.length === 0) {
            return null;
        }

        return course.requirements.completedCourses.map(courseId => {
            const prereqCourse = getCourseById(courseId);
            const isCompleted = playerStats?.completedCourses?.includes(courseId) || false;
            return {
                id: courseId,
                name: prereqCourse?.name || courseId,
                isCompleted
            };
        });
    };

    const prerequisiteDetails = getPrerequisiteDetails();
    const equipmentBonuses = playerStats?.equipment ? calculateEquipmentBonuses(playerStats.equipment) : null;


    // Add requirement checking
    const meetsLevelRequirement = !course.requirements.level ||
        (playerStats && playerStats.level >= course.requirements.level);

    const meetsReputationRequirement = !course.requirements.reputation ||
        (playerStats && playerStats.reputation >= course.requirements.reputation);

    const meetsPrerequisiteRequirement = !course.requirements.completedCourses ||
        (playerStats && course.requirements.completedCourses.every(
            courseId => playerStats.completedCourses?.includes(courseId)
        ));

    const meetsWorkHoursRequirement = !course.requirements.totalWorkedHours ||
        (playerStats && (playerStats.totalWorkedHours || 0) >= course.requirements.totalWorkedHours);

    const meetsAttributeRequirements = !course.requirements.attributes ||
        (playerStats && Object.entries(course.requirements.attributes).every(([attr, requiredLevel]) => {
            if (!playerStats.attributes) return false;

            const playerAttribute = playerStats.attributes[attr as keyof PlayerAttributes];
            const baseLevel = playerAttribute ? playerAttribute.level : 0;
            const equipmentBonus = equipmentBonuses ? equipmentBonuses[attr as keyof typeof equipmentBonuses] || 0 : 0;
            const effectiveLevel = baseLevel + equipmentBonus;

            return effectiveLevel >= requiredLevel;
        }));

    const meetsAllRequirements = meetsLevelRequirement &&
        meetsReputationRequirement &&
        meetsPrerequisiteRequirement &&
        meetsWorkHoursRequirement &&
        meetsAttributeRequirements;

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
            case 'sisekaitseakadeemia': return 'Sisekaitseakadeemia';
            case 'basic': return 'Baaskoolitus';
            case 'advanced': return 'Edasijõudnud';
            case 'specialist': return 'Spetsialist';
            default: return category;
        }
    };

    const progressPercentage = isActive ? ((course.duration - remainingTime) / course.duration) * 100 : 0;

    // Check if this specific course is completed (for status tabs)
    const isCourseCompleted = playerStats?.completedCourses?.includes(course.id) || false;

    // Determine the card class based on status
    const getCardClassName = () => {
        let className = 'course-card';

        if (isStatusCourse) {
            className += isCourseCompleted ? ' status-completed' : ' status-available';
        } else if (isCompleted) {
            className += ' completed';
        } else if (!meetsAllRequirements) {
            className += ' requirements-not-met';
        }

        return className;
    };

    // Handle completed courses (both in completed tab and status tabs)
    if (isCompleted || (isStatusCourse && isCourseCompleted)) {
        return (
            <div className={getCardClassName()} id={course.id}>
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
                        {course.rewards.money && (
                            <li>{course.rewards.money} €</li>
                        )}
                        {course.rewards.grantsAbility && (
                            <li>Omandatud oskus</li>
                        )}
                        {course.rewards.unlocksRank && (
                            <li>Auaste: {course.rewards.unlocksRank}</li>
                        )}
                        {course.rewards.unlocksStatus && (
                            <li>Staatus: {course.rewards.unlocksStatus}</li>
                        )}
                    </ul>
                </div>
            </div>
        );
    }

    // Handle status tab courses that are not completed
    if (isStatusCourse && !isCourseCompleted) {
        return (
            <div className={getCardClassName()} id={course.id}>
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
                        {course.requirements.totalWorkedHours && (
                            <li className={meetsWorkHoursRequirement ? 'requirement-met' : 'requirement-not-met'}>
                                Töötunnid: {course.requirements.totalWorkedHours}h
                                {playerStats && !meetsWorkHoursRequirement &&
                                    ` (Sul on: ${playerStats.totalWorkedHours || 0}h)`}
                            </li>
                        )}

                        {/* Enhanced prerequisite courses display */}
                        {prerequisiteDetails && prerequisiteDetails.length > 0 && (
                            <li className={`prerequisite-courses ${meetsPrerequisiteRequirement ? 'requirement-met' : 'requirement-not-met'}`}>
                                <span className="prerequisite-header">Eelnevad koolitused:</span>
                                <ul className="prerequisite-list">
                                    {prerequisiteDetails.map(prereq => (
                                        <li
                                            key={prereq.id}
                                            className={prereq.isCompleted ? 'prereq-completed' : 'prereq-not-completed'}
                                        >
                                            {prereq.isCompleted ? '✅' : '❌'} {prereq.name}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        )}

                        {course.requirements.attributes && Object.entries(course.requirements.attributes).map(([attr, requiredLevel]) => {
                            const playerLevel = playerStats?.attributes?.[attr as keyof PlayerAttributes]?.level || 0;
                            const equipmentBonus = equipmentBonuses ? equipmentBonuses[attr as keyof typeof equipmentBonuses] || 0 : 0;
                            const effectiveLevel = playerLevel + equipmentBonus;
                            const meetsReq = effectiveLevel >= requiredLevel;

                            return (
                                <li key={attr} className={meetsReq ? 'requirement-met' : 'requirement-not-met'}>
                                    {getAttributeName(attr)}: {requiredLevel}
                                    {playerStats && !meetsReq && (
                                        ` (Sul on: ${playerLevel}${equipmentBonus > 0 ? `+${equipmentBonus}` : ''})`
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="course-rewards">
                    <h4>Tasu:</h4>
                    <ul>
                        <li>+{course.rewards.experience} XP</li>
                        {course.rewards.reputation && (
                            <li>+{course.rewards.reputation} mainet</li>
                        )}
                        {course.rewards.money && (
                            <li>+{course.rewards.money} €</li>
                        )}
                        {course.rewards.grantsAbility && (
                            <li>
                                {course.rewards.replacesAbility
                                    ? 'Täiustab oskust: Tulirelva kandmine'
                                    : 'Annab uue oskuse'}
                            </li>
                        )}
                        {course.rewards.unlocksRank && (
                            <li>Avab auastme: {course.rewards.unlocksRank}</li>
                        )}
                        {course.rewards.unlocksStatus && (
                            <li>Avab staatuse: {course.rewards.unlocksStatus}</li>
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
                            disabled={isEnrolling || hasActiveCourse || !meetsAllRequirements || !!playerStats?.activeWork}
                        >
                            {!meetsAllRequirements ? 'Nõuded täitmata' :
                                playerStats?.activeWork ? 'Töö käib' :
                                    hasActiveCourse ? 'Koolitus käib' : 'Alusta'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Regular course card (available tab) - keep existing implementation
    return (
        <div className={getCardClassName()} id={course.id}>
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
                    {course.requirements.totalWorkedHours && (
                        <li className={meetsWorkHoursRequirement ? 'requirement-met' : 'requirement-not-met'}>
                            Töötunnid: {course.requirements.totalWorkedHours}h
                            {playerStats && !meetsWorkHoursRequirement &&
                                ` (Sul on: ${playerStats.totalWorkedHours || 0}h)`}
                        </li>
                    )}

                    {/* Enhanced prerequisite courses display */}
                    {prerequisiteDetails && prerequisiteDetails.length > 0 && (
                        <li className={`prerequisite-courses ${meetsPrerequisiteRequirement ? 'requirement-met' : 'requirement-not-met'}`}>
                            <span className="prerequisite-header">Eelnevad koolitused:</span>
                            <ul className="prerequisite-list">
                                {prerequisiteDetails.map(prereq => (
                                    <li
                                        key={prereq.id}
                                        className={prereq.isCompleted ? 'prereq-completed' : 'prereq-not-completed'}
                                    >
                                        {prereq.isCompleted ? '✅' : '❌'} {prereq.name}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    )}

                    {course.requirements.attributes && Object.entries(course.requirements.attributes).map(([attr, requiredLevel]) => {
                        const playerLevel = playerStats?.attributes?.[attr as keyof PlayerAttributes]?.level || 0;
                        const equipmentBonus = equipmentBonuses ? equipmentBonuses[attr as keyof typeof equipmentBonuses] || 0 : 0;
                        const effectiveLevel = playerLevel + equipmentBonus;
                        const meetsReq = effectiveLevel >= requiredLevel;

                        return (
                            <li key={attr} className={meetsReq ? 'requirement-met' : 'requirement-not-met'}>
                                {getAttributeName(attr)}: {requiredLevel}
                                {playerStats && !meetsReq && (
                                    ` (Sul on: ${playerLevel}${equipmentBonus > 0 ? `+${equipmentBonus}` : ''})`
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="course-rewards">
                <h4>Tasu:</h4>
                <ul>
                    <li>+{course.rewards.experience} XP</li>
                    {course.rewards.reputation && (
                        <li>+{course.rewards.reputation} mainet</li>
                    )}
                    {course.rewards.money && (
                        <li>+{course.rewards.money} €</li>
                    )}
                    {course.rewards.grantsAbility && (
                        <li>
                            {course.rewards.replacesAbility
                                ? 'Täiustab oskust: Tulirelva kandmine'
                                : 'Annab uue oskuse'}
                        </li>
                    )}
                    {course.rewards.unlocksRank && (
                        <li>Avab auastme: {course.rewards.unlocksRank}</li>
                    )}
                    {course.rewards.unlocksStatus && (
                        <li>Avab staatuse: {course.rewards.unlocksStatus}</li>
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