// src/components/auth/RegisterModal.tsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../config/firebase';
import { User } from '../../types';
import '../../styles/Modal.css';

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            const userProfile: User = {
                uid: user.uid,
                email: user.email!,
                username,
                createdAt: new Date()
            };

            await setDoc(doc(firestore, 'users', user.uid), userProfile);
            onSuccess();
            onClose();
            setEmail('');
            setPassword('');
            setUsername('');
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                setError('See e-posti aadress on juba kasutusel');
            } else if (error.code === 'auth/weak-password') {
                setError('Parool peab olema vähemalt 6 tähemärki pikk');
            } else {
                setError('Registreerimine ebaõnnestus. Proovi uuesti.');
            }
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
                <h2 className="modal-title">Alusta karjääri</h2>
                <form onSubmit={handleRegister} className="modal-form">
                    <input
                        type="text"
                        placeholder="Kasutajanimi"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="modal-input"
                        disabled={loading}
                    />
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
                        placeholder="Parool (vähemalt 6 tähemärki)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="modal-input"
                        disabled={loading}
                    />
                    {error && <p className="modal-error">{error}</p>}
                    <button
                        type="submit"
                        className="modal-button"
                        disabled={loading}
                    >
                        {loading ? 'Registreerin...' : 'Loo konto'}
                    </button>
                </form>
            </div>
        </div>
    );
};