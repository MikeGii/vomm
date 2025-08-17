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