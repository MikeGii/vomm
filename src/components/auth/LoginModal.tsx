// src/components/auth/LoginModal.tsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import '../../styles/Modal.css';

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

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            onSuccess();
            onClose();
            setEmail('');
            setPassword('');
        } catch (error: any) {
            setError('Vale e-post või parool');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
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
                    />
                    <input
                        type="password"
                        placeholder="Parool"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="modal-input"
                        disabled={loading}
                    />
                    {error && <p className="modal-error">{error}</p>}
                    <button
                        type="submit"
                        className="modal-button"
                        disabled={loading}
                    >
                        {loading ? 'Sisenen...' : 'Logi sisse'}
                    </button>
                </form>
            </div>
        </div>
    );
};