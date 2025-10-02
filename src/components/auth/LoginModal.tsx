// src/components/auth/LoginModal.tsx - UPDATED
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { GAME_SERVERS } from '../../types/server';
import { setCurrentServer, getServerSpecificId } from '../../utils/serverUtils';
import '../../styles/layout/Modal.css';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedServer, setSelectedServer] = useState('beta');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewServerWarning, setShowNewServerWarning] = useState(false);
    const [pendingLogin, setPendingLogin] = useState<{ userId: string; serverId: string } | null>(null);

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen && !showForgotPassword && !showNewServerWarning) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose, showForgotPassword, showNewServerWarning]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setError('');
            setShowPassword(false);
            setSelectedServer('beta');
            setShowNewServerWarning(false);
            setPendingLogin(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const checkPlayerProgress = async (userId: string, serverId: string): Promise<boolean> => {
        const docId = getServerSpecificId(userId, serverId);
        const statsDoc = await getDoc(doc(firestore, 'playerStats', docId));
        return statsDoc.exists();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            // Check if player has progress on selected server
            const hasProgress = await checkPlayerProgress(userId, selectedServer);

            if (!hasProgress) {
                // Player has no progress on this server
                setPendingLogin({ userId, serverId: selectedServer });
                setShowNewServerWarning(true);
                setLoading(false);
                return;
            }

            // Player has progress, proceed with login
            proceedWithLogin(selectedServer);

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
            setLoading(false);
        }
    };

    const proceedWithLogin = (serverId: string) => {
        // Set the current server
        setCurrentServer(serverId);

        // Clear cache to ensure fresh data
        localStorage.clear();
        localStorage.setItem('currentServer', serverId);

        // Success callback will navigate to dashboard
        onSuccess();
        onClose();
    };

    const confirmNewServerLogin = () => {
        if (pendingLogin) {
            proceedWithLogin(pendingLogin.serverId);
        }
    };

    const cancelNewServerLogin = () => {
        setShowNewServerWarning(false);
        setPendingLogin(null);
        setLoading(false);
    };

    // Show warning modal if trying to log into new server
    if (showNewServerWarning) {
        return (
            <div className="modal-backdrop">
                <div className="modal-content">
                    <h2 className="modal-title">⚠️ Uus server</h2>
                    <p className="modal-description">
                        Oled logimas sisse maailma <strong>{GAME_SERVERS[pendingLogin?.serverId || 'beta'].name}</strong>,
                        kus sinu kasutajal veel ei ole mängijat.
                    </p>
                    <p className="modal-description">
                        Kas soovid jätkata? Alustad selles serveris täiesti nullist.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            className="modal-button-secondary"
                            onClick={cancelNewServerLogin}
                        >
                            Tühista
                        </button>
                        <button
                            className="modal-button"
                            onClick={confirmNewServerLogin}
                        >
                            Jätka
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="modal-backdrop">
                <div className="modal-content">
                    <button className="modal-close" onClick={onClose}>×</button>
                    <h2 className="modal-title">Sisene mängu</h2>
                    <form onSubmit={handleLogin} className="modal-form">
                        {/* Server selection dropdown */}
                        <select
                            value={selectedServer}
                            onChange={(e) => setSelectedServer(e.target.value)}
                            className="modal-input"
                            disabled={loading}
                        >
                            {Object.values(GAME_SERVERS).map(server => (
                                <option key={server.id} value={server.id}>
                                    {server.name} - {server.description}
                                </option>
                            ))}
                        </select>

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