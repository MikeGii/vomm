// src/components/profile/CharacterEquipment.tsx
import React, { useState } from 'react';
import { CharacterEquipment as CharacterEquipmentType, EquipmentSlot, EQUIPMENT_SLOT_NAMES } from '../../types/equipment';
import { InventoryItem } from '../../types/inventory';
import '../../styles/components/profile/CharacterEquipment.css';

interface CharacterEquipmentProps {
    equipment: CharacterEquipmentType;
    inventory: InventoryItem[];
    onEquip?: (slot: EquipmentSlot, itemId: string) => void;
    onUnequip?: (slot: EquipmentSlot) => void;
}

export const CharacterEquipment: React.FC<CharacterEquipmentProps> = ({
                                                                          equipment,
                                                                          inventory,
                                                                          onEquip,
                                                                          onUnequip
                                                                      }) => {
    const [expandedSlot, setExpandedSlot] = useState<EquipmentSlot | null>(null);

    const toggleSlot = (slot: EquipmentSlot) => {
        setExpandedSlot(expandedSlot === slot ? null : slot);
    };

    const handleEquip = (slot: EquipmentSlot, itemId: string) => {
        if (onEquip) {
            onEquip(slot, itemId);
        }
        setExpandedSlot(null);
    };

    const handleUnequip = (slot: EquipmentSlot) => {
        if (onUnequip) {
            onUnequip(slot);
        }
    };

    // Get available items for a specific slot from inventory
    const getAvailableItems = (slot: EquipmentSlot): InventoryItem[] => {
        return inventory.filter(item =>
            // Check if item can be equipped in this slot
            // This assumes inventory items have an equipmentSlot property
            (item as any).equipmentSlot === slot && !(item as any).equipped
        );
    };

    const slots: EquipmentSlot[] = ['head', 'upperBody', 'lowerBody', 'hands', 'belt', 'weaponHolster', 'shoes'];

    return (
        <div className="character-equipment-simple">
            <h2 className="equipment-title">Varustus</h2>
            <div className="equipment-table">
                <div className="table-header">
                    <div className="header-slot">Koht</div>
                    <div className="header-item">Varustus</div>
                    <div className="header-actions">Tegevused</div>
                </div>
                {slots.map(slot => {
                    const equippedItem = equipment[slot];
                    const availableItems = getAvailableItems(slot);
                    const isExpanded = expandedSlot === slot;

                    return (
                        <div key={slot} className="equipment-row-container">
                            <div className="equipment-row">
                                <div className="slot-name">{EQUIPMENT_SLOT_NAMES[slot]}</div>
                                <div className="equipped-item">
                                    {equippedItem ? (
                                        <div className="item-info">
                                            <span className="item-name">{equippedItem.name}</span>
                                        </div>
                                    ) : (
                                        <span className="empty-slot-text">Tühi</span>
                                    )}
                                </div>
                                <div className="slot-actions">
                                    {equippedItem ? (
                                        <button
                                            className="action-button unequip"
                                            onClick={() => handleUnequip(slot)}
                                        >
                                            Eemalda
                                        </button>
                                    ) : availableItems.length > 0 ? (
                                        <button
                                            className="action-button equip"
                                            onClick={() => toggleSlot(slot)}
                                        >
                                            {isExpanded ? 'Sulge' : 'Varusta'}
                                        </button>
                                    ) : (
                                        <span className="no-items">Puudub</span>
                                    )}
                                </div>
                            </div>
                            {isExpanded && availableItems.length > 0 && (
                                <div className="available-items">
                                    <div className="items-list">
                                        {availableItems.map(item => (
                                            <div key={item.id} className="available-item">
                                                <div className="item-details">
                                                    <span>{item.name}</span>
                                                    {item.rarity && (
                                                        <span className={`rarity-badge rarity-${item.rarity}`}>
                                                        {item.rarity}
                                                    </span>
                                                    )}
                                                </div>
                                                <button
                                                    className="equip-button"
                                                    onClick={() => handleEquip(slot, item.id)}
                                                >
                                                    Varusta
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}