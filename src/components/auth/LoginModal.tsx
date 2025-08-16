// src/components/auth/LoginModal.tsx
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import '../../styles/layout/Modal.css';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen && !showForgotPassword) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose, showForgotPassword]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setError('');
            setShowPassword(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            onSuccess();
            onClose();
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                setError('Kasutajat ei leitud');
            } else if (error.code === 'auth/wrong-password') {
                setError('Vale parool');
            } else if (error.code === 'auth/invalid-email') {
                setError('Vigane e-posti aadress');
            } else if (error.code === 'auth/too-many-requests') {
                setError('Liiga palju ebaõnnestunud katseid. Proovi hiljem uuesti.');
            } else {
                setError('Sisselogimine ebaõnnestus');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="modal-backdrop">
                <div className="modal-content">
                    <button className="modal-close" onClick={onClose}>×</button>
                    <h2 className="modal-title">Sisene mängu</h2>
                    <form onSubmit={handleLogin} className="modal-form">
                        <input
                            type="email"
                            placeholder="E-posti aadress"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="modal-input"
                            disabled={loading}
                            autoComplete="email"
                        />
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Parool"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="modal-input"
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {error && <p className="modal-error">{error}</p>}
                        <button
                            type="submit"
                            className="modal-button"
                            disabled={loading || !email || !password}
                        >
                            {loading ? 'Sisenen...' : 'Logi sisse'}
                        </button>
                        <button
                            type="button"
                            className="modal-link-button"
                            onClick={() => setShowForgotPassword(true)}
                            disabled={loading}
                        >
                            Unustasid parooli?
                        </button>
                    </form>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </>
    );
};