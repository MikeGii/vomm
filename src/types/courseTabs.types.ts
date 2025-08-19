// src/types/courseTabs.types.ts
export type TabType = 'available' | 'completed' | 'abipolitseinik' | 'sisekaitseakadeemia' | 'politsei';

export interface CourseTab {
    id: TabType;
    label: string;
    requiresStatus?: string; // The status needed to unlock this tab
    category?: string; // The course category to filter by
    count?: number; // Number of courses in this tab
    locked?: boolean; // Whether the tab is locked
}