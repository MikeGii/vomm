// src/data/workActivities/positionWorkActivities.ts
import { WorkActivity } from './types';

// Default work activity for each police position - taking the first/lowest level activity
export const POSITION_WORK_ACTIVITIES: WorkActivity[] = [
    // Basic positions
    {
        id: 'abipolitseinik_default_work',
        name: 'Patrullimine abipolitseinikuna',
        description: 'Abipolitseinikuna patrullin koos politseiametnikuga ja abistan ametniku tema ülesannetes',
        minLevel: 1,
        baseExpPerHour: 50,
        expGrowthRate: 0.15,
        maxHours: 12,
        allowedFor: ['abipolitseinik'],
    },
    {
        id: 'kadett_default_work',
        name: 'Praktika ja tööampsud kolledži valvelauas',
        description: 'Kadetina saan stipendiumi ja saan osaleda praktika käigus erinevates politseilistes tegevustes ja samuti kolledžis olles ' +
            'teha tööampse valvelauas',
        minLevel: 15,
        baseExpPerHour: 200,
        expGrowthRate: 0.1,
        maxHours: 8,
        allowedFor: ['kadett'],
    },
    {
        id: 'patrullpolitseinik_default_work',
        name: 'Patrullimine patrullpolitsenikuna teenistuses',
        description: 'Patrullpolitseinikuna teenindan väljakutseid, tagan avaliku korda ja teostan liiklusjärelevalvet',
        minLevel: 30,
        baseExpPerHour: 300,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['patrullpolitseinik'],
    },
    {
        id: 'uurija_default_work',
        name: 'Menetlen erinevaid süüteomaterjale',
        description: 'Menetlustalituses menetlen erinevaid väärtegusid ja kuritegusid, kogun tõendeid, kuulan isikuid üle ja suhtlen prokuratuuriga',
        minLevel: 45,
        baseExpPerHour: 400,
        expGrowthRate: 0.10,
        maxHours: 8,
        allowedFor: ['uurija'],
    },
    {
        id: 'kiirreageerija_default_work',
        name: 'Patrullimine ja teiste üksuste abistamine ohtlikes situtuatsioonides',
        description: 'Kiirreageerijana oled valmis reageerima ja abistama patrullpolitseinike ohtlike isikute kinnipidamisel ning teostama erinevaid' +
            ' eriülesandeid seoses tegevustega, mis hõlmavad ohtlike isikuid ja asukohti',
        minLevel: 50,
        baseExpPerHour: 450,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['kiirreageerija'],
    },
    {
        id: 'koerajuht_default_work',
        name: 'Üksuste toetamine teenistuskoeraga',
        description: 'K9 üksusena abistad teisi politsei üksuseid isikute otsingutel / kinnipidamisel ning hoonete ja sõidukite läbiotsimisel',
        minLevel: 45,
        baseExpPerHour: 400,
        expGrowthRate: 0.12,
        maxHours: 12,
        allowedFor: ['koerajuht'],
    },
    {
        id: 'küberkriminalist_default_work',
        name: 'Süütegude ennetamine ja avastamine internetis',
        description: 'Küberkriminalistina jälgid, mis toimub virtuaalmaastikul. Jälitad ja avastad küberkurjategijaid ning parendad politsei' +
            ' infosüsteemide toimivust ning turvalisust',
        minLevel: 55,
        baseExpPerHour: 480,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['küberkriminalist'],
    },
    {
        id: 'jälitaja_default_work',
        name: 'Jälitad ja kogud infot raskete kuritegude toimepanijaid',
        description: 'Jälitajana tegeled pigem raskete kuritegudega ja kogudes infot isikute ja tõendite osas ning vajadusel pead isikuid kinni',
        minLevel: 50,
        baseExpPerHour: 450,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['jälitaja'],
    },
    // Group leaders - taking first activity from each
    {
        id: 'grupijuht_patrol_default_work',
        name: 'Grupijuhi kohustused jaoskonnas',
        description: 'Grupijuhina täidad töökohustusi enda jaoskonnas viies läbi arenguvestluseid, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 55,
        baseExpPerHour: 600,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_patrol'],
    },
    {
        id: 'grupijuht_investigation_default_work',
        name: 'Grupijuhi kohustused uurimises',
        description: 'Grupijuhina juhid menetlusgrupi tööd ja koordineerid juhtumite lahendamist, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 65,
        baseExpPerHour: 750,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['grupijuht_investigation'],
    },
    {
        id: 'grupijuht_emergency_default_work',
        name: 'Grupijuhi kohustused kiirreageerimisüksuses',
        description: 'Grupijuhina juhid kiirreageerimisgrupi tegevust ja koordineerid erioperatsioone, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 70,
        baseExpPerHour: 800,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_emergency'],
    },
    {
        id: 'grupijuht_k9_default_work',
        name: 'K9 grupi juhtimine',
        description: 'Grupijuhina juhid koerteüksuse tööd ja koordineerid K9 operatsioone, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 70,
        baseExpPerHour: 800,
        expGrowthRate: 0.10,
        maxHours: 12,
        allowedFor: ['grupijuht_k9'],
    },
    {
        id: 'grupijuht_cyber_default_work',
        name: 'Küberkuritegevuse grupi juhtimine',
        description: 'Grupijuhina juhid küberkuritegevuse uurijate tööd ja koordineerid digitaalseid uurimisi, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 70,
        baseExpPerHour: 800,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['grupijuht_cyber'],
    },
    {
        id: 'grupijuht_crimes_default_work',
        name: 'Kuritegude grupi juhtimine',
        description: 'Grupijuhina juhid kuritegude uurijate ja jälitajate tööd ning koordineerid kriminaaluurimisi, parendad grupi toimivust, osaled koosolekutel' +
            ' ja tõstad oma grupiliikmete moraali',
        minLevel: 70,
        baseExpPerHour: 800,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['grupijuht_crimes'],
    },
    // Unit leaders - taking from existing unit leader activities
    {
        id: 'talituse_juht_patrol_default_work',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet patrulltalituse üksust ja korraldad üksuse tegevust',
        minLevel: 95,
        baseExpPerHour: 1450,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_patrol'],
    },
    {
        id: 'talituse_juht_investigation_default_work',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet uurimistalituse üksust ja korraldad üksuse tegevust',
        minLevel: 95,
        baseExpPerHour: 1850,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_investigation'],
    },
    {
        id: 'talituse_juht_emergency_default_work',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet erireageerimise talituse üksust ja korraldad üksuse tegevust',
        minLevel: 100,
        baseExpPerHour: 2050,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_emergency'],
    },
    {
        id: 'talituse_juht_k9_default_work',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet K9 talituse üksust ja korraldad üksuse tegevust',
        minLevel: 95,
        baseExpPerHour: 1850,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_k9'],
    },
    {
        id: 'talituse_juht_cyber_default_work',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet küberkuritegevuse talituse üksust ja korraldad üksuse tegevust',
        minLevel: 100,
        baseExpPerHour: 2100,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_cyber'],
    },
    {
        id: 'talituse_juht_crimes_default_work',
        name: 'Talituse juhi kohustused',
        description: 'Talituse juhina juhid tervet kuritegude talituse üksust ja korraldad üksuse tegevust',
        minLevel: 100,
        baseExpPerHour: 2100,
        expGrowthRate: 0.12,
        maxHours: 8,
        allowedFor: ['talituse_juht_crimes'],
    },
];

// Function to get default work activity for a position
export const getDefaultWorkActivityForPosition = (policePosition: string | null): WorkActivity | null => {
    if (!policePosition) return null;

    return POSITION_WORK_ACTIVITIES.find(activity =>
        activity.allowedFor.includes(policePosition as any)
    ) || null;
};