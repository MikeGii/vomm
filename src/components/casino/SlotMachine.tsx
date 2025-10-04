// src/components/casino/SlotMachine.tsx
import React, { useState } from 'react';
import { SlotResult, canPlayerGamble } from '../../services/CasinoService';
import { PlayerStats } from '../../types';
import { formatMoney } from '../../utils/currencyUtils';
import '../../styles/components/casino/SlotMachine.css';

interface SlotMachineProps {
    onPlay: (betAmount: number) => Promise<SlotResult>;
    playerMoney: number;
    playerStats: PlayerStats;
    isPlaying: boolean;
    canPlay: boolean;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({
                                                            onPlay,
                                                            playerMoney,
                                                            playerStats,
                                                            isPlaying,
                                                            canPlay
                                                        }) => {
    const [betAmount, setBetAmount] = useState(10);
    const [lastResult, setLastResult] = useState<SlotResult | null>(null);
    const [spinning, setSpinning] = useState(false);

    const { canGamble, reason } = canPlayerGamble(playerStats);

    const handlePlay = async () => {
        // Add reputation check here
        if (!canGamble) {
            // You can show a toast here if you have access to showToast
            // showToast(reason || 'Sa ei saa mängida.', 'error');
            return;
        }

        if (!canPlay || isPlaying || betAmount > playerMoney) return;

        setSpinning(true);
        setLastResult(null);

        try {
            // Add spinning delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1500));

            const result = await onPlay(betAmount);
            setLastResult(result);
        } catch (error) {
            console.error('Slot machine error:', error);
        } finally {
            setSpinning(false);
        }
    };

    const quickBetAmounts = [50, 100, 250, 500, 1000, 10000, 50000];

// Calculate probabilities - MUCH MORE PLAYER FRIENDLY
    const totalSymbols = 7;

// Three of a kind chances
    const diamondJackpotChance = (1 / (totalSymbols * totalSymbols)) * 100; // ~2.04% - keep rare
    const luckySevenChance = (1 / (totalSymbols * totalSymbols)) * 100; // ~2.04% - keep rare
    const bellThreeChance = (1 / (totalSymbols * totalSymbols)) * 100; // ~2.04%
    const fruitThreeChance = (4 / (totalSymbols * totalSymbols)) * 100; // ~8.16% (4 fruit symbols)

// Two of a kind
    const twoOfAKindChance = 90; // 90% when you get two matching (4x original!)
    const twoOfAKindBaseChance = ((3 * (totalSymbols - 1)) / (totalSymbols * totalSymbols)) * 100;
    const actualTwoOfAKindWinChance = (twoOfAKindBaseChance * twoOfAKindChance) / 100;

// Total winning chance
    const totalThreeOfAKindChance = diamondJackpotChance + luckySevenChance + bellThreeChance + fruitThreeChance;
    const totalWinChance = totalThreeOfAKindChance + actualTwoOfAKindWinChance;

    return (
        <div className="slot-machine">
            <div className="slot-machine-header">
                <h3>🎰 Slotiautomaadi mäng</h3>
                <div className="player-money">Sinu raha: {formatMoney(playerMoney)}</div>
            </div>

            {!canGamble && (
                <div className="reputation-blocked">
                    <div className="blocked-message">
                        <h4>❌ Mäng blokeeritud</h4>
                        <p>{reason}</p>
                        <p>Sinu praegune maine: <span className="negative-reputation">{playerStats.reputation}</span></p>
                    </div>
                </div>
            )}

            <div className="slot-display">
                <div className="slot-reels">
                    {spinning ? (
                        <>
                            <div className="slot-reel spinning">🎲</div>
                            <div className="slot-reel spinning">🎲</div>
                            <div className="slot-reel spinning">🎲</div>
                        </>
                    ) : lastResult ? (
                        lastResult.symbols.map((symbol, index) => (
                            <div key={index} className="slot-reel">{symbol}</div>
                        ))
                    ) : (
                        <>
                            <div className="slot-reel">❓</div>
                            <div className="slot-reel">❓</div>
                            <div className="slot-reel">❓</div>
                        </>
                    )}
                </div>

                {lastResult && !spinning && (
                    <div className={`result-display ${lastResult.isWin ? 'win' : 'lose'}`}>
                        {lastResult.isWin ? (
                            <div className="win-message">
                                🎉 Võitsid {formatMoney(lastResult.winAmount)}!
                                <small>(x{lastResult.multiplier})</small>
                            </div>
                        ) : (
                            <div className="lose-message">
                                😞 Kaotasid {formatMoney(betAmount)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="betting-section">
                <div className="bet-input-section">
                    <label htmlFor="betAmount">Panus:</label>
                    <input
                        id="betAmount"
                        type="number"
                        min="1"
                        max={playerMoney}
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={spinning || isPlaying}
                    />
                    <span>€</span>
                </div>

                <div className="quick-bets">
                    {quickBetAmounts.map(amount => (
                        <button
                            key={amount}
                            className={`quick-bet ${betAmount === amount ? 'active' : ''}`}
                            onClick={() => setBetAmount(amount)}
                            disabled={spinning || isPlaying || amount > playerMoney}
                        >
                            {formatMoney(amount)}
                        </button>
                    ))}
                </div>

                <button
                    className={`play-button ${!canPlay || betAmount > playerMoney ? 'disabled' : ''}`}
                    onClick={handlePlay}
                    disabled={!canPlay || spinning || isPlaying || betAmount > playerMoney}
                >
                    {spinning ? 'Mängin...' : `Mängi ${formatMoney(betAmount)} eest`}
                </button>
            </div>

            <div className="game-info">
                <div className="payout-info">
                    <h4>Võitmise tabel ja tõenäosused:</h4>
                    <div className="payout-list">
                        <div className="payout-item jackpot">
                            <span className="combination">💎💎💎</span>
                            <span className="multiplier">x10</span>
                            <span className="probability">{diamondJackpotChance.toFixed(2)}%</span>
                        </div>
                        <div className="payout-item high">
                            <span className="combination">7️⃣7️⃣7️⃣</span>
                            <span className="multiplier">x5</span>
                            <span className="probability">{luckySevenChance.toFixed(2)}%</span>
                        </div>
                        <div className="payout-item medium">
                            <span className="combination">🔔🔔🔔</span>
                            <span className="multiplier">x3</span>
                            <span className="probability">{bellThreeChance.toFixed(2)}%</span>
                        </div>
                        <div className="payout-item low">
                            <span className="combination">🍒🍒🍒</span>
                            <span className="multiplier">x2</span>
                            <span className="probability">{fruitThreeChance.toFixed(2)}%</span>
                        </div>
                        <div className="payout-item bonus">
                            <span className="combination">Kaks ühesugust</span>
                            <span className="multiplier">x1.2</span>
                            <span className="probability">{actualTwoOfAKindWinChance.toFixed(2)}%</span>
                        </div>
                    </div>

                    <div className="total-win-chance">
                        <strong>
                            Kogu võitmise tõenäosus: ~{totalWinChance.toFixed(1)}%
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
};