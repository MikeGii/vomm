// src/data/prefectures.ts
export interface Prefecture {
    id: string;
    name: string;
    departments: string[];
}

export const PREFECTURES: Prefecture[] = [
    {
        id: 'pohja',
        name: 'Põhja prefektuur',
        departments: ['Lääne-Harju', 'Ida-Harju']
    },
    {
        id: 'laane',
        name: 'Lääne prefektuur',
        departments: ['Haapsalu', 'Kuressaare', 'Kärdla', 'Kesk-Eesti', 'Pärnu']
    },
    {
        id: 'louna',
        name: 'Lõuna prefektuur',
        departments: ['Tartu', 'Kagu', 'Viljandi']
    },
    {
        id: 'ida',
        name: 'Ida prefektuur',
        departments: ['Rakvere', 'Narva', 'Jõhvi']
    }
];

export const getPrefectureById = (prefectureId: string): Prefecture | undefined => {
    return PREFECTURES.find(p =>
        p.name.toLowerCase().includes(prefectureId.toLowerCase()) ||
        p.id === prefectureId
    );
};

export const getDepartmentsByPrefecture = (prefectureName: string): string[] => {
    const prefecture = PREFECTURES.find(p => p.name === prefectureName);
    return prefecture?.departments || [];
};