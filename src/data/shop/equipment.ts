// src/data/shop/equipment.ts
import {ShopItem} from "../../types/shop";

export const PROTECTION_ITEMS: ShopItem[] = [
    {
        id: 'basic_vest',
        name: 'NIJ IIIA Kuulivest',
        description: 'Kerge kuulikindel vest põhikaitseks',
        category: 'protection',
        price: 800,
        currency: 'money',
        basePrice: 800,
        maxStock: 100,
        equipmentSlot: 'upperBody',
        stats: {
            endurance: 3,
            agility: -1
        }
    },
    {
        id: 'medium_vest',
        name: 'NIJ III Taktikaline vest',
        description: 'Professionaalne taktikaline vest koos kaitseplaatidega',
        category: 'protection',
        price: 4500,
        currency: 'money',
        basePrice: 4500,
        maxStock: 50,
        equipmentSlot: 'upperBody',
        stats: {
            endurance: 5,
            agility: -2,
            strength: 4
        }
    },
    {
        id: 'heavy_vest',
        name: 'NIJ IV Ründevest',
        description: 'Kõrgeima kaitsega vest erivägede jaoks',
        category: 'protection',
        price: 12000,
        currency: 'money',
        basePrice: 12000,
        maxStock: 25,
        equipmentSlot: 'upperBody',
        stats: {
            endurance: 10,
            agility: -5,
            strength: 7,
        }
    },
    {
        id: 'elite_vest',
        name: 'Nano Skin mollevest',
        description: 'Eliitkaitse paindlike keraamiliste plaatidega',
        category: 'protection',
        price: 0,
        pollidPrice: 15,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 15,
        maxStock: 10,
        equipmentSlot: 'upperBody',
        stats: {
            endurance: 20,
            agility: -1,
            strength: 15
        }
    },
    {
        id: 'tactical_helmet',
        name: 'MICH Taktikaline kiiver',
        description: 'Ballistiline kiiver näokaitsega',
        category: 'protection',
        price: 650,
        currency: 'money',
        basePrice: 650,
        maxStock: 50,
        equipmentSlot: 'head',
        stats: {
            endurance: 2,
            intelligence: -1,
            strength: 1
        }
    },
    {
        id: 'light_pants',
        name: 'ACU Lahingupüksid',
        description: 'Kerged taktikalised püksid kiirete operatsioonide jaoks',
        category: 'protection',
        price: 700,
        currency: 'money',
        basePrice: 700,
        maxStock: 150,
        equipmentSlot: 'lowerBody',
        stats: {
            endurance: 2,
            agility: 3
        }
    },
    {
        id: 'medium_pants',
        name: 'BDU Kaitsepüksid',
        description: 'Tugevad püksid põlve- ja puusakaitsetega',
        category: 'protection',
        price: 3200,
        currency: 'money',
        basePrice: 3200,
        maxStock: 100,
        equipmentSlot: 'lowerBody',
        stats: {
            endurance: 5,
            agility: 2,
            strength: 2,
        }
    },
    {
        id: 'heavy_pants',
        name: 'CBRN Ründepüksid',
        description: 'Eritugevad püksid integreeritud kaitseelementidega',
        category: 'protection',
        price: 8000,
        currency: 'money',
        basePrice: 8000,
        maxStock: 50,
        equipmentSlot: 'lowerBody',
        stats: {
            endurance: 6,
            agility: 1,
            strength: 5,
        }
    },
    {
        id: 'elite_pants',
        name: 'Nano tehnoloogiaga militaarpüksid',
        description: 'Militaarpüksid kõrgeima sõjatööstus tehnoloogia elementidega',
        category: 'protection',
        price: 0,
        pollidPrice: 15,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 15,
        maxStock: 10,
        equipmentSlot: 'lowerBody',
        stats: {
            endurance: 12,
            agility: 6,
            strength: 10
        }
    },
    {
        id: 'light_gloves',
        name: 'Taktikalised kindad',
        description: 'Dünaamilised kaitskindad relva kasutamiseks',
        category: 'protection',
        price: 350,
        currency: 'money',
        basePrice: 350,
        maxStock: 150,
        equipmentSlot: 'hands',
        stats: {
            dexterity: 2,
            agility: 1
        }
    },
    {
        id: 'medium_gloves',
        name: 'Militaar kindad',
        description: 'Tugevdatud kindad raskemateks operatsioonideks',
        category: 'protection',
        price: 900,
        currency: 'money',
        basePrice: 900,
        maxStock: 100,
        equipmentSlot: 'hands',
        stats: {
            dexterity: 3,
            strength: 2,
        }
    },
    {
        id: 'reinforced_work_gloves',
        name: 'Tugevdatud töökindad',
        description: 'Käsitsi valmistatud nahkkindad tugevdatud kangaga',
        category: 'protection',
        price: 650,
        currency: 'money',
        basePrice: 650,
        maxStock: 0,
        equipmentSlot: 'hands',
        stats: {
            dexterity: 2,
            strength: 1,
            agility: 1
        }
    }
];