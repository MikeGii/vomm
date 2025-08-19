// src/data/shop/vipItems.ts
import { ShopItem } from '../../types/shop';

export const VIP_ITEMS: ShopItem[] = [
    {
        id: 'vip_work_time_booster',
        name: 'Kiirendaja 95%',
        description: 'Lühendab aktiivset tööaega 95%',
        category: 'vip',
        price: 0,
        pollidPrice: 10,
        currency: 'pollid',
        basePrice: 0,
        basePollidPrice: 10,
        maxStock: 10,
        consumableEffect: {
            type: 'workTimeReduction',
            value: 95 // 95% time reduction
        }
    }
];