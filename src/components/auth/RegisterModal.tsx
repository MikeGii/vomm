// src/components/auth/RegisterModal.tsx
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../config/firebase';
import { User } from '../../types';
import { validateUsername } from '../../services/UserValidationService';
import '../../styles/layout/Modal.css';

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // New states for username validation
    const [usernameValidation, setUsernameValidation] = useState<{
        isValid: boolean;
        isAvailable: boolean;
        message: string;
        isChecking: boolean;
    }>({
        isValid: false,
        isAvailable: false,
        message: '',
        isChecking: false
    });

    // Debounced username validation
    const validateUsernameDebounced = debounce(async (usernameToCheck: string) => {
        if (usernameToCheck.length < 3) {
            setUsernameValidation({
                isValid: false,
                isAvailable: false,
                message: '',
                isChecking: false
            });
            return;
        }

        setUsernameValidation(prev => ({ ...prev, isChecking: true }));

        const result = await validateUsername(usernameToCheck);

        setUsernameValidation({
            isValid: result.isValid,
            isAvailable: result.isAvailable,
            message: result.message,
            isChecking: false
        });
    }, 500);

    // Username change handler
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUsername = e.target.value;
        setUsername(newUsername);

        // Clear form-level errors when user starts typing
        if (error) setError('');

        // Trigger debounced validation
        validateUsernameDebounced(newUsername);
    };

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

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setUsername('');
            setError('');
            setShowPassword(false);
            setPasswordStrength(0);
            setUsernameValidation({
                isValid: false,
                isAvailable: false,
                message: '',
                isChecking: false
            });
        }
    }, [isOpen]);

    // Calculate password strength
    useEffect(() => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        setPasswordStrength(strength);
    }, [password]);

    if (!isOpen) return null;

    const validateForm = (): boolean => {
        // Check username validation first
        if (!usernameValidation.isValid || !usernameValidation.isAvailable) {
            setError('Kasutajanimi ei ole kehtiv või on juba kasutusel');
            return false;
        }

        if (password.length < 6) {
            setError('Parool peab olema vähemalt 6 tähemärki pikk');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Paroolid ei ühti');
            return false;
        }
        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            const userProfile: User = {
                uid: user.uid,
                email: user.email!,
                username,
                usernameLower: username.toLowerCase(),
                createdAt: new Date()
            };

            await setDoc(doc(firestore, 'users', user.uid), userProfile);
            onSuccess();
            onClose();
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                setError('See e-posti aadress on juba kasutusel');
            } else if (error.code === 'auth/weak-password') {
                setError('Parool on liiga nõrk');
            } else if (error.code === 'auth/invalid-email') {
                setError('Vigane e-posti aadress');
            } else {
                setError('Registreerimine ebaõnnestus. Proovi uuesti.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Get username input styling based on validation state
    const getUsernameInputClass = () => {
        let baseClass = 'modal-input';

        if (username.length >= 3) {
            if (usernameValidation.isChecking) {
                baseClass += ' username-checking';
            } else if (usernameValidation.isAvailable) {
                baseClass += ' username-available';
            } else if (!usernameValidation.isValid || !usernameValidation.isAvailable) {
                baseClass += ' username-unavailable';
            }
        }

        return baseClass;
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength <= 2) return 'Nõrk';
        if (passwordStrength <= 3) return 'Keskmine';
        if (passwordStrength <= 4) return 'Tugev';
        return 'Väga tugev';
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 2) return '#ff6b6b';
        if (passwordStrength <= 3) return '#ff9800';
        if (passwordStrength <= 4) return '#4caf50';
        return '#4a90e2';
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>×</button>
                <h2 className="modal-title">Alusta karjääri</h2>
                <form onSubmit={handleRegister} className="modal-form">
                    <div className="username-input-container">
                        <input
                            type="text"
                            placeholder="Kasutajanimi (3-20 tähemärki)"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                            className={getUsernameInputClass()}
                            disabled={loading}
                            autoComplete="username"
                            maxLength={20}
                        />
                        <div className="username-validation-indicator">
                            {usernameValidation.isChecking && (
                                <span className="validation-checking">⏳</span>
                            )}
                            {!usernameValidation.isChecking && username.length >= 3 && (
                                <span className={`validation-icon ${usernameValidation.isAvailable ? 'available' : 'unavailable'}`}>
                                    {usernameValidation.isAvailable ? '✅' : '❌'}
                                </span>
                            )}
                        </div>
                    </div>
                    {username.length >= 3 && usernameValidation.message && (
                        <p className={`username-validation-message ${usernameValidation.isAvailable ? 'success' : 'error'}`}>
                            {usernameValidation.message}
                        </p>
                    )}

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
                            placeholder="Parool (vähemalt 6 tähemärki)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="modal-input"
                            disabled={loading}
                            autoComplete="new-password"
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
                    {password && (
                        <div className="password-strength">
                            <div className="password-strength-bar">
                                <div
                                    className="password-strength-fill"
                                    style={{
                                        width: `${(passwordStrength / 5) * 100}%`,
                                        backgroundColor: getPasswordStrengthColor()
                                    }}
                                />
                            </div>
                            <span
                                className="password-strength-text"
                                style={{ color: getPasswordStrengthColor() }}
                            >
                                {getPasswordStrengthText()}
                            </span>
                        </div>
                    )}
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Kinnita parool"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="modal-input"
                        disabled={loading}
                        autoComplete="new-password"
                    />
                    {error && <p className="modal-error">{error}</p>}
                    <button
                        type="submit"
                        className="modal-button"
                        disabled={
                            loading ||
                            !email ||
                            !password ||
                            !username ||
                            !confirmPassword ||
                            !usernameValidation.isAvailable ||
                            usernameValidation.isChecking
                        }
                    >
                        {loading ? 'Registreerin...' : 'Loo konto'}
                    </button>
                </form>
            </div>
        </div>
    );
};