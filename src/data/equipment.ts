// src/data/equipment.ts
import { EquipmentItem } from '../types/equipment';

// Abipolitseiniku uniform set - basic starter equipment
export const ABIPOLITSEINIK_UNIFORM: EquipmentItem[] = [
    {
        id: 'abipolitseinik_cap',
        name: 'Abipolitseiniku müts',
        description: 'Ametlik abipolitseiniku müts märgiga',
        slot: 'head',
        shopPrice: 50,
        stats: {
            intelligence: 1
        },
        equipped: false
    },
    {
        id: 'abipolitseinik_jacket',
        name: 'Abipolitseiniku jope',
        description: 'Sinine abipolitseiniku vormijope helkuritega',
        slot: 'upperBody',
        shopPrice: 150,
        stats: {
            strength: 1
        },
        equipped: false
    },
    {
        id: 'abipolitseinik_pants',
        name: 'Abipolitseiniku püksid',
        description: 'Tumedad vormipüksid taskutega',
        slot: 'lowerBody',
        shopPrice: 100,
        stats: {
            agility: 1
        },
        equipped: false
    },
    {
        id: 'abipolitseinik_gloves',
        name: 'Abipolitseiniku kindad',
        description: 'Mustad taktikalised kindad',
        slot: 'hands',
        shopPrice: 40,
        stats: {
            dexterity: 1
        },
        equipped: false
    },
    {
        id: 'abipolitseinik_belt',
        name: 'Abipolitseiniku vöö 2 salvetaskuga',
        description: 'Taktiline vöö kahe salvetaskuga ja lisavarustuse hoidikutega',
        slot: 'belt',
        shopPrice: 80,
        stats: {
            dexterity: 1
        },
        equipped: false
    },
    {
        id: 'basic_weapon_holster',
        name: 'Tavaline relvakabuur',
        description: 'Standardne politsei relvakabuur',
        slot: 'weaponHolster',
        shopPrice: 60,
        stats: {
            dexterity: 1,
            agility: 1
        },
        equipped: false
    },
    {
        id: 'abipolitseinik_boots',
        name: 'Abipolitseiniku saapad',
        description: 'Mustad taktikalised saapad',
        slot: 'shoes',
        shopPrice: 90,
        stats: {
            agility: 2
        },
        equipped: false
    }
];

// Kadett (Sisekaitseakadeemia) uniform set - better equipment
export const POLITSEI_UNIFORM: EquipmentItem[] = [
    {
        id: 'kadett_cap',
        name: 'Politseivormi müts',
        description: 'Tumesinine politseivormi müts',
        slot: 'head',
        shopPrice: 120,
        stats: {
            intelligence: 2
        },
        equipped: false
    },
    {
        id: 'police_jacket',
        name: 'Politseivormi jope',
        description: 'Tumesinine Sisekaitseakadeemia vormipintsak',
        slot: 'upperBody',
        shopPrice: 300,
        stats: {
            strength: 2
        },
        equipped: false
    },
    {
        id: 'police_pants',
        name: 'Politseivormi püksid',
        description: 'Tumesinised politsei vormipüksid',
        slot: 'lowerBody',
        shopPrice: 200,
        stats: {
            agility: 2
        },
        equipped: false
    },
    {
        id: 'police_gloves',
        name: 'Taktikalised kindad',
        description: 'Taktikalised torkekindlad kindad',
        slot: 'hands',
        shopPrice: 80,
        stats: {
            dexterity: 2
        },
        equipped: false
    },
    {
        id: 'police_belt',
        name: 'Taktikaline vöö 2 salvetaskuga',
        description: 'Must kiirkinnitusega vöö',
        slot: 'belt',
        shopPrice: 150,
        stats: {
            dexterity: 2
        },
        equipped: false
    },
    {
        id: 'police_weapon_holster',
        name: 'Glocki relvakabuur',
        description: 'Õppevahendite kabuur',
        slot: 'weaponHolster',
        shopPrice: 120,
        stats: {
            dexterity: 2,
            agility: 2
        },
        equipped: false
    },
    {
        id: 'police_boots',
        name: 'Politseivormi saapad',
        description: 'Mustad läikivad vormisaapad',
        slot: 'shoes',
        shopPrice: 180,
        stats: {
            agility: 2,
            endurance: 1
        },
        equipped: false
    }
];

export const getEquipmentSet = (setId: string): EquipmentItem[] => {
    switch(setId) {
        case 'abipolitseinik_uniform':
            return ABIPOLITSEINIK_UNIFORM;
        case 'politsei_uniform':
            return POLITSEI_UNIFORM;
        default:
            return [];
    }
};

// All available equipment items
export const ALL_EQUIPMENT: EquipmentItem[] = [
    ...ABIPOLITSEINIK_UNIFORM,
    ...POLITSEI_UNIFORM
];