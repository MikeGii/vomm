// src/components/dashboard/InstructionsModal.tsx
import React, { useEffect } from 'react';
import '../../styles/components/dashboard/InstructionsModal.css';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
    // Handle ESC key press
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Don't render if not open
    if (!isOpen) return null;

    // Handle backdrop click
    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    // Prevent modal content clicks from bubbling up
    const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    return (
        <div className="game-instructions-modal__backdrop" onClick={handleBackdropClick}>
            <div className="game-instructions-modal__container" onClick={handleModalClick}>
                <button
                    className="game-instructions-modal__close-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    ×
                </button>

                <h2 className="game-instructions-modal__title">Kuidas tõhusalt mängida</h2>

                <div className="game-instructions-modal__content">
                    <div className="game-instructions-modal__section">
                        <h3 className="game-instructions-modal__section-title">🎯 Kuidas alustada</h3>
                        <ol className="game-instructions-modal__ordered-list">
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Alusta koolitustega</strong> - Mine koolituste lehele ja lõpeta "Abipolitseiniku baaskursus"
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Vali prefektuur</strong> - Nüüd saad valida omale prefektuuri, kus soovid abipolitseinikuna oma teenistust alustada
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Tõuse tasemele 2</strong> - Kui kursus on lõpetatud, mine treeningusse ja tõuse vähemalt tasemele 2
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Alusta töötamist</strong> - Nüüd saad minna tööle ja alustada oma töötundide kogumist. NB! Abipolitseinikud ei saa töötamise eest raha
                            </li>
                        </ol>
                    </div>

                    <div className="game-instructions-modal__section">
                        <h3 className="game-instructions-modal__section-title">💡 Kasulikud näpunäited</h3>
                        <ul className="game-instructions-modal__unordered-list">
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Tervis on oluline</strong> - Jälgi oma tervist! Kui tervis on madal, kasuta meditsiiniesemeid või oota loomuliku taastumise peale
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Treeni regulaarselt</strong> - Treening annab sulle paremaid omadusi ja võimeid
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Kuidas alguses raha teenida?</strong> - Poest saad osta algmaterjale, et alustada oma väikest kõrvaläri tootes turule valmis produkte algmaterjalidest. Saad hõlpsasti arendada järk järgult enda söögi, joogi ja keemia oskuseid treeningu lehel
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Ära lange hasarti</strong> - Kasiino on küll tore koht, kuid sinna mine alles siis kui sul on raha, millega toime tulla
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Kiirema arengu saamiseks</strong> - Kasuta turult saadaolevaid võimendeid (boostereid)
                            </li>
                        </ul>
                        <p className="game-instructions-modal__note">
                            <em>Märkus: Abipolitseinikuna on raha teenimine keeruline, kuid kõrgema taseme mängijatele uute toodete loomine aitab turul puhastust hoida ja teenida varajast raha.</em>
                        </p>
                    </div>

                    <div className="game-instructions-modal__section">
                        <h3 className="game-instructions-modal__section-title">💰 Mängu majandus</h3>
                        <ul className="game-instructions-modal__unordered-list">
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Automaatsed tooted</strong> - Mängus on tooteid, mille varu täieneb automaatselt
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Mängijate tooted</strong> - Mängus on tooteid, mida peavad tootma mängijad ise
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Hinnad sõltuvad varast</strong> - Mida vähem tooteid turul on, seda kõrgemad on hinnad
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Mängijate mõju</strong> - Mida rohkem tooteid mängijad loovad, seda madalamaks muutuvad turuhinnad
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Piiratud varud</strong> - Mõned tooted on varukoguse poolest piiratud, seega tuleb turgu aktiivselt jälgida paremate hindade saamiseks
                            </li>
                            <li className="game-instructions-modal__list-item">
                                <strong className="game-instructions-modal__highlight">Aeglane täienemine</strong> - Varu täieneb aeglaselt, seega on soovitatav osta rohkem, kui hinnad on head
                            </li>
                        </ul>
                    </div>

                    <div className="game-instructions-modal__section">
                        <h3 className="game-instructions-modal__section-title">🏆 Eesmärgid</h3>
                        <ul className="game-instructions-modal__unordered-list">
                            <li className="game-instructions-modal__list-item">Alusta oma karjääriredelil tõusmist lõpetades Sisekaitseakadeemia</li>
                            <li className="game-instructions-modal__list-item">Läbi võimalikult palju koolitusi, et läbi nende omandada uusi oskuseid, mis aitavad kaasa mängija kiiremal arengul</li>
                            <li className="game-instructions-modal__list-item">Kogu raha ja osta paremaid esemeid</li>
                            <li className="game-instructions-modal__list-item">Võitle teiste mängijatega võitlusklubis</li>
                            <li className="game-instructions-modal__list-item">Tõuse parimaks mängijaks oma prefektuuris</li>
                        </ul>
                    </div>

                    <div className="game-instructions-modal__section game-instructions-modal__section--last">
                        <h3 className="game-instructions-modal__section-title">❓ Probleemid?</h3>
                        <p className="game-instructions-modal__text">Kui sul on küsimusi või probleeme, kontrolli järgmist:</p>
                        <ul className="game-instructions-modal__unordered-list">
                            <li className="game-instructions-modal__list-item">Kas sa oled lõpetanud vajalikud kursused?</li>
                            <li className="game-instructions-modal__list-item">Kas su tase on piisavalt kõrge?</li>
                            <li className="game-instructions-modal__list-item">Kas su tervis on korras?</li>
                            <li className="game-instructions-modal__list-item">Kas sul on piisavalt raha või kogemust?</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};