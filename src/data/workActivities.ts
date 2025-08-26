// src/data/workActivities.ts
import { WorkActivity } from '../types';

// Regular patrol activities for Abipolitseinik and graduated officers
const PATROL_ACTIVITIES: WorkActivity[] = [
    {
        id: 'patrol_third_member',
        name: 'Alusta patrulli kolmanda liikmena',
        description: 'Abipolitseinikuna saad alustada patrulli kolmanda liikmena. Õpid kogenud kolleegidelt ja saad esimesi kogemusi tänaval.',
        minLevel: 1,
        requiredCourses: ['basic_police_training_abipolitseinik'],
        baseExpPerHour: 50,
        expGrowthRate: 0.15,
        maxHours: 12,
        allowedFor: ['abipolitseinik'],
    },
    {
        id: 'patrol_second_member',
        name: 'Alusta patrulli teise liikmena',
        description: 'Kogenud abipolitseinikuna saad olla patrulli teine liige. Vastutad rohkem ja saad paremaid kogemusi.',
        minLevel: 10,
        requiredCourses: ['basic_police_training_abipolitseinik', 'firearm_training_abipolitseinik'],
        baseExpPerHour: 150,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['abipolitseinik']
    },
    {
        id: 'patrol_second_member_police',
        name: 'Alusta patrulli teise liikmena',
        description: 'Värskelt sisekaitseakadeemia lõpetanud ametnikuna suudad iseseisvalt toimida teise liikmena',
        minLevel: 30,
        requiredCourses: ['lopueksam'],
        baseExpPerHour: 250,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    },
    {
        id: 'patrol_car_chief',
        name: 'Alusta patrulli toimkonna vanemana',
        description: 'Mõningase patrullkogemusega suudad juba iseseisvalt patrulltoimkonda juhtida',
        minLevel: 35,
        requiredCourses: ['lopueksam'],
        baseExpPerHour: 350,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    },
    {
        id: 'patrol_ground_leader',
        name: 'Alusta patrullvahetust välijuhina',
        description: 'Tugeva patrullitöö kogemuse ja vaneminspektorina on sul võimalus alustada teenistust välijuhina',
        minLevel: 40,
        requiredCourses: ['police_ground_leader_course'],
        baseExpPerHour: 650,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    },
    {
        id: 'patrol_group_leader_placement',
        name: 'Asendad grupijuhti tema tööülesannetes',
        description: 'Grupijuht on puhkusel ja oled määratud tema asendajaks',
        minLevel: 50,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 850,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik']
    }
];

// Group leader work activities
const GROUP_LEADER_ACTIVITIES: WorkActivity[] = [

    {
        id: 'patrol_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 55,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1050,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_patrol']
    },
    {
        id: 'procedural_group_leader_01',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi jaoskonnas, viid läbi arenguvestluseid, osaled koosolekutel ja parendad grupi toimivust',
        minLevel: 60,
        requiredCourses: ['police_group_leader_course'],
        baseExpPerHour: 1250,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation']
    },


]

// Procedural unit work activities
const PROCEDURAL_UNIT_ACTIVITIES: WorkActivity[] = [

    {
        id: 'procedural_unit_work_01',
        name: 'Menetle väärteomaterjale',
        description: 'Uurijana pead menetlema ja lõpetama jaoskonda tulnud väärteomenetlusi',
        minLevel: 45,
        requiredCourses: ['evidence_place_course'],
        baseExpPerHour: 700,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['uurija'],
    }

]

// Emergency responder unit work activities
const EMERGENCY_RESPOND_UNIT_ACTIVITIES: WorkActivity[] = [

    {
        id: 'emergency_respond_work_01',
        name: 'Abista patrulle ohtlike isikute tabamisel',
        description: 'Kiirreageerijana oled valmis reageerima ja abistama patrullpolitseinike ohtlike isikute kinnipidamisel',
        minLevel: 50,
        requiredCourses: ['riot_police_course', 'medical_course_police'],
        baseExpPerHour: 750,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['kiirreageerija'],
    }

]

