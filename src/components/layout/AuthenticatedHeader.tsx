// src/components/layout/AuthenticatedHeader.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import '../../styles/Header.css';

export const AuthenticatedHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left"></div>
                <div className="header-center">
                    <h1 className="game-title">Võmm</h1>
                </div>
                <div className="header-right">
                    <div className="menu-container">
                        <button
                            className="menu-burger"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        {isMenuOpen && (
                            <div className="menu-dropdown">
                                <button onClick={handleLogout} className="menu-item">
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};