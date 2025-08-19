// app/pages/BankPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TransactionForm } from '../components/bank/TransactionForm';
import { TransactionList } from '../components/bank/TransactionList';
import { useAuth } from '../contexts/AuthContext';
import { getPlayerTransactions } from '../services/BankService';
import { PlayerStats, BankTransaction } from '../types';
import '../styles/pages/Bank.css';

const BankPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(true);

    // Load player stats
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(
            doc(firestore, 'playerStats', currentUser.uid),
            (doc) => {
                if (doc.exists()) {
                    setPlayerStats(doc.data() as PlayerStats);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error loading player stats:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Load transactions
    const loadTransactions = async () => {
        if (!currentUser) return;

        setTransactionsLoading(true);
        try {
            const playerTransactions = await getPlayerTransactions(currentUser.uid);
            setTransactions(playerTransactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, [currentUser]);

    // Handle transaction completion
    const handleTransactionComplete = () => {
        loadTransactions(); // Reload transactions after successful transaction
    };

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="bank-container">
                    <div className="loading">Laadin panga andmeid...</div>
                </main>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="bank-container">
                    <div className="error">Viga andmete laadimisel</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="bank-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <div className="bank-header">
                    <h1 className="bank-title">Pank</h1>
                    <div className="bank-info">
                        <div className="account-info">
                            <span className="account-label">Sinu kontonumber:</span>
                            <span className="account-number">#{playerStats.badgeNumber || 'Määramata'}</span>
                        </div>
                        <div className="balance-info">
                            <span className="balance-label">Saldo:</span>
                            <span className="balance-amount">{playerStats.money || 0}€</span>
                        </div>
                    </div>
                </div>

                {currentUser && (
                    <>
                        <TransactionForm
                            currentUserId={currentUser.uid}
                            playerMoney={playerStats.money || 0}
                            onTransactionComplete={handleTransactionComplete}
                        />

                        <TransactionList
                            transactions={transactions}
                            currentUserId={currentUser.uid}
                            loading={transactionsLoading}
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default BankPage;