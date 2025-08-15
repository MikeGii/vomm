// src/components/patrol/WorkHistory.tsx
import React from 'react';
import { WorkHistoryEntry } from '../../types';
import '../../styles/components/patrol/WorkHistory.css';

interface WorkHistoryProps {
    history: WorkHistoryEntry[];
}

export const WorkHistory: React.FC<WorkHistoryProps> = ({ history }) => {
    const formatDate = (date: Date | any): string => {
        if (!date) return 'Teadmata';

        const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
        return d.toLocaleDateString('et-EE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="work-history">
            <h3>Tööajalugu</h3>

            {history.length === 0 ? (
                <p className="no-history">Tööajalugu puudub</p>
            ) : (
                <div className="history-table">
                    <table>
                        <thead>
                        <tr>
                            <th>Kuupäev</th>
                            <th>Prefektuur</th>
                            <th>Piirkond</th>
                            <th>Tegevus</th>
                            <th>Tunnid</th>
                            <th>Tasu</th>
                        </tr>
                        </thead>
                        <tbody>
                        {history.map((entry, index) => (
                            <tr key={entry.id || index}>
                                <td>{formatDate(entry.completedAt)}</td>
                                <td>{entry.prefecture}</td>
                                <td>{entry.department}</td>
                                <td>{entry.workName}</td>
                                <td>{entry.hoursWorked}h</td>
                                <td className="exp-earned">+{entry.expEarned} XP</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};