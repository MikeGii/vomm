// src/components/department/DepartmentInstructions.tsx
import React, { useState } from 'react';
import '../../styles/components/department/DepartmentInstructions.css';

export const DepartmentInstructions: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="department-instructions">
            <button
                className="instructions-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="toggle-content">
                    <span className="info-icon">ℹ️</span>
                    <span>Kuidas mängu osakonna süsteem toimib?</span>
                </div>
                <span className="chevron-icon">
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {isOpen && (
                <div className="instructions-content">
                    <div className="instruction-section">
                        <h3>🏛️ Politsei Hierarhia</h3>
                        <p>
                            Politsei on jaotatud <strong>prefektuurideks</strong>, mis jagunevad
                            <strong> osakondadeks (jaoskonnad)</strong> ja need omakorda <strong>üksusteks ehk talitused</strong>.
                            Kliki kaarte, et navigeerida läbi struktuuri ja näha mängijate ametikohtasid.
                        </p>
                    </div>

                    <div className="instruction-section">
                        <h3>📋 Minu Andmed</h3>
                        <p>
                            Siin näed oma praegust ametikohta, auastet ja töötunde (töötunnid on üldine summarum kogus läbi mängu). Sinu ametikoht
                            kuvatakse teistele mängijatele ka üldises edetabelis töölaual.
                        </p>
                    </div>

                    <div className="instruction-section">
                        <h3>🚔 Vabad Ametikohad</h3>
                        <p>
                            <strong>Üksuste liikmed:</strong> Võid liikuda teistesse üksustesse, kui täidad nõudmised. Tavalistel ametikohtadel puuduvad kandideerimise
                            tingimused. Alates grupijuhi ametikohast on nõutud kandideerimine. Samuti on igal ametikohal ka vastavad töö tegevused, mille loetelu jooksvalt täieneb<br/>
                            <strong>Juhtide kohad on piiratud.</strong> Igas allüksuses on kuni 4 grupijuhi kohta. (Hiljem lisandub juurde veel juhi kohti ja sõltuvalt mängijate
                            arvu kasvamisest kohti lisatakse juurde.<br/>
                            <strong>Grupijuhi kandideerimine:</strong> Saad kandideerida grupijuhiks oma üksuses.
                            Teised grupijuhid hääletavad, mille põhjal mäng teeb lõpliku otsuse 48 tunni jooksul.
                        </p>
                    </div>

                    <div className="instruction-section">
                        <h3>📊 Üksuste Ikoonid</h3>
                        <div className="units-grid">
                            <div className="unit-icon-item">🚔 <span>Patrullitalitus</span></div>
                            <div className="unit-icon-item">🔍 <span>Menetlustalitus</span></div>
                            <div className="unit-icon-item">🚨 <span>Kiirreageerimisüksus</span></div>
                            <div className="unit-icon-item">🐕 <span>K9 Üksus</span></div>
                            <div className="unit-icon-item">💻 <span>Küberkuritegevus</span></div>
                            <div className="unit-icon-item">🕵️ <span>Kuritegude Talitus</span></div>
                        </div><br/>
                        <strong>Milleks selline struktuur?</strong> Kuigi mängu arendamisel proovin lähtuda võimalikult reaalsetest andmetest ja loogikast,
                        siis paraku ei ole võimalik tänase mängu edetabeli punktisüsteemi juures jääda nii reaalseks, et luua politseistruktuur selliselt
                        nagu ta on reaalsuses. Samuti on see ka julgeoleku/andmekaitse oht kuvada kõiki üksuseid ja talitusi nii nagu nad päriselt on.
                        Seetõttu on täna igal avalikult leitaval jaoskonnal üksused nii nagu nad praegu on. Neid lisandub tulevikus juurde, kuid tõepoolest
                        mõned päriselus olevad tsentraalsed üksused on nüüd iga selles mängus oleva jaoskonna allüksused. <strong>Tegemist on siiski mänguga!</strong>
                    </div>

                    <div className="instruction-section">
                        <h3>📝 Avaldused</h3>
                        <p>
                            <strong>Grupijuhid</strong> saavad vaadata ja hääletada grupijuhi kandidaatide üle oma üksuses.<br/>
                            <strong>Minu Avaldused</strong> näitab kõiki sinu esitatud avaldusi ja nende staatust.
                        </p>
                    </div>

                    <div className="instruction-section">
                        <h3>💰 Talituse Arendamine</h3>
                        <p>
                            <strong>Talituse rahakott ja boonussüsteem:</strong> Iga talitus omab ühist rahakotti ja arendussüsteemi.
                            Kõik talituse liikmed – eesliini töötajad, grupijuhid ja talituse juhid – saavad annetada oma isiklikku
                            raha talituse ühisesse rahakotti.<br/>
                            <strong>Uuenduste ostmine:</strong> Talituse juht saab kasutada kogutud vahendeid erinevate uuenduste
                            soetamiseks, mis annavad boonuseid kõigile selle talituse liikmetele. Praegu on saadaval töö kogemuse
                            boonus (kuni +100% XP) ja palgaboonus (kuni +100% palk).<br/>
                            <strong>Ühised eelised:</strong> Kõik ostetud boonused kehtivad automaatselt kõigile talituse liikmetele,
                            sõltumata nende ametikohast. See motiveerib meeskonnatööd ja ühist panustamist talituse arengusse.
                        </p>
                    </div>

                    <div className="instruction-section">
                        <h3>🏆 Edetabel</h3>
                        <p>
                            Näitab erinevate üksuste ja prefektuuride parimaid tulemusi maine järgi.
                            Sinu üksuse edu panustab prefektuuri kogumainesse.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};