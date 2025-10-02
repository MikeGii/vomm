import React, { useState } from 'react';
import { doc, runTransaction, Timestamp, collection } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useToast } from '../../contexts/ToastContext';
import { formatMoney } from '../../utils/currencyUtils';
import '../../styles/components/bank/PollConverter.css';
import { GlobalUserService } from '../../services/GlobalUserService';
import {getCurrentServer, getServerSpecificId} from "../../utils/serverUtils";

interface PollConverterProps {
    currentUserId: string;
    playerPollid: number;
    playerMoney: number;
    onConversionComplete: () => void;
}

export const PollConverter: React.FC<PollConverterProps> = ({
                                                                currentUserId,
                                                                playerPollid,
                                                                playerMoney,
                                                                onConversionComplete
                                                            }) => {
    const { showToast } = useToast();
    const [pollAmount, setPollAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const CONVERSION_RATE = 500;

    const handleAmountChange = (value: string) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        setPollAmount(cleanValue);
    };

    const calculateMoneyReceived = (): number => {
        const polls = parseInt(pollAmount) || 0;
        return polls * CONVERSION_RATE;
    };

    const handleConversion = async () => {
        // Prevent double clicks
        if (isProcessing) return;

        const pollsToConvert = parseInt(pollAmount);

        if (isNaN(pollsToConvert) || pollsToConvert <= 0) {
            showToast('Sisesta kehtiv kogus', 'error');
            return;
        }

        if (pollsToConvert > playerPollid) {
            showToast(`Sul pole piisavalt polle! Sul on ${playerPollid} polli`, 'error');
            return;
        }

        setIsProcessing(true);

        try {
            const moneyToAdd = pollsToConvert * CONVERSION_RATE;

            // Use a transaction to ensure atomic updates
            await runTransaction(firestore, async (transaction) => {
                // Get player stats for money (server-specific)
                const serverSpecificId = getServerSpecificId(currentUserId, getCurrentServer());
                const playerRef = doc(firestore, 'playerStats', serverSpecificId);
                const playerDoc = await transaction.get(playerRef);

                if (!playerDoc.exists()) {
                    throw new Error('Mängija andmeid ei leitud');
                }

                // Get global user data for pollid
                const userRef = doc(firestore, 'users', currentUserId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error('Kasutaja andmeid ei leitud');
                }

                const currentMoney = playerDoc.data().money || 0;
                const currentPollid = userDoc.data().pollid || 0;

                // Double-check we have enough polls
                if (currentPollid < pollsToConvert) {
                    throw new Error('Ebapiisav pollide arv');
                }

                // Update pollid in users collection (global)
                transaction.update(userRef, {
                    pollid: currentPollid - pollsToConvert
                });

                // Update money in playerStats (server-specific)
                transaction.update(playerRef, {
                    money: currentMoney + moneyToAdd,
                    lastModified: Timestamp.now()
                });

                // Create transaction log (use server-specific IDs)
                const logRef = doc(collection(firestore, 'bankTransactions'));
                transaction.set(logRef, {
                    fromUserId: serverSpecificId,
                    toUserId: serverSpecificId,
                    type: 'poll_conversion',
                    pollsConverted: pollsToConvert,
                    amount: moneyToAdd,
                    description: `Vahetatud ${pollsToConvert} polli raha vastu`,
                    timestamp: Timestamp.now()
                });
            });

            showToast(`Vahetasid ${pollsToConvert} polli ${formatMoney(moneyToAdd)} vastu!`, 'success');
            setPollAmount('');

            // Call the callback AFTER transaction completes
            if (onConversionComplete) {
                onConversionComplete();
            }

        } catch (error: any) {
            console.error('Error converting polls:', error);
            showToast(error.message || 'Viga pollide vahetamisel', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMaxClick = () => {
        setPollAmount(playerPollid.toString());
    };

    return (
        <div className="poll-converter-container">
            <h2 className="converter-title">💰 Vaheta Polle Raha Vastu</h2>

            <div className="converter-info">
                <div className="info-row">
                    <span className="info-label">Vahetuskurss:</span>
                    <span className="info-value">1 poll = {formatMoney(CONVERSION_RATE)}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Sinu pollid:</span>
                    <span className="info-value highlight">{playerPollid}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Praegune raha:</span>
                    <span className="info-value">{formatMoney(playerMoney)}</span>
                </div>
            </div>

            <div className="converter-form">
                <div className="form-group">
                    <label className="form-label">Pollide kogus</label>
                    <div className="input-with-max">
                        <input
                            type="text"
                            value={pollAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="0"
                            className="form-input"
                            disabled={isProcessing}
                        />
                        <button
                            className="max-button"
                            onClick={handleMaxClick}
                            disabled={isProcessing || playerPollid === 0}
                            type="button"
                        >
                            MAX
                        </button>
                    </div>
                </div>

                {pollAmount && parseInt(pollAmount) > 0 && (
                    <div className="conversion-preview">
                        <span className="preview-label">Saad raha:</span>
                        <span className="preview-amount">{formatMoney(calculateMoneyReceived())}</span>
                    </div>
                )}

                <button
                    className="convert-button"
                    onClick={handleConversion}
                    disabled={!pollAmount || parseInt(pollAmount) <= 0 || isProcessing || playerPollid === 0}
                    type="button"
                >
                    {isProcessing ? 'Vahetan...' : 'Vaheta'}
                </button>
            </div>
        </div>
    );
};