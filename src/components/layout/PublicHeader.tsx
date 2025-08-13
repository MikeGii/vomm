// src/components/layout/PublicHeader.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../auth/LoginModal';
import { RegisterModal } from '../auth/RegisterModal';
import '../../styles/layout/Header.css';

export const PublicHeader: React.FC = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const navigate = useNavigate();

    const handleLoginSuccess = () => {
        navigate('/dashboard');
    };

    const handleRegisterSuccess = () => {
        navigate('/dashboard');
    };

    return (
        <>
            <header className="header">
                <div className="header-container">
                    <div className="header-left"></div>
                    <div className="header-center">
                        <h1 className="game-title">Võmm</h1>
                    </div>
                    <div className="header-right">
                        <button
                            className="header-btn"
                            onClick={() => setShowRegisterModal(true)}
                        >
                            Registreeri
                        </button>
                        <button
                            className="header-btn header-btn-primary"
                            onClick={() => setShowLoginModal(true)}
                        >
                            Logi sisse
                        </button>
                    </div>
                </div>
            </header>

            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />

            <RegisterModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSuccess={handleRegisterSuccess}
            />
        </>
    );
};