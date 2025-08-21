// src/data/courses/index.ts
import { Course } from '../../types';
import { ABIPOLITSEINIK_COURSES } from './abipolitseinikCourses';
import { SISEKAITSEAKADEEMIA_COURSES } from './sisekaitseakadeemiaCourses';
import { POLITSEI_COURSES } from './politseiCourses';

// Export individual course arrays
export { ABIPOLITSEINIK_COURSES } from './abipolitseinikCourses';
export { SISEKAITSEAKADEEMIA_COURSES } from './sisekaitseakadeemiaCourses';
export { POLITSEI_COURSES } from './politseiCourses';

// Combine all courses
export const ALL_COURSES: Course[] = [
    ...ABIPOLITSEINIK_COURSES,
    ...SISEKAITSEAKADEEMIA_COURSES,
    ...POLITSEI_COURSES
];

// Helper function to get course by ID
export const getCourseById = (courseId: string): Course | undefined => {
    return ALL_COURSES.find(course => course.id === courseId);
};

// Helper functions to get courses by category
export const getCoursesByCategory = (category: string): Course[] => {
    return ALL_COURSES.filter(course => course.category === category);
};

// Helper function to get total course count
export const getTotalCourseCount = (): number => {
    return ALL_COURSES.length;
};

// Helper function to get course count by category
export const getCourseCountByCategory = (category: string): number => {
    return ALL_COURSES.filter(course => course.category === category).length;
};