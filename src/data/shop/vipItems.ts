// src/data/shop/vipItems.ts
import { ShopItem } from '../../types/shop';

export const VIP_ITEMS: ShopItem[] = [
    {
        id: 'vip_work_time_booster',
        name: 'Tööaeg 95%',
        description: 'Lühendab aktiivset tööaega 95%',
        category: 'vip',
        price: 0,
        pollidPrice: 10,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 10,
        maxStock: 100,
        consumableEffect: {
            type: 'workTimeReduction',
            value: 95
        }
    },
    {
        id: 'vip_course_time_booster',
        name: 'Kursus 95%',
        description: 'Lühendab aktiivset kursust 95%',
        category: 'vip',
        price: 0,
        pollidPrice: 10,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 10,
        maxStock: 100,
        consumableEffect: {
            type: 'courseTimeReduction',
            value: 95
        }
    },
    {
        id: 'vip_sport_clicks_restore',
        name: 'Sport 50',
        description: 'Taastab kõik klikid sporditegevustel',
        category: 'vip',
        price: 0,
        pollidPrice: 10,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 10,
        maxStock: 100,
        consumableEffect: {
            type: 'trainingClicks',
            value: 50
        }
    },
    {
        id: 'vip_kitchen_lab_clicks_restore',
        name: 'Köök 50',
        description: 'Taastab kõik klõpsud köögis ja laboris',
        category: 'vip',
        price: 0,
        pollidPrice: 10,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 10,
        maxStock: 100,
        consumableEffect: {
            type: 'kitchenClicks',
            value: 50
        }
    },
    {
        id: 'vip_handicraft_clicks_restore',
        name: 'Käsitöö 50',
        description: 'Taastab kõik klõpsud käsitöös',
        category: 'vip',
        price: 0,
        pollidPrice: 10,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 10,
        maxStock: 100,
        consumableEffect: {
            type: 'handicraftClicks',
            value: 50
        }
    },
    {
        id: 'vip_full_health_restore',
        name: 'Tervis 100',
        description: 'Taastab 100 tervist',
        category: 'vip',
        price: 0,
        pollidPrice: 5,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 5,
        maxStock: 100,
        consumableEffect: {
            type: 'heal',
            value: 100
        }
    }
];