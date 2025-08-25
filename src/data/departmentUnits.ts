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
        name: 'Patrullitalitus',
        description: 'Avaliku korra tagamine ja patrullteenuse osutamine',
        isDefault: true
    },
    {
        id: 'procedural_service',
        name: 'Menetlustalitus',
        description: 'Süütegude uurimine ja tõendite kogumine.',
        requirements: {
            minimumLevel: 45,
            requiredCourses: ['enhanced_law_studies'],
            specialRequirements: ['Peab olema lõpetanud süüteomenetluse täiendkursuse']
        }
    },
    {
        id: 'emergency_response',
        name: 'Kiirreageerimisüksus',
        description: 'Kiireloomulistele väljakutsetele reageerimine ja kriisiolukordade lahendamine',
        requirements: {
            minimumLevel: 50,
            requiredCourses: ['lopueksam', 'riot_police_course'],
            specialRequirements: ['Peab olema läbinud füüsilise ettevalmistuse testi']
        }
    },
    {
        id: 'k9_unit',
        name: 'K9',
        description: 'Teenistuskoertega tehtav töö - jälgede otsing, narkootikumide tuvastamine',
        requirements: {
            minimumLevel: 45,
            requiredCourses: ['lopueksam', 'dog_handler_course'],
            specialRequirements: ['Peab olema läbinud koerajuhi koolituse']
        }
    },
    {
        id: 'cyber_crime',
        name: 'Küberkuritegevuse talitus',
        description: 'Küberruumis toime pandud kuritegude uurimine ja ennetamine',
        requirements: {
            minimumLevel: 55,
            requiredCourses: ['lopueksam', 'cyber_crime_course', 'advanced_computer_skills'],
            specialRequirements: ['Peab olema läbinud küberjulgeoleku spetsialiseerumise']
        }
    },
    {
        id: 'crime_unit',
        name: 'Kuritegude talitus',
        description: 'Raskete kuritegude uurimine ja kurjategijate jälitamine',
        requirements: {
            minimumLevel: 50,
            requiredCourses: ['lopueksam', 'detective_course', 'forensics_basics'],
            specialRequirements: ['Peab olema läbinud uurimistehnikate koolituse']
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