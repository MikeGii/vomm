// src/components/courses/ActiveCourseProgress.tsx
import React from 'react';
import { Course } from '../../types';
import { formatTimeEstonian} from "../../utils/timeFormatter";
import '../../styles/components/courses/ActiveCourseProgress.css';

interface ActiveCourseProgressProps {
    course: Course;
    remainingTime: number;
}

export const ActiveCourseProgress: React.FC<ActiveCourseProgressProps> = ({
                                                                              course,
                                                                              remainingTime
                                                                          }) => {
    const progressPercentage = ((course.duration - remainingTime) / course.duration) * 100;

    return (
        <div className="active-course-banner">
            <h3>Käimasolev koolitus</h3>
            <p className="active-course-name">{course.name}</p>
            <div className="progress-container">
                <div className="time-remaining">
                    Aega jäänud: {formatTimeEstonian(remainingTime)}
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>
            <p className="course-warning">
                ⚠️ Koolituse ajal ei saa teisi tegevusi teha
            </p>
        </div>
    );
};