// Emergency responder unit work activities
const K9_UNIT_ACTIVITIES: WorkActivity[] = [

    {
        id: 'K9_work_01',
        name: 'Abista patrulle ohtlike isikute tabamisel',
        description: 'K9 üksusena oled valmis reageerima ja abistama patrullpolitseinike ohtlike isikute kinnipidamisel ja sõidukite läbiotsimisel',
        minLevel: 45,
        requiredCourses: ['dog_handler_course'],
        baseExpPerHour: 700,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['koerajuht'],
    }

]

const CRIME_UNIT_ACTIVITIES: WorkActivity[] = [

    {
        id: 'crime_unit_work_01',
        name: 'Jälita tänavatel narkokaubitsejaid',
        description: 'Liigud tänavatel erariietes ja kogud infot narkokaubitsejate asukohtade, tegevuste ja liikumiste kohta',
        minLevel: 50,
        requiredCourses: ['detective_course'],
        baseExpPerHour: 850,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['jälitaja'],
    },
    {
        id: 'crime_unit_work_02',
        name: 'Lahenda raskeid varavastaseid süütegusid',
        description: 'Tegeled jaoskonnas bürokraatiaga ja väljas info kogumisega raskete varavastaste süütegude osas nagu röövimised ja väljapressimised',
        minLevel: 65,
        requiredCourses: ['narcotic_psyhotropic_substances'],
        baseExpPerHour: 950,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['jälitaja'],
    }

]


const CYBER_CRIME_UNIT_ACTIVITIES: WorkActivity[] = [

    {
        id: 'cyber_crime_work_01',
        name: 'Jälgi internetis toimuvat',
        description: 'Uue liikmena küberkuritegevuse uurijate üksuses esmalt jälgid internetis pettuste ja muude halva kavatsustega' +
            ' isikute tegevust',
        minLevel: 55,
        requiredCourses: ['cyber_crime_course'],
        baseExpPerHour: 800,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['küberkriminalist'],
    }

]

// Academy student work activities
const ACADEMY_ACTIVITIES: WorkActivity[] = [
    {
        id: 'academy_guard_duty',
        name: 'Tööamps kolledži valvelauas',
        description: 'Täidad valvuri kohustusi Sisekaitseakadeemia valvelauas. Õpid turvalisuse põhitõdesid ja suhtlemist külastajatega.',
        minLevel: 20,
        requiredCourses: ['sisekaitseakadeemia_entrance'],
        baseExpPerHour: 200,
        expGrowthRate: 0.1,
        maxHours: 8,
        allowedFor: ['kadett']
    },
    {
        id: 'academy_police_practice',
        name: 'Praktika politseiteenistuses',
        description: 'Läbid praktikat päris politseijaoskonnas kogenud ametnike juhendamisel. Saad väärtuslikke kogemusi reaalsetest olukordadest.',
        minLevel: 25,
        requiredCourses: ['sisekaitseakadeemia_entrance'],
        baseExpPerHour: 250,
        expGrowthRate: 0.1,
        maxHours: 12,
        allowedFor: ['kadett']
    }
];

// Export combined work activities
export const WORK_ACTIVITIES: WorkActivity[] = [
    ...PATROL_ACTIVITIES,
    ...ACADEMY_ACTIVITIES,
    ...GROUP_LEADER_ACTIVITIES,
    ...PROCEDURAL_UNIT_ACTIVITIES,
    ...EMERGENCY_RESPOND_UNIT_ACTIVITIES,
    ...K9_UNIT_ACTIVITIES,
    ...CRIME_UNIT_ACTIVITIES,
    ...CYBER_CRIME_UNIT_ACTIVITIES
];

// Helper function to determine player status - NOW USES POLICE POSITION
type PlayerStatus =
    | 'kadett'
    | 'abipolitseinik'
    | 'patrullpolitseinik'
    | 'uurija'
    | 'kiirreageerija'
    | 'koerajuht'
    | 'küberkriminalist'
    | 'jälitaja'
    | 'grupijuht_patrol'
    | 'grupijuht_investigation'
    | 'grupijuht_emergency'
    | 'grupijuht_k9'
    | 'grupijuht_cyber'
    | 'grupijuht_crimes'
    | 'unknown';

