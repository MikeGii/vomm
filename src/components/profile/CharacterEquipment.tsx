// src/components/profile/CharacterEquipment.tsx
import React, { useState } from 'react';
import { CharacterEquipment as CharacterEquipmentType, EquipmentSlot, EQUIPMENT_SLOT_NAMES } from '../../types/equipment';
import { InventoryItem } from '../../types/inventory';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
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

    // Calculate total bonuses from equipped items
    const totalBonuses = calculateEquipmentBonuses(equipment);

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

    const getAvailableItems = (slot: EquipmentSlot): InventoryItem[] => {
        return inventory.filter(item =>
            item.equipmentSlot === slot && !item.equipped
        );
    };

    const formatBonus = (value: number) => {
        if (value > 0) return `+${value}`;
        return value.toString();
    };

    const slots: EquipmentSlot[] = ['head', 'upperBody', 'lowerBody', 'hands', 'belt', 'weaponHolster', 'shoes'];

    return (
        <div className="character-equipment-simple">
            <h2 className="equipment-title">Varustus</h2>

            {/* Display total bonuses if any */}
            {Object.values(totalBonuses).some(v => v > 0) && (
                <div className="equipment-bonuses">
                    <h3 className="bonuses-title">Varustuse boonused:</h3>
                    <div className="bonuses-grid">
                        {totalBonuses.strength > 0 && (
                            <div className="bonus-item">
                                <span className="bonus-label">Jõud:</span>
                                <span className="bonus-value positive">{formatBonus(totalBonuses.strength)}</span>
                            </div>
                        )}
                        {totalBonuses.agility > 0 && (
                            <div className="bonus-item">
                                <span className="bonus-label">Kiirus:</span>
                                <span className="bonus-value positive">{formatBonus(totalBonuses.agility)}</span>
                            </div>
                        )}
                        {totalBonuses.dexterity > 0 && (
                            <div className="bonus-item">
                                <span className="bonus-label">Osavus:</span>
                                <span className="bonus-value positive">{formatBonus(totalBonuses.dexterity)}</span>
                            </div>
                        )}
                        {totalBonuses.intelligence > 0 && (
                            <div className="bonus-item">
                                <span className="bonus-label">Intelligentsus:</span>
                                <span className="bonus-value positive">{formatBonus(totalBonuses.intelligence)}</span>
                            </div>
                        )}
                        {totalBonuses.endurance > 0 && (
                            <div className="bonus-item">
                                <span className="bonus-label">Vastupidavus:</span>
                                <span className="bonus-value positive">{formatBonus(totalBonuses.endurance)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                                            {equippedItem.stats && Object.values(equippedItem.stats).some(v => v! > 0) && (
                                                <span className="item-bonuses">
                                                    {Object.entries(equippedItem.stats).map(([stat, value]) =>
                                                        value! > 0 ? `+${value} ${stat.substring(0, 3)}` : null
                                                    ).filter(Boolean).join(', ')}
                                                </span>
                                            )}
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
                                        <span className="no-items-text">Pole esemeid</span>
                                    )}
                                </div>
                            </div>

                            {isExpanded && availableItems.length > 0 && (
                                <div className="available-items">
                                    <h4>Saadaval esemeid:</h4>
                                    <div className="items-list">
                                        {availableItems.map(item => (
                                            <div key={item.id} className="available-item">
                                                <div className="item-details">
                                                    <span className="item-name">{item.name}</span>
                                                    {item.stats && (
                                                        <div className="item-stats">
                                                            {Object.entries(item.stats).map(([stat, value]) => (
                                                                value! > 0 && (
                                                                    <span key={stat} className="stat-bonus">
                                                                        +{value} {stat}
                                                                    </span>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className="item-price">
                                                        Väärtus: {item.marketPrice || Math.floor(item.shopPrice * 0.5)}€
                                                    </span>
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
};