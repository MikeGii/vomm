import React from 'react';
import { MONTHLY_TOP_PLAYERS } from '../../data/monthlyTopPlayers';
import '../../styles/components/vip/MonthlyTopPlayers.css';

export const MonthlyTopPlayers: React.FC = () => {
    const medalEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' };

    // Get the two most recent months
    const recentMonths = MONTHLY_TOP_PLAYERS.slice(0, 3);

    if (recentMonths.length === 0) {
        return (
            <div className="monthly-top-players">
                <div className="monthly-top-header">
                    <h3>🏆 Kuu Parimad Mängijad</h3>
                </div>
                <div className="no-data">
                    Kuu parimaid mängijaid pole veel lisatud.
                </div>
            </div>
        );
    }

    return (
        <div className="monthly-top-players">
            <div className="monthly-top-header">
                <h3>🏆 Kuu Parimad Mängijad</h3>
            </div>

            <div className="monthly-top-content">
                {recentMonths.map((monthData, index) => (
                    <div key={`${monthData.year}-${monthData.month}`} className="monthly-top-section">
                        <h4>{monthData.month} {monthData.year}</h4>
                        <div className="monthly-top-list">
                            {monthData.winners.map(winner => (
                                <div
                                    key={winner.position}
                                    className={`monthly-player position-${winner.position}`}
                                >
                                    <span className="player-medal">
                                        {medalEmojis[winner.position]}
                                    </span>
                                    <span className="player-name">{winner.username}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};