const getPlayerStatus = (
    policePosition: string | null | undefined
): PlayerStatus => {
    if (!policePosition) return 'unknown';

    // Direct mapping for basic positions
    if (policePosition === 'abipolitseinik') return 'abipolitseinik';
    if (policePosition === 'kadett') return 'kadett';
    if (policePosition === 'patrullpolitseinik') return 'patrullpolitseinik';

    // New unit positions
    if (policePosition === 'uurija') return 'uurija';
    if (policePosition === 'kiirreageerija') return 'kiirreageerija';
    if (policePosition === 'koerajuht') return 'koerajuht';
    if (policePosition === 'küberkriminalist') return 'küberkriminalist';
    if (policePosition === 'jälitaja') return 'jälitaja';

    // Group leaders work as their base unit position for now
    if (policePosition === 'grupijuht_patrol') return 'grupijuht_patrol';
    if (policePosition === 'grupijuht_investigation') return 'uurija';
    if (policePosition === 'grupijuht_emergency') return 'kiirreageerija';
    if (policePosition === 'grupijuht_k9') return 'koerajuht';
    if (policePosition === 'grupijuht_cyber') return 'küberkriminalist';
    if (policePosition === 'grupijuht_crimes') return 'jälitaja';

    // Higher positions work as patrullpolitseinik for now
    if (policePosition === 'talituse_juht') return 'patrullpolitseinik';

    return 'unknown';
};

// Updated helper function to get available work activities - NOW USES POLICE POSITION
export const getAvailableWorkActivities = (
    playerLevel: number,
    completedCourses: string[],
    policePosition?: string | null  // Changed: Now uses policePosition instead of rank
): WorkActivity[] => {
    const playerStatus = getPlayerStatus(policePosition);  // Changed: Uses position

    // If player status is unknown, return empty array
    if (playerStatus === 'unknown') {
        return [];
    }

    return WORK_ACTIVITIES.filter(activity => {
        // Check level requirement
        if (activity.minLevel > playerLevel) return false;

        // Check course requirements
        if (activity.requiredCourses) {
            const hasAllCourses = activity.requiredCourses.every(
                courseId => completedCourses.includes(courseId)
            );
            if (!hasAllCourses) return false;
        }

        // Check if player status allows this activity
        if (activity.allowedFor) {
            // Cast to exclude 'unknown' since we handled it above
            if (!activity.allowedFor.includes(playerStatus as Exclude<PlayerStatus, 'unknown'>)) {
                return false;
            }
        }

        return true;
    });
};

export const getWorkActivityById = (workId: string): WorkActivity | undefined => {
    return WORK_ACTIVITIES.find(activity => activity.id === workId);
};

// Calculate total exp for work duration
export const calculateWorkRewards = (
    activity: WorkActivity,
    hours: number,
    playerRank?: string | null
): { experience: number; money: number } => {
    let totalExp = 0;

    for (let hour = 1; hour <= hours; hour++) {
        const hourExp = activity.baseExpPerHour * (1 + (activity.expGrowthRate * (hour - 1)));
        totalExp += Math.floor(hourExp);
    }

    // Calculate money for police officers (using rank for salary)
    const money = playerRank ? calculateSalaryForOfficer(playerRank, hours) : 0;

    return {
        experience: totalExp,
        money
    };
};

export const calculateSalaryForOfficer = (rank: string | null, hours: number): number => {
    if (!rank) return 0;

    // Define hourly rates by rank
    const hourlyRates: Record<string, number> = {
        'inspektor': 120,
        'vaneminspektor': 140,
        'üleminspektor': 160,
        'komissar': 210,
        'vanemkomissar': 260
    };

    const normalizedRank = rank.toLowerCase();
    const hourlyRate = hourlyRates[normalizedRank] || 0;

    return hourlyRate * hours;
};