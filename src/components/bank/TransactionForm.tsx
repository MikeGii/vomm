// src/components/bank/TransactionForm.tsx
import React, { useState } from 'react';
import { searchPlayerByBadgeNumber, processTransaction } from '../../services/BankService';
import { PlayerSearchResult } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/bank/TransactionForm.css';

interface TransactionFormProps {
    currentUserId: string;
    playerMoney: number;
    onTransactionComplete: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
                                                                    currentUserId,
                                                                    playerMoney,
                                                                    onTransactionComplete
                                                                }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        targetBadgeNumber: '',
        amount: '',
        description: ''
    });
    const [targetPlayer, setTargetPlayer] = useState<PlayerSearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBadgeNumberChange = async (badgeNumber: string) => {
        setFormData(prev => ({ ...prev, targetBadgeNumber: badgeNumber }));
        setTargetPlayer(null);

        if (badgeNumber.trim().length > 0) {
            setIsSearching(true);
            const result = await searchPlayerByBadgeNumber(badgeNumber);
            setTargetPlayer(result);
            setIsSearching(false);
        }
    };

    const handleAmountChange = (value: string) => {
        // Only allow integer numbers
        const cleanValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, amount: cleanValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!targetPlayer?.found) {
            showToast('Palun sisesta kehtiv märginumber', 'error');
            return;
        }

        const amount = parseInt(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            showToast('Palun sisesta kehtiv summa', 'error');
            return;
        }

        if (amount > playerMoney) {
            showToast('Sul pole piisavalt raha', 'error');
            return;
        }

        if (!formData.description.trim()) {
            showToast('Palun sisesta tehingu kirjeldus', 'error');
            return;
        }

        setIsProcessing(true);

        const result = await processTransaction(
            currentUserId,
            formData.targetBadgeNumber,
            amount,
            formData.description
        );

        if (result.success) {
            showToast(result.message, 'success');
            setFormData({ targetBadgeNumber: '', amount: '', description: '' });
            setTargetPlayer(null);
            onTransactionComplete();
        } else {
            showToast(result.message, 'error');
        }

        setIsProcessing(false);
    };

    return (
        <div className="transaction-form-container">
            <h2 className="form-title">Saada raha</h2>

            <form onSubmit={handleSubmit} className="transaction-form">
                <div className="form-group">
                    <label className="form-label">
                        Saaja märginumber
                    </label>
                    <input
                        type="text"
                        value={formData.targetBadgeNumber}
                        onChange={(e) => handleBadgeNumberChange(e.target.value)}
                        placeholder="Sisesta märginumber"
                        className="form-input"
                        disabled={isProcessing}
                    />

                    {isSearching && (
                        <div className="search-status searching">
                            Otsin mängijat...
                        </div>
                    )}

                    {targetPlayer && !isSearching && (
                        <div className={`search-status ${targetPlayer.found ? 'found' : 'not-found'}`}>
                            {targetPlayer.found ? (
                                <>
                                    ✓ Leitud: {targetPlayer.username} (#{targetPlayer.badgeNumber})
                                </>
                            ) : (
                                '✗ Märginumbriga mängijat ei leitud'
                            )}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Summa (€)
                    </label>
                    <input
                        type="text"
                        value={formData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0"
                        className="form-input"
                        disabled={isProcessing}
                    />
                    <div className="balance-info">
                        Sinu saldo: {playerMoney}€
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Kirjeldus
                    </label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tehingu kirjeldus"
                        className="form-input"
                        maxLength={100}
                        disabled={isProcessing}
                    />
                </div>

                <button
                    type="submit"
                    className="submit-button"
                    disabled={!targetPlayer?.found || !formData.amount || !formData.description.trim() || isProcessing}
                >
                    {isProcessing ? 'Töötlen...' : 'Saada raha'}
                </button>
            </form>
        </div>
    );
};