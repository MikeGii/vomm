// src/components/dragrace/DragRaceInstructions.tsx
import React, { useState } from 'react';
import '../../styles/components/dragrace/DragRaceInstructions.css';

export const DragRaceInstructions: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="dragrace-instructions">
            <button
                className="dr-instructions-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="dr-toggle-content">
                    <span className="dr-info-icon">🏁</span>
                    <span>Kuidas kiirendusvõistluse treening toimib?</span>
                </div>
                <span className="dr-chevron-icon">
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {isOpen && (
                <div className="dr-instructions-content">
                    <div className="dr-instruction-section">
                        <h3>🚗 Alustamiseks vajalik</h3>
                        <ol>
                            <li><strong>Osta auto</strong> - Mine autode lehele ja osta endale sobiv auto</li>
                            <li><strong>Määra aktiivne auto</strong> - Kliki "Vali auto" nuppu ja vali oma aktiivne auto (NB! ka treenimine lisab 1.6km ehk 1 miili iga treening läbisõidule)</li>
                            <li><strong>Alusta treeningut</strong> - Nüüd saad alustada kiirendusvõistluse treeninguid</li>
                        </ol>
                    </div>

                    <div className="dr-instruction-section">
                        <h3>⛽ Kütuse süsteem</h3>
                        <p>
                            <strong>Tasuta kütus:</strong> Saad iga tund 5 tasuta katset. Kütus täieneb automaatselt iga tunni alguses.<br/>
                            <strong>Lisatasu:</strong> Võid osta lisaks kuni 25 katset raha eest (1000€ katse kohta) või piiramatul hulgal pollide eest (10 pollid katse kohta).
                        </p>
                    </div>

                    <div className="dr-instruction-section">
                        <h3>🎯 Oskuste süsteem</h3>
                        <p>
                            Kiirendusvõistluse treening arendab kolme spetsiifilist oskust, mille arengu kiirus sõltub sinu põhiatribuutidest:
                        </p>
                        <div className="dr-attributes-grid">
                            <div className="dr-attribute-item">
                                <span className="dr-attr-icon">🎯</span>
                                <div className="dr-attr-info">
                                    <strong>Auto käsitsemine</strong>
                                    <span>Sõltub osavusest</span>
                                </div>
                            </div>
                            <div className="dr-attribute-item">
                                <span className="dr-attr-icon">⚡</span>
                                <div className="dr-attr-info">
                                    <strong>Reageerimisaeg</strong>
                                    <span>Sõltub kiirusest</span>
                                </div>
                            </div>
                            <div className="dr-attribute-item">
                                <span className="dr-attr-icon">⚙️</span>
                                <div className="dr-attr-info">
                                    <strong>Käiguvahetuse moment</strong>
                                    <span>Sõltub intelligentsusest</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dr-instruction-section">
                        <h3>📈 Treeningu efektiivsus</h3>
                        <p>
                            <strong>Kogemusepunktid:</strong> Mida kõrgem on sinu põhiatribuut, seda rohkem XP saad vastavast treeningust.<br/>
                            <strong>Soovitus:</strong> Treeni esmalt põhiatribuute (jõud, kiirus, osavus, intelligentsus) sporditreeningus, et kiirendusvõistluse treening oleks efektiivsem.
                        </p>
                    </div>

                    <div className="dr-instruction-section">
                        <h3>🏁 Tulevased võimalused</h3>
                        <p>
                            Praegu saad ainult treenida. Tulevikus lisanduvad:
                            <strong> võidusõidud teiste mängijatega</strong>, <strong>erinevad rajad</strong>,
                            <strong> autode täiustamine</strong> ja <strong>drag race turniirid</strong>.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};