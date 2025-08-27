// src/components/settings/AccountDeletion.tsx
import React, { useState } from 'react';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { firestore } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/settings/AccountDeletion.css';

export const AccountDeletion: React.FC = () => {
    const { currentUser, userData } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [password, setPassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [step, setStep] = useState<'warning' | 'confirm' | 'password'>('warning');

    const requiredConfirmationText = 'KUSTUTA KONTO';

    const handleStartDeletion = () => {
        setShowConfirmation(true);
        setStep('confirm');
    };

    const handleConfirmDeletion = () => {
        if (confirmationText !== requiredConfirmationText) {
            showToast('Sisesta täpselt: ' + requiredConfirmationText, 'error');
            return;
        }
        setStep('password');
    };

    const deleteUserData = async (userId: string) => {
        const batch = writeBatch(firestore);

        try {
            // Delete from users collection
            batch.delete(doc(firestore, 'users', userId));

            // Delete from playerStats collection
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
            console.error('Error deleting user data:', error);
            throw new Error('Viga andmete kustutamisel andmebaasist');
        }
    };

    const handleFinalDeletion = async () => {
        if (!currentUser || !password.trim()) {
            showToast('Sisesta oma praegune parool', 'error');
            return;
        }

        setIsDeleting(true);

        try {
            // Re-authenticate user before deletion (required by Firebase)
            const credential = EmailAuthProvider.credential(currentUser.email!, password);
            await reauthenticateWithCredential(currentUser, credential);

            // Delete all user data from Firestore
            await deleteUserData(currentUser.uid);

            // Delete the Firebase Auth account
            await deleteUser(currentUser);

            showToast('Konto edukalt kustutatud. Head aega!', 'success');

            // Redirect to home page after 2 seconds
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);

        } catch (error: any) {
            console.error('Account deletion error:', error);

            if (error.code === 'auth/wrong-password') {
                showToast('Vale parool. Proovi uuesti.', 'error');
            } else if (error.code === 'auth/requires-recent-login') {
                showToast('Turvalisuse huvides logi välja ja uuesti sisse, seejärel proovi uuesti.', 'error');
            } else if (error.code === 'auth/too-many-requests') {
                showToast('Liiga palju katseid. Oota mõni minut ja proovi uuesti.', 'error');
            } else {
                showToast(`Viga konto kustutamisel: ${error.message}`, 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const resetDeletion = () => {
        setShowConfirmation(false);
        setConfirmationText('');
        setPassword('');
        setStep('warning');
    };

    if (!showConfirmation) {
        return (
            <div className="account-deletion">

                <div className="warning-section">
                    <div className="warning-box">
                        <h3 className="warning-title">Konto kustutamine</h3>
                        <p className="warning-text">
                            See tegevus kustutab <strong>JÄÄDAVALT</strong> kogu sinu konto ja andmed:
                        </p>
                        <ul className="deletion-list">
                            <li>• Kasutajakonto ja privaatsed andmed</li>
                            <li>• Mängija statistika ja saavutused</li>
                            <li>• Kõik töö ajalugu ja maine punktid</li>
                            <li>• Pangakonto ja tehingud</li>
                            <li>• Avaldused ja ametikoht</li>
                            <li>• Inventaar ja varustus</li>
                        </ul>
                        <p className="warning-emphasis">
                            <strong>HOIATUS:</strong> Seda tegevust ei saa tagasi võtta!
                            Kõik andmed kustutatakse jäädavalt ja neid ei saa taastada.
                        </p>
                    </div>

                    <button
                        onClick={handleStartDeletion}
                        className="btn-danger"
                    >
                        Soovin siiski konto kustutada
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="account-deletion">
            <h2 className="deletion-title">🗑️ Konto kustutamine</h2>

            {step === 'confirm' && (
                <div className="confirmation-section">
                    <div className="confirmation-box">
                        <h3 className="confirmation-title">Kinnitamine</h3>
                        <p className="confirmation-text">
                            Kirjuta täpselt <strong>{requiredConfirmationText}</strong> kinnitamiseks:
                        </p>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder={requiredConfirmationText}
                            className="confirmation-input"
                            autoComplete="off"
                        />
                        <div className="confirmation-buttons">
                            <button
                                onClick={handleConfirmDeletion}
                                disabled={confirmationText !== requiredConfirmationText}
                                className="btn-danger"
                            >
                                Jätka
                            </button>
                            <button
                                onClick={resetDeletion}
                                className="btn-cancel"
                            >
                                Tühista
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'password' && (
                <div className="password-section">
                    <div className="password-box">
                        <h3 className="password-title">Viimane samm</h3>
                        <p className="password-text">
                            Sisesta oma praegune parool konto kustutamise kinnitamiseks:
                        </p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sisesta praegune parool"
                            className="password-input"
                        />
                        <div className="final-warning">
                            <p className="final-warning-text">
                                ❌ See kustutab konto JÄÄDAVALT. Pole tagasiteed!
                            </p>
                        </div>
                        <div className="final-buttons">
                            <button
                                onClick={handleFinalDeletion}
                                disabled={!password.trim() || isDeleting}
                                className="btn-final-delete"
                            >
                                {isDeleting ? 'Kustutan...' : 'KUSTUTA KONTO JÄÄDAVALT'}
                            </button>
                            <button
                                onClick={resetDeletion}
                                className="btn-cancel"
                                disabled={isDeleting}
                            >
                                Tühista
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};