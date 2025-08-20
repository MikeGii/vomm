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
            // Prevent body scroll when modal is open
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
    const handleBackdropClick = (event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="instructions-modal-backdrop" onClick={handleBackdropClick}>
            <div className="instructions-modal">
                <button className="modal-close" onClick={onClose}>
                    ×
                </button>
                <h2 className="modal-title">Kuidas tõhusalt mängida</h2>
                <div className="instructions-content">
                    <div className="instruction-section">
                        <h3>🎯 Kuidas alustada</h3>
                        <ol>
                            <li><strong>Alusta koolitustega</strong> - Mine koolituste lehele ja lõpeta "Abipolitseiniku baaskursus"</li>
                            <li><strong>Vali prefektuur</strong> - Nüüd saad valida omale prefektuuri, kus soovid abipolitseinikuna oma teenistust alustada</li>
                            <li><strong>Tõuse tasemele 2</strong> - Kui kursus on lõpetatud, mine treeningusse ja tõuse vähemalt tasemele 2</li>
                            <li><strong>Alusta töötamist</strong> - Nüüd saad minna tööle ja alustada oma töötundide kogumist. NB! Abipolitseinikud ei saa töötamise eest raha</li>
                        </ol>
                    </div>

                    <div className="instruction-section">
                        <h3>💡 Kasulikud näpunäited</h3>
                        <ul>
                            <li><strong>Tervis on oluline</strong> - Jälgi oma tervist! Kui tervis on madal, kasuta meditsiiniesemeid või oota loomuliku taastumise peale</li>
                            <li><strong>Treeni regulaarselt</strong> - Treening annab sulle paremaid omadusi ja võimeid</li>
                            <li><strong>Kuidas alguses raha teenida?</strong> - Poest saad osta algmaterjale, et alustada oma väikest kõrvaläri tootes turule valmis produkte algmaterjalidest. Saad hõlpsasti arendada järk järgult enda söögi, joogi ja keemia oskuseid treeningu lehel</li>
                            <li><strong>Ära lange hasarti</strong> - Kasiino on küll tore koht, kuid sinna mine alles siis kui sul on raha, millega toime tulla</li>
                            <li><strong>Kiirema arengu saamiseks</strong> - Kasuta turult saadaolevaid võimendeid (boostereid)</li>
                        </ul>
                        <p><em>Märkus: Abipolitseinikuna on raha teenimine keeruline, kuid kõrgema taseme mängijatele uute toodete loomine aitab turul puhastust hoida ja teenida varajast raha.</em></p>
                    </div>

                    <div className="instruction-section">
                        <h3>💰 Mängu majandus</h3>
                        <ul>
                            <li><strong>Automaatsed tooted</strong> - Mängus on tooteid, mille varu täieneb automaatselt</li>
                            <li><strong>Mängijate tooted</strong> - Mängus on tooteid, mida peavad tootma mängijad ise</li>
                            <li><strong>Hinnad sõltuvad varast</strong> - Mida vähem tooteid turul on, seda kõrgemad on hinnad</li>
                            <li><strong>Mängijate mõju</strong> - Mida rohkem tooteid mängijad loovad, seda madalamaks muutuvad turuhinnad</li>
                            <li><strong>Piiratud varud</strong> - Mõned tooted on varukoguse poolest piiratud, seega tuleb turgu aktiivselt jälgida paremate hindade saamiseks</li>
                            <li><strong>Aeglane täienemine</strong> - Varu täieneb aeglaselt, seega on soovitatav osta rohkem, kui hinnad on head</li>
                        </ul>
                    </div>

                    <div className="instruction-section">
                        <h3>🏆 Eesmärgid</h3>
                        <ul>
                            <li>Alusta oma karjääriredelil tõusmist lõpetades Sisekaitseakadeemia</li>
                            <li>Läbi võimalikult palju koolitusi, et läbi nende omandada uusi oskuseid, mis aitavad kaasa mängija kiiremal arengul</li>
                            <li>Kogu raha ja osta paremaid esemeid</li>
                            <li>Võitle teiste mängijatega võitlusklubis</li>
                            <li>Tõuse parimaks mängijaks oma prefektuuris</li>
                        </ul>
                    </div>

                    <div className="instruction-section">
                        <h3>❓ Probleemid?</h3>
                        <p>Kui sul on küsimusi või probleeme, kontrolli järgmist:</p>
                        <ul>
                            <li>Kas sa oled lõpetanud vajalikud kursused?</li>
                            <li>Kas su tase on piisavalt kõrge?</li>
                            <li>Kas su tervis on korras?</li>
                            <li>Kas sul on piisavalt raha või kogemust?</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};