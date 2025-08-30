// src/types/equipment.ts (UPDATE)
export type EquipmentSlot =
    | 'head'
    | 'upperBody'
    | 'lowerBody'
    | 'hands'
    | 'belt'
    | 'weaponHolster'
    | 'shoes'
    | '3d_printer_slot'
    | 'laser_cutter_slot';

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
        printing?: number;
        lasercutting?: number;
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
    '3d_printer_slot'?: EquipmentItem;
    'laser_cutter_slot'?: EquipmentItem;
}

export const EQUIPMENT_SLOT_NAMES: Record<EquipmentSlot, string> = {
    head: 'Pea',
    upperBody: 'Ülakeha',
    lowerBody: 'Alakeha',
    hands: 'Käed',
    belt: 'Vöö',
    weaponHolster: 'Relva kabuur',
    shoes: 'Jalatsid',
    '3d_printer_slot': '3D Printer',
    'laser_cutter_slot': 'Laser Cutter'
};