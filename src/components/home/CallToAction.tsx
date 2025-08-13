// src/components/home/CallToAction.tsx
import React, { useState } from 'react';
import { RegisterModal } from '../auth/RegisterModal';
import { useNavigate } from 'react-router-dom';
import '../../styles/CallToAction.css';

export const CallToAction: React.FC = () => {
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const navigate = useNavigate();

    const handleRegisterSuccess = () => {
        navigate('/dashboard');
    };

    return (
        <>
            <section className="cta">
                <div className="cta-container">
                    <h2 className="cta-title">Kas oled valmis korrakaitsjaks?</h2>
                    <p className="cta-description">
                        Liitu tuhandete teiste mängijatega võitluses kuritegevuse vastu.
                        Eesti linnad vajavad sind!
                    </p>
                    <button
                        className="cta-button"
                        onClick={() => setShowRegisterModal(true)}
                    >
                        Alusta karjääri
                    </button>
                </div>
            </section>

            <RegisterModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSuccess={handleRegisterSuccess}
            />
        </>
    );
};