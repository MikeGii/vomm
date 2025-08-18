// src/data/shop/documents.ts
import { ShopItem } from '../../types/shop';

export const DOCUMENTS_ITEMS: ShopItem[] = [
    {
        id: 'driving_license_b',
        name: 'B-kategooria juhiluba',
        description: 'Luba sõiduauto juhtimiseks',
        category: 'documents',
        price: 500,
        rarity: 'common',
    },
    {
        id: 'weapon_permit',
        name: 'Relvaluba',
        description: 'Luba teenistusrelva kandmiseks',
        category: 'documents',
        price: 1000,
        rarity: 'uncommon',
    }
];