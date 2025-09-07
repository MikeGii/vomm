// src/components/dashboard/DepartmentSelectionModal.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { getDepartmentsByPrefecture } from '../../data/prefectures';
import '../../styles/components/DepartmentSelectionModal.css';

interface DepartmentSelectionModalProps {
    isOpen: boolean;
    userId: string;
    prefecture: string;
    onComplete: () => void;
}

export const DepartmentSelectionModal: React.FC<DepartmentSelectionModalProps> = ({
                                                                                      isOpen,
                                                                                      userId,
                                                                                      prefecture,
                                                                                      onComplete
                                                                                  }) => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const departments = getDepartmentsByPrefecture(prefecture);

    const handleSubmit = async () => {
        if (!selectedDepartment) return;

        setIsSubmitting(true);
        try {
            const statsRef = doc(firestore, 'playerStats', userId);
            await updateDoc(statsRef, {
                department: selectedDepartment
            });
            onComplete();
        } catch (error) {
            console.error('Viga osakonna valimisel:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="department-modal-backdrop">
            <div className="department-modal">
                <h2 className="department-modal-title">Vali oma osakond</h2>
                <p className="department-modal-description">
                    Oled lõpetanud Sisekaitseakadeemia ja määratud {prefecture} prefektuuri.
                    Nüüd pead valima osakonna, kus hakkad teenima inspektorina.
                </p>

                <div className="department-options">
                    {departments.map((dept) => (
                        <div
                            key={dept}
                            className={`department-option ${
                                selectedDepartment === dept ? 'selected' : ''
                            }`}
                            onClick={() => setSelectedDepartment(dept)}
                        >
                            <h3>{dept}</h3>
                        </div>
                    ))}
                </div>

                <button
                    className="department-submit-btn"
                    onClick={handleSubmit}
                    disabled={!selectedDepartment || isSubmitting}
                >
                    {isSubmitting ? 'Kinnitan...' : 'Kinnita valik'}
                </button>
            </div>
        </div>,
        document.body
    );
};