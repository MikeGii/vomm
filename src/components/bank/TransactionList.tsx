// src/components/bank/TransactionList.tsx
import React from 'react';
import { BankTransaction } from '../../types';
import '../../styles/components/bank/TransactionList.css';

interface TransactionListProps {
    transactions: BankTransaction[];
    currentUserId: string;
    loading: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
                                                                    transactions,
                                                                    currentUserId,
                                                                    loading
                                                                }) => {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('et-EE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionType = (transaction: BankTransaction): 'incoming' | 'outgoing' => {
        return transaction.toUserId === currentUserId ? 'incoming' : 'outgoing';
    };

    const getOtherPlayerInfo = (transaction: BankTransaction) => {
        const isIncoming = getTransactionType(transaction) === 'incoming';
        return {
            name: isIncoming ? transaction.fromPlayerName : transaction.toPlayerName,
            badgeNumber: isIncoming ? transaction.fromBadgeNumber : transaction.toBadgeNumber
        };
    };

    if (loading) {
        return (
            <div className="transaction-list-container">
                <h2 className="list-title">Tehingute ajalugu</h2>
                <div className="loading">Laadin tehinguid...</div>
            </div>
        );
    }

    return (
        <div className="transaction-list-container">
            <h2 className="list-title">Tehingute ajalugu</h2>

            {transactions.length === 0 ? (
                <div className="no-transactions">
                    Ühtegi tehingut pole veel tehtud
                </div>
            ) : (
                <div className="transactions-table">
                    <div className="table-header">
                        <div className="header-type">Tüüp</div>
                        <div className="header-player">Mängija</div>
                        <div className="header-amount">Summa</div>
                        <div className="header-description">Kirjeldus</div>
                        <div className="header-date">Kuupäev</div>
                    </div>

                    <div className="table-body">
                        {transactions.map((transaction) => {
                            const type = getTransactionType(transaction);
                            const otherPlayer = getOtherPlayerInfo(transaction);

                            return (
                                <div key={transaction.id} className={`transaction-row ${type}`}>
                                    <div className="transaction-type">
                                        {type === 'incoming' ? (
                                            <span className="type-badge incoming">Sisse</span>
                                        ) : (
                                            <span className="type-badge outgoing">Välja</span>
                                        )}
                                    </div>

                                    <div className="transaction-player">
                                        <div className="player-name">{otherPlayer.name}</div>
                                        <div className="player-badge">#{otherPlayer.badgeNumber}</div>
                                    </div>

                                    <div className={`transaction-amount ${type}`}>
                                        {type === 'incoming' ? '+' : '-'}{transaction.amount}€
                                    </div>

                                    <div className="transaction-description">
                                        {transaction.description}
                                    </div>

                                    <div className="transaction-date">
                                        {formatDate(transaction.timestamp)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};