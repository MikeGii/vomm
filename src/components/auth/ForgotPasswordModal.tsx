// src/components/auth/ForgotPasswordModal.tsx
import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import '../../styles/layout/Modal.css';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    // Reset states when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setError('');
            setSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                setError('Selle e-posti aadressiga kasutajat ei leitud');
            } else if (error.code === 'auth/invalid-email') {
                setError('Vigane e-posti aadress');
            } else {
                setError('Parooli lähtestamine ebaõnnestus. Proovi hiljem uuesti.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>×</button>
                <h2 className="modal-title">Unustasid parooli?</h2>

                {success ? (
                    <div className="modal-success">
                        <p>✅ Parooli lähtestamise link on saadetud!</p>
                        <p className="modal-success-info">
                            Vaata oma e-posti ja järgi juhiseid parooli lähtestamiseks.
                        </p>
                        <button
                            className="modal-button"
                            onClick={onClose}
                        >
                            Sulge
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="modal-description">
                            Sisesta oma e-posti aadress ja saadame sulle parooli lähtestamise lingi.
                        </p>
                        <form onSubmit={handleResetPassword} className="modal-form">
                            <input
                                type="email"
                                placeholder="E-posti aadress"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="modal-input"
                                disabled={loading}
                                autoFocus
                            />
                            {error && <p className="modal-error">{error}</p>}
                            <button
                                type="submit"
                                className="modal-button"
                                disabled={loading || !email}
                            >
                                {loading ? 'Saadan...' : 'Saada lähtestamise link'}
                            </button>
                            <button
                                type="button"
                                className="modal-button-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Tühista
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};