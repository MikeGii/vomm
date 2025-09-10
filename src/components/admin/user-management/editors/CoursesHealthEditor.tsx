// src/components/admin/user-management/editors/CoursesHealthEditor.tsx
import React from 'react';
import { PlayerStats } from '../../../../types';

interface CoursesHealthEditorProps {
    user: PlayerStats;
    isOpen: boolean;
    onToggle: () => void;
    onFieldUpdate: (path: string, value: any) => void;
}

export const CoursesHealthEditor: React.FC<CoursesHealthEditorProps> = ({
                                                                            user,
                                                                            isOpen,
                                                                            onToggle,
                                                                            onFieldUpdate
                                                                        }) => {
    const handleCompletedCoursesChange = (courseValue: string, isChecked: boolean) => {
        const currentCourses = user.completedCourses || [];
        let updatedCourses;

        if (isChecked) {
            updatedCourses = [...currentCourses, courseValue];
        } else {
            updatedCourses = currentCourses.filter(course => course !== courseValue);
        }

        onFieldUpdate('completedCourses', updatedCourses);
    };

    const handleCompletedTestsChange = (testValue: string, isChecked: boolean) => {
        const currentTests = user.completedTests || [];
        let updatedTests;

        if (isChecked) {
            updatedTests = [...currentTests, testValue];
        } else {
            updatedTests = currentTests.filter(test => test !== testValue);
        }

        onFieldUpdate('completedTests', updatedTests);
    };

    const commonCourses = [
        'basic_police_training_abipolitseinik',
        'basic_police_training_kadett',
        'traffic_police_course',
        'investigation_basics',
        'emergency_response',
        'k9_handler_course',
        'cyber_crimes_basics',
        'group_leader_course',
        'unit_leader_course'
    ];

    return (
        <div className="editor-section">
            <button className="section-header" onClick={onToggle}>
                <span>Kursused ja Tervis</span>
                <span className={`section-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="section-content">
                    {/* Health Section */}
                    <h4 className="subsection-title">Terviseandmed</h4>

                    <div className="health-grid">
                        <div className="field-row">
                            <label>Praegune tervis:</label>
                            <input
                                type="number"
                                value={user.health?.current || 100}
                                onChange={(e) => onFieldUpdate('health.current', parseInt(e.target.value) || 100)}
                                min="0"
                                max={user.health?.max || 100}
                            />
                        </div>

                        <div className="field-row">
                            <label>Maksimaalne tervis:</label>
                            <input
                                type="number"
                                value={user.health?.max || 100}
                                onChange={(e) => onFieldUpdate('health.max', parseInt(e.target.value) || 100)}
                                min="1"
                            />
                        </div>

                        <div className="field-row">
                            <label>Põhitervis:</label>
                            <input
                                type="number"
                                value={user.health?.baseHealth || 100}
                                onChange={(e) => onFieldUpdate('health.baseHealth', parseInt(e.target.value) || 100)}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Active Course */}
                    <h4 className="subsection-title">Aktiivne kursus</h4>

                    {user.activeCourse ? (
                        <div className="active-course-info">
                            <div className="field-row">
                                <label>Kursuse ID:</label>
                                <span className="readonly-field">{user.activeCourse.courseId}</span>
                            </div>
                            <div className="field-row">
                                <label>Staatus:</label>
                                <select
                                    value={user.activeCourse.status}
                                    onChange={(e) => onFieldUpdate('activeCourse.status', e.target.value)}
                                >
                                    <option value="in_progress">Pooleli</option>
                                    <option value="completed">Lõpetatud</option>
                                    <option value="cancelled">Tühistatud</option>
                                    <option value="pending_question">Ootab küsimust</option>
                                </select>
                            </div>
                            <div className="field-row">
                                <button
                                    onClick={() => onFieldUpdate('activeCourse', null)}
                                    className="remove-btn"
                                >
                                    Eemalda aktiivne kursus
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="no-active-course">
                            <span>Aktiivne kursus puudub</span>
                        </div>
                    )}

                    {/* Completed Courses */}
                    <h4 className="subsection-title">Lõpetatud kursused</h4>

                    <div className="courses-checklist">
                        {commonCourses.map(course => (
                            <div key={course} className="course-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={user.completedCourses?.includes(course) || false}
                                        onChange={(e) => handleCompletedCoursesChange(course, e.target.checked)}
                                    />
                                    {course.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Custom Course Input */}
                    <div className="custom-course-input">
                        <input
                            type="text"
                            placeholder="Lisa kohandatud kursus..."
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    const courseId = (e.target as HTMLInputElement).value.trim();
                                    if (courseId && !user.completedCourses?.includes(courseId)) {
                                        handleCompletedCoursesChange(courseId, true);
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Completed Tests */}
                    <h4 className="subsection-title">Lõpetatud testid</h4>

                    <div className="tests-display">
                        {user.completedTests && user.completedTests.length > 0 ? (
                            user.completedTests.map((test, index) => (
                                <div key={index} className="test-item">
                                    <span>{test}</span>
                                    <button
                                        onClick={() => handleCompletedTestsChange(test, false)}
                                        className="remove-test-btn"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        ) : (
                            <span>Lõpetatud teste pole</span>
                        )}
                    </div>

                    {/* Active Test */}
                    {user.activeTest && (
                        <>
                            <h4 className="subsection-title">Aktiivne test</h4>
                            <div className="active-test-info">
                                <div className="field-row">
                                    <label>Testi ID:</label>
                                    <span className="readonly-field">{user.activeTest.testId}</span>
                                </div>
                                <div className="field-row">
                                    <label>Praegune küsimus:</label>
                                    <input
                                        type="number"
                                        value={user.activeTest.currentQuestionIndex || 0}
                                        onChange={(e) => onFieldUpdate('activeTest.currentQuestionIndex', parseInt(e.target.value) || 0)}
                                        min="0"
                                        max="9"
                                    />
                                </div>
                                <div className="field-row">
                                    <button
                                        onClick={() => onFieldUpdate('activeTest', null)}
                                        className="remove-btn"
                                    >
                                        Eemalda aktiivne test
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};