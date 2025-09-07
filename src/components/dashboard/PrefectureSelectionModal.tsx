// src/components/dashboard/PrefectureSelectionModal.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
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
    { id: 'pohja', name: 'Põhja prefektuur', description: 'Lääne-Harju, Ida-Harju' },
    { id: 'laane', name: 'Lääne prefektuur', description: 'Haapsalu, Kuressaare, Kärdla, Kesk-Eesti, Pärnu' },
    { id: 'louna', name: 'Lõuna prefektuur', description: 'Tartu, Kagu, Viljandi' },
    { id: 'ida', name: 'Ida prefektuur', description: 'Rakvere, Narva, Jõhvi' }
];

export const PrefectureSelectionModal: React.FC<PrefectureSelectionModalProps> = ({
                                                                                      isOpen,
                                                                                      userId,
                                                                                      onComplete
                                                                                  }) => {
    const [selectedPrefecture, setSelectedPrefecture] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

    // Load player stats when modal opens to determine context
    React.useEffect(() => {
        if (isOpen && userId) {
            const loadStats = async () => {
                try {
                    const statsDoc = await getDoc(doc(firestore, 'playerStats', userId));
                    if (statsDoc.exists()) {
                        setPlayerStats(statsDoc.data() as PlayerStats);
                    }
                } catch (error) {
                    console.error('Error loading player stats:', error);
                }
            };
            loadStats();
        }
    }, [isOpen, userId]);

    if (!isOpen) return null;

    // Determine the context - are they abipolitseinik or graduate?
    const hasCompletedBasicTraining = playerStats?.completedCourses?.includes('basic_police_training_abipolitseinik') || false;
    const hasGraduated = playerStats?.completedCourses?.includes('lopueksam') || false;

    // Determine the appropriate title and description
    const getModalContent = () => {
        if (hasGraduated) {
            return {
                title: 'Vali oma prefektuur',
                description: 'Sisekaitseakadeemia lõpetanuna pead valima prefektuuri, kus hakkad politseiametnikuna teenima.',
                role: 'politseiametnik'
            };
        } else if (hasCompletedBasicTraining) {
            return {
                title: 'Vali oma prefektuur',
                description: 'Abipolitseinikuna pead valima prefektuuri, kus hakkad teenima.',
                role: 'abipolitseinik'
            };
        } else {
            return {
                title: 'Vali oma prefektuur',
                description: 'Vali prefektuur, kus soovid töötada.',
                role: 'unknown'
            };
        }
    };

    const handleSubmit = async () => {
        if (!selectedPrefecture) return;

        setIsSubmitting(true);
        try {
            const statsRef = doc(firestore, 'playerStats', userId);

            const updates: any = {
                prefecture: selectedPrefecture
            };

            // For graduates, also set employment status if not already set
            if (hasGraduated && !playerStats?.isEmployed) {
                updates.isEmployed = true;
            }

            // For abipolitseinik who just completed basic training, set employment status
            if (hasCompletedBasicTraining && !hasGraduated && !playerStats?.isEmployed) {
                updates.isEmployed = true;
            }

            await updateDoc(statsRef, updates);
            onComplete();
        } catch (error) {
            console.error('Viga prefektuuri valimisel:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = getModalContent();

    return ReactDOM.createPortal(
        <div className="prefecture-modal-backdrop">
            <div className="prefecture-modal">
                <h2 className="prefecture-modal-title">{modalContent.title}</h2>
                <p className="prefecture-modal-description">
                    {modalContent.description}
                </p>

                {/* Show current status for context */}
                <div className="prefecture-status-info">
                    {hasGraduated ? (
                        <span className="status-badge graduate">👨‍🎓 Sisekaitseakadeemia lõpetanu</span>
                    ) : hasCompletedBasicTraining ? (
                        <span className="status-badge abipolitseinik">🚔 Abipolitseinik</span>
                    ) : (
                        <span className="status-badge new">🆕 Uus töötaja</span>
                    )}
                </div>

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
        </div>,
        document.body
    );
};