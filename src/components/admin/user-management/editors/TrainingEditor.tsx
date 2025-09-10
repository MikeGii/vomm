// src/components/admin/user-management/editors/TrainingEditor.tsx
import React from 'react';
import { PlayerStats } from '../../../../types';

interface TrainingEditorProps {
    user: PlayerStats;
    isOpen: boolean;
    onToggle: () => void;
    onFieldUpdate: (path: string, value: any) => void;
}

export const TrainingEditor: React.FC<TrainingEditorProps> = ({
                                                                  user,
                                                                  isOpen,
                                                                  onToggle,
                                                                  onFieldUpdate
                                                              }) => {
    const getVipAwareMaxClicks = (): number => {
        if (user.isVip) {
            return user.activeWork ? 30 : 100;
        } else {
            return user.activeWork ? 10 : 50;
        }
    };

    const maxClicks = getVipAwareMaxClicks();

    return (
        <div className="editor-section">
            <button className="section-header" onClick={onToggle}>
                <span>Omadused ja Treening</span>
                <span className={`section-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="section-content">
                    {/* Physical Attributes */}
                    <h4 className="subsection-title">Füüsilised omadused</h4>

                    <div className="attributes-grid-management">
                        <div className="attribute-group">
                            <label>💪 Jõud:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.strength?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.strength.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.strength?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.strength.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🏃 Kiirus:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.agility?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.agility.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.agility?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.agility.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🎯 Osavus:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.dexterity?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.dexterity.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.dexterity?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.dexterity.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🏃‍♀️ Vastupidavus:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.endurance?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.endurance.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.endurance?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.endurance.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🧠 Intelligentsus:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.intelligence?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.intelligence.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.intelligence?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.intelligence.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Crafting Attributes */}
                    <h4 className="subsection-title">Käsitööoskused</h4>

                    <div className="attributes-grid-management">
                        <div className="attribute-group">
                            <label>👨‍🍳 Koka kunst:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.cooking?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.cooking.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.cooking?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.cooking.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🍺 Pruulimine:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.brewing?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.brewing.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.brewing?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.brewing.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>⚗️ Keemia:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.chemistry?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.chemistry.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.chemistry?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.chemistry.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🧵 Õmblemine:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.sewing?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.sewing.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.sewing?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.sewing.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>💊 Meditsiin:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.medicine?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.medicine.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.medicine?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.medicine.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🖨️ Trükkimine:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.printing?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.printing.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.printing?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.printing.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="attribute-group">
                            <label>🔧 Laseriga lõikamine:</label>
                            <div className="attribute-fields">
                                <input
                                    type="number"
                                    placeholder="Tase"
                                    value={user.attributes?.lasercutting?.level || 0}
                                    onChange={(e) => onFieldUpdate('attributes.lasercutting.level', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <input
                                    type="number"
                                    placeholder="Kogemus"
                                    value={user.attributes?.lasercutting?.experience || 0}
                                    onChange={(e) => onFieldUpdate('attributes.lasercutting.experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Training Clicks */}
                    <h4 className="subsection-title">Treeningklikid</h4>

                    <div className="training-clicks-grid">
                        <div className="training-section">
                            <label>🏋️ Sporditreening:</label>
                            <input
                                type="number"
                                value={user.trainingData?.remainingClicks || 0}
                                onChange={(e) => onFieldUpdate('trainingData.remainingClicks', parseInt(e.target.value) || 0)}
                                min="0"
                                max={maxClicks}
                            />
                        </div>

                        <div className="training-section">
                            <label>👨‍🍳 Köök & Labor:</label>
                            <input
                                type="number"
                                value={user.kitchenLabTrainingData?.remainingClicks || 0}
                                onChange={(e) => onFieldUpdate('kitchenLabTrainingData.remainingClicks', parseInt(e.target.value) || 0)}
                                min="0"
                                max={maxClicks}
                            />
                        </div>

                        <div className="training-section">
                            <label>🔨 Käsitöö:</label>
                            <input
                                type="number"
                                value={user.handicraftTrainingData?.remainingClicks || 0}
                                onChange={(e) => onFieldUpdate('handicraftTrainingData.remainingClicks', parseInt(e.target.value) || 0)}
                                min="0"
                                max={maxClicks}
                            />
                        </div>
                    </div>

                    <div className="training-info">
                        💡 Maks klikke: {maxClicks} (VIP: {user.isVip ? '✅' : '❌'}, Tööl: {user.activeWork ? '✅' : '❌'})
                    </div>
                </div>
            )}
        </div>
    );
};