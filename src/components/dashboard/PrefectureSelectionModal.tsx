import React, { useState } from 'react';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import '../../styles/components/PrefectureSelectionModal.css';
import {PlayerStats} from "../../types";

interface PrefectureSelectionModalProps {
    isOpen: boolean;
    userId: string;
    onComplete: () => void;
}

const PREFECTURES = [
    { id: 'pohja', name: 'Põhja prefektuur', description: 'Lääne- ja Ida-Harju' },
    { id: 'laane', name: 'Lääne prefektuur', description: 'Pärnu, Haapsalu, Kuressaare, Kesk-Eesti, Hiiumaa' },
    { id: 'louna', name: 'Lõuna prefektuur', description: 'Tartu, Põlva, Valga, Viljandi' },
    { id: 'ida', name: 'Ida prefektuur', description: 'Jõhvi, Narva, Rakvere' }
];

export const PrefectureSelectionModal: React.FC<PrefectureSelectionModalProps> = ({
                                                                                      isOpen,
                                                                                      userId,
                                                                                      onComplete
                                                                                  }) => {
    const [selectedPrefecture, setSelectedPrefecture] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedPrefecture) return;

        setIsSubmitting(true);
        try {
            const statsRef = doc(firestore, 'playerStats', userId);

            // Check current tutorial progress
            const statsDoc = await getDoc(statsRef);
            const currentStats = statsDoc.data() as PlayerStats;

            const updates: any = {
                prefecture: selectedPrefecture
            };

            // Complete tutorial if we're on step 8 (after returning from courses)
            if (currentStats.tutorialProgress.currentStep === 8 && !currentStats.tutorialProgress.isCompleted) {
                updates['tutorialProgress.currentStep'] = 9;
                updates['tutorialProgress.isCompleted'] = true;
                updates['tutorialProgress.completedAt'] = new Date();

                // Show completion message after modal closes
                setTimeout(() => {
                    alert('Õnnitleme! Oled läbinud edukalt õpetuse ja oled nüüd valmis alustama oma karjääri!');
                }, 500);
            }

            await updateDoc(statsRef, updates);
            onComplete();
        } catch (error) {
            console.error('Viga prefektuuri valimisel:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="prefecture-modal-backdrop">
            <div className="prefecture-modal">
                <h2 className="prefecture-modal-title">Vali oma prefektuur</h2>
                <p className="prefecture-modal-description">
                    Abipolitseinikuna pead valima prefektuuri, kus hakkad teenima.
                </p>

                <div className="prefecture-options">
                    {PREFECTURES.map((prefecture) => (
                        <div
                            key={prefecture.id}
                            className={`prefecture-option ${
                                selectedPrefecture === prefecture.name ? 'selected' : ''
                            }`}
                            onClick={() => setSelectedPrefecture(prefecture.name)}
                        >
                            <h3>{prefecture.name}</h3>
                            <p>{prefecture.description}</p>
                        </div>
                    ))}
                </div>

                <button
                    className="prefecture-submit-btn"
                    onClick={handleSubmit}
                    disabled={!selectedPrefecture || isSubmitting}
                >
                    {isSubmitting ? 'Kinnitan...' : 'Kinnita valik'}
                </button>
            </div>
        </div>
    );
};