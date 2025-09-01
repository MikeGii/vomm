// app/pages/BankPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TransactionForm } from '../components/bank/TransactionForm';
import { TransactionList } from '../components/bank/TransactionList';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { getPlayerTransactions } from '../services/BankService';
import { PollConverter} from "../components/bank/PollConverter";
import { BankTransaction } from '../types';
import { formatMoney } from '../utils/currencyUtils';
import '../styles/pages/Bank.css';

const BankPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading } = usePlayerStats(); // CHANGED: Using context
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(true);

    // Load transactions
    const loadTransactions = useCallback(async () => {
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
    }, [currentUser]);

    useEffect(() => {
        loadTransactions();
    }, [currentUser, loadTransactions]);

    // Handle transaction completion
    const handleTransactionComplete = () => {
        loadTransactions(); // Reload transactions after successful transaction
        // Player stats will auto-update through context
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
                            <span className="balance-amount">{formatMoney(playerStats.money || 0)}</span>
                        </div>
                        <div className="balance-info polls">
                            <span className="balance-label">Pollid:</span>
                            <span className="balance-amount">{playerStats.pollid || 0}</span>
                        </div>
                    </div>
                </div>

                {currentUser && (
                    <>
                        <PollConverter
                            currentUserId={currentUser.uid}
                            playerPollid={playerStats.pollid || 0}
                            playerMoney={playerStats.money || 0}
                            onConversionComplete={() => {
                            loadTransactions();
                        }}
                        />

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