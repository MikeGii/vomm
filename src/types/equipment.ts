// src/types/equipment.ts
import { IconType } from 'react-icons';

export type EquipmentSlot =
    | 'head'
    | 'upperBody'
    | 'lowerBody'
    | 'hands'
    | 'belt'
    | 'weaponHolster'
    | 'shoes';

export interface EquipmentItem {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    shopPrice: number;
    marketPrice?: number;
    stats?: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
    };
    equipped: boolean;
}

export interface CharacterEquipment {
    head?: EquipmentItem;
    upperBody?: EquipmentItem;
    lowerBody?: EquipmentItem;
    hands?: EquipmentItem;
    belt?: EquipmentItem;
    weaponHolster?: EquipmentItem;
    shoes?: EquipmentItem;
}

export const EQUIPMENT_SLOT_NAMES: Record<EquipmentSlot, string> = {
    head: 'Pea',
    upperBody: 'Ülakeha',
    lowerBody: 'Alakeha',
    hands: 'Käed',
    belt: 'Vöö',
    weaponHolster: 'Relva kabuur',
    shoes: 'Jalatsid'
};