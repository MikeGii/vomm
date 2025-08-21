// src/data/departmentUnits.ts
export interface DepartmentUnit {
    id: string;
    name: string;
    description: string;
    isDefault?: boolean;
    requirements?: {
        minimumLevel?: number;
        requiredCourses?: string[];
        specialRequirements?: string[];
    };
}

export const DEPARTMENT_UNITS: DepartmentUnit[] = [
    {
        id: 'patrol',
        name: 'Patrulltalitus',
        description: 'Avaliku korra tagamine ja patrullteenuse osutamine',
        isDefault: true
    },
    {
        id: 'procedural_service',
        name: 'Menetlustalitus',
        description: 'Kuritegude uurimine ja tõendite kogumine.',
        requirements: {
            minimumLevel: 50,
            requiredCourses: ['enhanced_law_studies'],
            specialRequirements: ['Peab olema lõpetanud süüteomenetluse täiendkursuse']
        }
    }
];

export const getUnitById = (unitId: string): DepartmentUnit | undefined => {
    return DEPARTMENT_UNITS.find(unit => unit.id === unitId);
};

export const getDefaultUnit = (): DepartmentUnit => {
    return DEPARTMENT_UNITS.find(unit => unit.isDefault) || DEPARTMENT_UNITS[0];
};

export const getAvailableUnits = (
    playerLevel: number,
    completedCourses: string[]
): DepartmentUnit[] => {
    return DEPARTMENT_UNITS.filter(unit => {
        if (!unit.requirements) return true;

        // Check level requirement
        if (unit.requirements.minimumLevel && playerLevel < unit.requirements.minimumLevel) {
            return false;
        }

        // Check course requirements
        if (unit.requirements.requiredCourses) {
            const hasAllCourses = unit.requirements.requiredCourses.every(
                courseId => completedCourses.includes(courseId)
            );
            if (!hasAllCourses) return false;
        }

        return true;
    });
};