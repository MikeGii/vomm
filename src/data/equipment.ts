// src/data/equipment.ts
import { EquipmentItem } from '../types/equipment';

// Abipolitseiniku uniform set - simplified without icons
export const ABIPOLITSEINIK_UNIFORM: EquipmentItem[] = [
    {
        id: 'abipolitseinik_cap',
        name: 'Abipolitseiniku müts',
        description: 'Ametlik abipolitseiniku müts märgiga',
        slot: 'head',
        rarity: 'common',
        equipped: false
    },
    {
        id: 'abipolitseinik_jacket',
        name: 'Abipolitseiniku jope',
        description: 'Sinine abipolitseiniku vormijope helkuritega',
        slot: 'upperBody',
        rarity: 'common',
        equipped: false
    },
    {
        id: 'abipolitseinik_pants',
        name: 'Abipolitseiniku püksid',
        description: 'Tumedad vormipüksid taskutega',
        slot: 'lowerBody',
        rarity: 'common',
        equipped: false
    },
    {
        id: 'abipolitseinik_gloves',
        name: 'Abipolitseiniku kindad',
        description: 'Mustad taktikalised kindad',
        slot: 'hands',
        rarity: 'common',
        equipped: false
    },
    {
        id: 'abipolitseinik_belt',
        name: 'Abipolitseiniku vöö 2 salvetaskuga',
        description: 'Taktiline vöö kahe salvetaskuga ja lisavarustuse hoidikutega',
        slot: 'belt',
        rarity: 'common',
        equipped: false
    },
    {
        id: 'basic_weapon_holster',
        name: 'Tavaline relvakabuur',
        description: 'Standardne politsei relvakabuur',
        slot: 'weaponHolster',
        rarity: 'common',
        equipped: false
    },
    {
        id: 'abipolitseinik_boots',
        name: 'Abipolitseiniku saapad',
        description: 'Mustad taktikalised saapad',
        slot: 'shoes',
        rarity: 'common',
        equipped: false
    }
];

// Kadett (Sisekaitseakadeemia) uniform set
export const POLITSEI_UNIFORM: EquipmentItem[] = [
    {
        id: 'kadett_cap',
        name: 'Politseivormi müts',
        description: 'Tumesinine politseivormi müts',
        slot: 'head',
        rarity: 'uncommon',
        equipped: false
    },
    {
        id: 'police_jacket',
        name: 'Politseivormi jope',
        description: 'Tumesinine Sisekaitseakadeemia vormipintsak',
        slot: 'upperBody',
        rarity: 'uncommon',
        equipped: false
    },
    {
        id: 'police_pants',
        name: 'Politseivormi püksid',
        description: 'Tumesinised politsei vormipüksid',
        slot: 'lowerBody',
        rarity: 'uncommon',
        equipped: false
    },
    {
        id: 'police_gloves',
        name: 'Taktikalised kindad',
        description: 'Taktikalised torkekindlad kindad',
        slot: 'hands',
        rarity: 'uncommon',
        equipped: false
    },
    {
        id: 'police_belt',
        name: 'Taktikaline vöö 2 salvetaskuga',
        description: 'Must kiirkinnitusega vöö',
        slot: 'belt',
        rarity: 'uncommon',
        equipped: false
    },
    {
        id: 'police_weapon_holster',
        name: 'Glocki relvakabuur',
        description: 'Õppevahendite kabuur',
        slot: 'weaponHolster',
        rarity: 'uncommon',
        equipped: false
    },
    {
        id: 'police_boots',
        name: 'Politseivormi saapad',
        description: 'Mustad läikivad vormisaapad',
        slot: 'shoes',
        rarity: 'uncommon',
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
    ...POLITSEI_UNIFORM,
    // Future equipment sets will be added here
];