// src/data/tests/index.ts
import { Test } from '../../types';
import { ABIPOLITSEINIK_TESTS } from './abipolitseinik';
import { SISEKAITSEAKADEEMIA_TESTS } from './sisekaitseakadeemia';
import { POLITSEI_TESTS } from './politsei';

// Combine all tests from all categories
export const ALL_TESTS: Test[] = [
    ...ABIPOLITSEINIK_TESTS,
    ...SISEKAITSEAKADEEMIA_TESTS,
    ...POLITSEI_TESTS
];

// Helper function to get test by ID (similar to getCourseById)
export const getTestById = (testId: string): Test | undefined => {
    return ALL_TESTS.find(test => test.id === testId);
};

// Helper function to get tests by category
export const getTestsByCategory = (category: 'abipolitseinik' | 'sisekaitseakadeemia' | 'politsei'): Test[] => {
    return ALL_TESTS.filter(test => test.category === category);
};