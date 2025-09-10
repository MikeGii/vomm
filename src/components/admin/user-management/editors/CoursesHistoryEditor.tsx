// src/components/admin/user-management/editors/CoursesHistoryEditor.tsx
import React, { useState, useMemo } from 'react';
import { PlayerStats, Course } from '../../../../types';
import { getCourseById } from '../../../../data/courses';

interface CoursesHistoryEditorProps {
    user: PlayerStats;
    isOpen: boolean;
    onToggle: () => void;
    onFieldUpdate: (path: string, value: any) => void;
}

export const CoursesHistoryEditor: React.FC<CoursesHistoryEditorProps> = ({
                                                                              user,
                                                                              isOpen,
                                                                              onToggle,
                                                                              onFieldUpdate
                                                                          }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Get completed course details
    const completedCourseDetails = useMemo(() => {
        if (!user.completedCourses || user.completedCourses.length === 0) {
            return [];
        }

        return user.completedCourses
            .map(courseId => {
                const course = getCourseById(courseId);
                return course ? { courseId, course } : null;
            })
            .filter(item => item !== null)
            .map(item => item!);
    }, [user.completedCourses]);

    // Filter courses based on search
    const filteredCourses = useMemo(() => {
        if (!searchTerm.trim()) {
            return completedCourseDetails;
        }

        return completedCourseDetails.filter(({ course }) =>
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [completedCourseDetails, searchTerm]);

    const handleRemoveCourse = (courseId: string) => {
        if (user.completedCourses) {
            const updatedCourses = user.completedCourses.filter(id => id !== courseId);
            onFieldUpdate('completedCourses', updatedCourses);
        }
    };

    const handleAddCourse = (courseId: string) => {
        const currentCourses = user.completedCourses || [];
        if (!currentCourses.includes(courseId)) {
            onFieldUpdate('completedCourses', [...currentCourses, courseId]);
        }
    };

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'abipolitseinik': return '#17a2b8';
            case 'sisekaitseakadeemia': return '#28a745';
            case 'politsei': return '#ffd700';
            default: return '#6c757d';
        }
    };

    const getCategoryLabel = (category: string): string => {
        switch (category) {
            case 'abipolitseinik': return 'Abipolitseinik';
            case 'sisekaitseakadeemia': return 'Sisekaitseakadeemia';
            case 'politsei': return 'Politsei';
            default: return 'Muu';
        }
    };

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    };

    return (
        <div className="editor-section">
            <button className="section-header" onClick={onToggle}>
                <span>Kursuste ajalugu ({user.completedCourses?.length || 0} lõpetatud)</span>
                <span className={`section-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="section-content">
                    {/* Active Course */}
                    {user.activeCourse && (
                        <div className="active-course-section">
                            <h4 className="subsection-title">Aktiivne kursus</h4>
                            <div className="active-course-card">
                                <div className="course-header">
                                    <span className="course-name">
                                        {getCourseById(user.activeCourse.courseId)?.name || user.activeCourse.courseId}
                                    </span>
                                    <span className={`course-status status-${user.activeCourse.status}`}>
                                        {user.activeCourse.status === 'in_progress' ? 'Pooleli' :
                                            user.activeCourse.status === 'pending_question' ? 'Ootab küsimust' :
                                                user.activeCourse.status === 'completed' ? 'Lõpetatud' :
                                                    user.activeCourse.status}
                                    </span>
                                </div>
                                <div className="course-actions">
                                    <button
                                        onClick={() => onFieldUpdate('activeCourse.status', 'completed')}
                                        className="complete-course-btn"
                                    >
                                        Märgi lõpetatuks
                                    </button>
                                    <button
                                        onClick={() => onFieldUpdate('activeCourse', null)}
                                        className="cancel-course-btn"
                                    >
                                        Tühista kursus
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Course Search */}
                    <div className="course-search">
                        <input
                            type="text"
                            placeholder="Otsi kursuseid..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Completed Courses List */}
                    <div className="courses-list">
                        <h4 className="subsection-title">Lõpetatud kursused</h4>

                        {filteredCourses.length === 0 ? (
                            <div className="no-courses">
                                {searchTerm ? 'Otsingule vastavaid kursuseid ei leitud' : 'Lõpetatud kursuseid pole'}
                            </div>
                        ) : (
                            <div className="courses-grid">
                                {filteredCourses.map(({ courseId, course }) => (
                                    <div key={courseId} className="course-card">
                                        <div className="course-header">
                                            <div className="course-title">
                                                <span className="course-name">{course.name}</span>
                                                <span
                                                    className="course-category"
                                                    style={{ backgroundColor: getCategoryColor(course.category) }}
                                                >
                                                    {getCategoryLabel(course.category)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCourse(courseId)}
                                                className="remove-course-btn"
                                                title="Eemalda kursus"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="course-details">
                                            <p className="course-description">{course.description}</p>

                                            <div className="course-info">
                                                <span className="course-duration">
                                                    Kestvus: {formatDuration(course.duration)}
                                                </span>
                                                <span className="course-id">ID: {courseId}</span>
                                            </div>

                                            {/* Course Rewards */}
                                            <div className="course-rewards">
                                                <strong>Tasud:</strong>
                                                <span>+{course.rewards.experience} kogemust</span>
                                                {course.rewards.money && <span>+{course.rewards.money}€</span>}
                                                {course.rewards.reputation && <span>+{course.rewards.reputation} mainet</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Course Manually */}
                    <div className="add-course-section">
                        <h4 className="subsection-title">Lisa kursus käsitsi</h4>
                        <div className="add-course-form">
                            <input
                                type="text"
                                placeholder="Sisesta kursuse ID..."
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const courseId = (e.target as HTMLInputElement).value.trim();
                                        if (courseId) {
                                            const course = getCourseById(courseId);
                                            if (course) {
                                                handleAddCourse(courseId);
                                                (e.target as HTMLInputElement).value = '';
                                            } else {
                                                alert('Kursust ei leitud!');
                                            }
                                        }
                                    }
                                }}
                                className="course-id-input"
                            />
                            <div className="add-course-hint">
                                Sisesta kursuse ID ja vajuta Enter. Levinumad: basic_police_training_abipolitseinik, lopueksam
                            </div>
                        </div>
                    </div>

                    {/* Course Statistics */}
                    <div className="course-statistics">
                        <h4 className="subsection-title">Statistika</h4>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Kokku lõpetatud:</span>
                                <span className="stat-value">{user.completedCourses?.length || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Abipolitseinik:</span>
                                <span className="stat-value">
                                    {completedCourseDetails.filter(({course}) => course.category === 'abipolitseinik').length}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Sisekaitseakadeemia:</span>
                                <span className="stat-value">
                                    {completedCourseDetails.filter(({course}) => course.category === 'sisekaitseakadeemia').length}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Politsei:</span>
                                <span className="stat-value">
                                    {completedCourseDetails.filter(({course}) => course.category === 'politsei').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};