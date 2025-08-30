// src/data/shop/workshopDevices.ts
import { ShopItem } from '../../types/shop';

export const WORKSHOP_DEVICES: ShopItem[] = [
    {
        id: 'basic_cheap_3d_printer',
        name: 'Ender-3 3D Printer',
        description: 'Lihtne 3D printer, mis avab 3D printimise oskuse. Sobib algajatele.',
        category: 'workshop',
        price: 15000,
        currency: 'money',
        basePrice: 15000,
        maxStock: 150,
        stats: {
            printing: 0
        }
    },
    {
        id: 'basic_cheap_laser_cutter',
        name: 'Atomstack A10 lasergraveerija',
        description: 'Lihtne lasergraveerija, mis avab laserilõikuse oskuse.',
        category: 'workshop',
        price: 20000,
        currency: 'money',
        basePrice: 20000,
        maxStock: 150,
        stats: {
            lasercutting: 0
        }
    }
];