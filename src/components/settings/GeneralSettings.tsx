// src/components/settings/GeneralSettings.tsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc,collection, query, where, getDocs, writeBatch} from 'firebase/firestore';
import { verifyBeforeUpdateEmail } from 'firebase/auth';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { validateUsername } from '../../services/UserValidationService';
import '../../styles/components/settings/GeneralSettings.css';

export const GeneralSettings: React.FC = () => {
    const { currentUser, userData } = useAuth();
    const { showToast } = useToast();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [usernameValidation, setUsernameValidation] = useState({
        isValid: true,
        message: ''
    });

    // Progress reset states
    const [showProgressReset, setShowProgressReset] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const requiredResetText = 'RESET PROGRESS';

    // Load current user data
    useEffect(() => {
        if (userData) {
            setUsername(userData.username || '');
        }
        if (currentUser) {
            setEmail(currentUser.email || '');
        }
    }, [userData, currentUser]);

    const handleUsernameChange = async (newUsername: string) => {
        setUsername(newUsername);

        if (newUsername === userData?.username) {
            setUsernameValidation({ isValid: true, message: '' });
            return;
        }

        if (newUsername.length < 3) {
            setUsernameValidation({
                isValid: false,
                message: 'Kasutajanimi peab olema vähemalt 3 tähemärki pikk'
            });
            return;
        }

        // Validate username
        const validation = await validateUsername(newUsername);
        setUsernameValidation({
            isValid: validation.isValid && validation.isAvailable,
            message: validation.message
        });
    };

    const handleSaveUsername = async () => {
        if (!currentUser || !usernameValidation.isValid) return;

        setIsLoading(true);
        try {
            // Update both users table and playerStats table
            const updates = [
                // Update users table
                updateDoc(doc(firestore, 'users', currentUser.uid), {
                    username: username,
                    usernameLower: username.toLowerCase()
                }),

                // Update playerStats table
                updateDoc(doc(firestore, 'playerStats', currentUser.uid), {
                    username: username
                })
            ];

            // Execute both updates
            await Promise.all(updates);

            showToast('Kasutajanimi edukalt uuendatud kõikjal!', 'success');
            setIsEditingUsername(false);
        } catch (error: any) {
            // If one fails, both might be inconsistent, but we still show success for partial update
            if (error.message.includes('playerStats')) {
                showToast('Kasutajanimi uuendatud osaliselt. Proovi hiljem uuesti.', 'warning');
            } else {
                showToast('Viga kasutajanime uuendamisel: ' + error.message, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!currentUser || !email.trim()) return;

        // Check if email is actually different
        if (email === currentUser.email) {
            showToast('Uus e-posti aadress on sama mis praegune', 'warning');
            setIsEditingEmail(false);
            return;
        }

        setIsLoading(true);
        try {
            // Use verifyBeforeUpdateEmail - this sends verification email to NEW address
            await verifyBeforeUpdateEmail(currentUser, email);

            showToast(
                `Kinnituslink on saadetud aadressile ${email}. Ava link ja seejärel värskenda lehte.`,
                'info',
                8000 // Show longer
            );

            setIsEditingEmail(false);
        } catch (error: any) {
            console.error('Email update error:', error);

            if (error.code === 'auth/requires-recent-login') {
                showToast('Turvalisuse huvides pead uuesti sisse logima enne e-posti muutmist. Logi välja ja uuesti sisse.', 'warning');
            } else if (error.code === 'auth/invalid-email') {
                showToast('Sisestatud e-posti aadress on vigane', 'error');
            } else if (error.code === 'auth/email-already-in-use') {
                showToast('See e-posti aadress on juba teise kasutaja poolt kasutusel', 'error');
            } else if (error.code === 'auth/operation-not-allowed') {
                showToast('E-posti muutmine pole lubatud. Võta ühendust administraatoriga.', 'error');
            } else if (error.code === 'auth/too-many-requests') {
                showToast('Liiga palju katseid. Oota mõni minut ja proovi uuesti.', 'error');
            } else {
                showToast(`Viga e-posti kinnituslingi saatmisel: ${error.message}`, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetPlayerProgress = async (userId: string) => {
        const batch = writeBatch(firestore);

        try {
            // Simply delete the playerStats document - it will be recreated with defaults on next login
            batch.delete(doc(firestore, 'playerStats', userId));

            // Delete from activeWork collection if exists
            const activeWorkQuery = query(
                collection(firestore, 'activeWork'),
                where('userId', '==', userId)
            );
            const activeWorkSnapshot = await getDocs(activeWorkQuery);
            activeWorkSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete from applications collection if exists
            const applicationsQuery = query(
                collection(firestore, 'applications'),
                where('applicantId', '==', userData?.username || userId)
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);
            applicationsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete from workHistory collection if exists
            const workHistoryQuery = query(
                collection(firestore, 'workHistory'),
                where('userId', '==', userId)
            );
            const workHistorySnapshot = await getDocs(workHistoryQuery);
            workHistorySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete from bankTransactions collection if exists
            const bankTransactionsQuery = query(
                collection(firestore, 'bankTransactions'),
                where('fromUserId', '==', userId)
            );
            const bankTransactionsSnapshot = await getDocs(bankTransactionsQuery);
            bankTransactionsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            const bankTransactionsQuery2 = query(
                collection(firestore, 'bankTransactions'),
                where('toUserId', '==', userId)
            );
            const bankTransactionsSnapshot2 = await getDocs(bankTransactionsQuery2);
            bankTransactionsSnapshot2.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Commit all deletions
            await batch.commit();

        } catch (error) {
            console.error('Error resetting player progress:', error);
            throw new Error('Viga mängija andmete lähtestamisel');
        }
    };

    const handleProgressReset = async () => {
        if (!currentUser || confirmationText !== requiredResetText) {
            showToast('Sisesta täpselt: ' + requiredResetText, 'error');
            return;
        }

        setIsResetting(true);

        try {
            // Reset all player progress
            await resetPlayerProgress(currentUser.uid);

            showToast('Mängija progress edukalt lähtestatud! Lehekülg laadib uuesti...', 'success');

            // Reload the page after 2 seconds to refresh all contexts
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error: any) {
            console.error('Progress reset error:', error);
            showToast(`Viga progressi lähtestamisel: ${error.message}`, 'error');
        } finally {
            setIsResetting(false);
        }
    };

    const cancelProgressReset = () => {
        setShowProgressReset(false);
        setConfirmationText('');
    };

    return (
        <div className="general-settings">
            <h2 className="settings-section-title">Kasutaja andmed</h2>

            <div className="settings-form">
                {/* Username Section */}
                <div className="form-group">
                    <label className="form-label">Kasutajanimi</label>
                    {isEditingUsername ? (
                        <div className="edit-field">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => handleUsernameChange(e.target.value)}
                                className={`form-input ${!usernameValidation.isValid ? 'error' : ''}`}
                                placeholder="Sisesta kasutajanimi"
                            />
                            {usernameValidation.message && (
                                <p className={`validation-message ${usernameValidation.isValid ? 'success' : 'error'}`}>
                                    {usernameValidation.message}
                                </p>
                            )}
                            <div className="edit-buttons">
                                <button
                                    onClick={handleSaveUsername}
                                    disabled={!usernameValidation.isValid || isLoading}
                                    className="btn-save"
                                >
                                    {isLoading ? 'Salvestab...' : 'Salvesta'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingUsername(false);
                                        setUsername(userData?.username || '');
                                        setUsernameValidation({ isValid: true, message: '' });
                                    }}
                                    className="btn-cancel"
                                    disabled={isLoading}
                                >
                                    Tühista
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="display-field">
                            <span className="current-value">{userData?.username || 'Laadin...'}</span>
                            <button
                                onClick={() => setIsEditingUsername(true)}
                                className="btn-edit"
                            >
                                Muuda
                            </button>
                        </div>
                    )}
                </div>

                {/* Email Section */}
                <div className="form-group">
                    <label className="form-label">E-posti aadress</label>
                    {isEditingEmail ? (
                        <div className="edit-field">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="Sisesta e-posti aadress"
                            />
                            <div className="email-warning">
                                <p className="warning-text">
                                    📧 Uuele aadressile saadetakse kinnituslink. E-post muutub alles pärast kinnitamist.
                                </p>
                            </div>
                            <div className="edit-buttons">
                                <button
                                    onClick={handleSaveEmail}
                                    disabled={!email.trim() || email === currentUser?.email || isLoading}
                                    className="btn-save"
                                >
                                    {isLoading ? 'Saadan linki...' : 'Saada kinnituslink'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingEmail(false);
                                        setEmail(currentUser?.email || '');
                                    }}
                                    className="btn-cancel"
                                    disabled={isLoading}
                                >
                                    Tühista
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="display-field">
                            <span className="current-value">
                                {currentUser?.email || 'Laadin...'}
                                {!currentUser?.emailVerified && (
                                    <span className="unverified-badge">Kinnitamata</span>
                                )}
                            </span>
                            <button
                                onClick={() => setIsEditingEmail(true)}
                                className="btn-edit"
                            >
                                Muuda
                            </button>
                        </div>
                    )}
                </div>



                {/* Info section explaining what gets updated */}
                <div className="info-section">
                    <h3 className="info-title">📋 Oluline teada:</h3>
                    <ul className="info-list">
                        <li>
                            <strong>Kasutajanimi:</strong> Muutub kohe kõikjal rakenduses (edetabeli, profiilid, võitlusklubi, jne.)
                        </li>
                        <li>
                            <strong>E-post:</strong> Kinnituslink saadetakse UUELE aadressile. Ava link e-postis ja seejärel värskenda lehte.
                        </li>
                        <li>
                            <strong>Turvalisus:</strong> E-posti muutmiseks võib olla vaja uuesti sisse logida.
                        </li>
                        <li>
                            <strong>Märkus:</strong> E-post muutub alles pärast uue aadressi kinnitamist.
                        </li>
                        <li>
                            <strong>Progressi lähtestamine:</strong> Säilitab konto, kuid kustutab kogu mänguprogress jäädavalt.
                        </li>
                    </ul>
                </div>

                {/* Progress Reset Section */}
                <div className="progress-reset-section">
                    <div className="form-group reset-group">
                        <label className="form-label reset-label">🔄 Mängija progressi lähtestamine</label>

                        {!showProgressReset ? (
                            <div className="reset-warning-box">
                                <div className="reset-warning-content">
                                    <h4 className="reset-warning-title">Mida see teeb?</h4>
                                    <p className="reset-warning-text">
                                        Lähtestab kogu mängija progressi, kuid <strong>säilitab kasutajakonto</strong>:
                                    </p>
                                    <ul className="reset-list">
                                        <li>✅ <strong>Säilitatakse:</strong> Kasutajanimi ja e-post</li>
                                        <li>❌ <strong>Lähtestatakse:</strong> Tase, kogemus, maine, raha</li>
                                        <li>❌ <strong>Lähtestatakse:</strong> Kõik omadused/oskused tasemele 1</li>
                                        <li>❌ <strong>Kustutatakse:</strong> Inventaar, varustus, ametikoht</li>
                                        <li>❌ <strong>Kustutatakse:</strong> Töö ajalugu, tehingud, avaldused</li>
                                        <li>❌ <strong>Kustutatakse:</strong> Võitlusklubi statistika</li>
                                    </ul>
                                    <p className="reset-emphasis">
                                        <strong>See on pöördumatu tegevus!</strong> Kõik mängus saavutatu kustutatakse.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowProgressReset(true)}
                                    className="btn-reset-start"
                                >
                                    Soovin progressi lähtestada
                                </button>
                            </div>
                        ) : (
                            <div className="reset-confirmation-box">
                                <h4 className="reset-confirm-title">⚠️ Kinnita lähtestamine</h4>
                                <p className="reset-confirm-text">
                                    Kirjuta täpselt <strong>{requiredResetText}</strong> kinnitamiseks:
                                </p>
                                <input
                                    type="text"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder={requiredResetText}
                                    className="reset-confirmation-input"
                                    autoComplete="off"
                                />
                                <div className="reset-buttons">
                                    <button
                                        onClick={handleProgressReset}
                                        disabled={confirmationText !== requiredResetText || isResetting}
                                        className="btn-reset-confirm"
                                    >
                                        {isResetting ? 'Lähtestan...' : 'LÄHTESTA PROGRESS'}
                                    </button>
                                    <button
                                        onClick={cancelProgressReset}
                                        className="btn-reset-cancel"
                                        disabled={isResetting}
                                    >
                                        Tühista
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};