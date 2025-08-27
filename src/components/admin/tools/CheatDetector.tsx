// src/components/admin/tools/CheatDetector.tsx
import React, { useState, useEffect } from 'react';
import {
    detectTimeManipulation,
    getRecentCheatLogs,
    CheatDetectionResults,
    CheatLogEntry,
    getSeverityColor,
    getSeverityIcon
} from '../../../services/AdminCheatDetectionService';

export const CheatDetector: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<CheatDetectionResults | null>(null);
    const [recentLogs, setRecentLogs] = useState<CheatLogEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'scan' | 'logs'>('scan');
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    const handleScan = async () => {
        setIsScanning(true);
        setResults(null);

        try {
            const scanResults = await detectTimeManipulation();
            setResults(scanResults);
        } catch (error: any) {
            console.error('Cheat detection failed:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const loadRecentLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const logs = await getRecentCheatLogs(100);
            setRecentLogs(logs);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            loadRecentLogs();
        }
    }, [activeTab]);

    const formatDate = (date: Date) => {
        return date.toLocaleString('et-EE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours < 24) return `${hours}h ${mins}min`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    };

    return (
        <div className="admin-tool cheat-detector">
            <div className="tool-content">
                <div className="cheat-detector-header">
                    <h4>Aja Manipulatsiooni Detektor</h4>
                    <p className="tool-description">
                        Tuvastab kahtlaseid toiminguid ja kella muutmist
                    </p>
                </div>

                <div className="detector-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scan')}
                    >
                        Uus Skaneerimine
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        Logide Ajalugu
                    </button>
                </div>

                {activeTab === 'scan' && (
                    <div className="scan-tab">
                        <button
                            className="admin-btn admin-btn-danger scan-btn"
                            onClick={handleScan}
                            disabled={isScanning}
                        >
                            {isScanning ? 'Skaneerib...' : 'Alusta Skaneerimist'}
                        </button>

                        {results && (
                            <div className="scan-results">
                                <div className="results-overview">
                                    <div className="overview-card">
                                        <div className="card-icon">👥</div>
                                        <div className="card-content">
                                            <div className="card-number">{results.playersChecked}</div>
                                            <div className="card-label">Kontrollitud</div>
                                        </div>
                                    </div>

                                    <div className="overview-card">
                                        <div className="card-icon">🚨</div>
                                        <div className="card-content">
                                            <div className="card-number">{results.totalSuspiciousCount}</div>
                                            <div className="card-label">Kahtlaseid</div>
                                        </div>
                                    </div>

                                    <div className="overview-card critical">
                                        <div className="card-icon">⚠️</div>
                                        <div className="card-content">
                                            <div className="card-number">{results.severityCounts.critical + results.severityCounts.high}</div>
                                            <div className="card-label">Kõrge Risk</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="severity-breakdown">
                                    <h5>Riskitasemed</h5>
                                    <div className="severity-grid">
                                        {Object.entries(results.severityCounts).map(([severity, count]) => (
                                            <div
                                                key={severity}
                                                className="severity-item"
                                                style={{ borderLeft: `4px solid ${getSeverityColor(severity)}` }}
                                            >
                                                <span className="severity-icon">{getSeverityIcon(severity)}</span>
                                                <span className="severity-label">{severity.toUpperCase()}</span>
                                                <span className="severity-count">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {results.topOffenders.length > 0 && (
                                    <div className="top-offenders">
                                        <h5>Sagedasemad Rikkujad</h5>
                                        <div className="offenders-list">
                                            {results.topOffenders.map((offender, index) => (
                                                <div key={offender.userId} className="offender-item">
                                                    <div className="offender-rank">#{index + 1}</div>
                                                    <div className="offender-info">
                                                        <div className="offender-name">{offender.username}</div>
                                                        <div className="offender-stats">
                                                            {offender.violationCount} rikkumine(t) •
                                                            <span
                                                                className="max-severity"
                                                                style={{ color: getSeverityColor(offender.maxSeverity) }}
                                                            >
                                                                {offender.maxSeverity.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.suspiciousActivities.length > 0 && (
                                    <div className="detailed-results">
                                        <h5>Detailsed Tulemused</h5>
                                        <div className="activities-list">
                                            {results.suspiciousActivities.slice(0, 10).map((activity, index) => (
                                                <div key={index} className="activity-card">
                                                    <div className="activity-header">
                                                        <div className="activity-user">
                                                            <strong>{activity.username}</strong>
                                                            <span className="activity-type">
                                                                {activity.type === 'course' ? 'Kursus' : 'Töö'}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="activity-severity"
                                                            style={{ color: getSeverityColor(activity.severity) }}
                                                        >
                                                            {getSeverityIcon(activity.severity)} {activity.severity.toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div className="activity-details">
                                                        <div className="detail-row">
                                                            <span className="detail-label">Tegevus:</span>
                                                            <span className="detail-value">{activity.activityName}</span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Lõppeb:</span>
                                                            <span className="detail-value">{formatDate(activity.completedAt)}</span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Tulevikus:</span>
                                                            <span className="detail-value future-time">
                                                                +{formatDuration(activity.minutesInFuture)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {results.suspiciousActivities.length > 10 && (
                                                <div className="more-results">
                                                    +{results.suspiciousActivities.length - 10} rohkem kahtlast tegevust...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="logs-tab">
                        <div className="logs-header">
                            <h5>Hiljutised Tuvastused</h5>
                            <button
                                className="admin-btn admin-btn-primary refresh-logs-btn"
                                onClick={loadRecentLogs}
                                disabled={isLoadingLogs}
                            >
                                {isLoadingLogs ? 'Laadin...' : 'Värskenda'}
                            </button>
                        </div>

                        {recentLogs.length > 0 ? (
                            <div className="logs-list">
                                {recentLogs.map((log) => (
                                    <div key={log.id} className="log-entry">
                                        <div className="log-header">
                                            <div className="log-user">
                                                <strong>{log.username}</strong>
                                                <span className="log-date">{formatDate(log.detectedAt)}</span>
                                            </div>
                                            <div
                                                className="log-severity"
                                                style={{ color: getSeverityColor(log.severity) }}
                                            >
                                                {getSeverityIcon(log.severity)} {log.severity.toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="log-details">
                                            <div className="log-activity">
                                                {log.type === 'course' ? 'Kursus' : 'Töö'}: {log.activityName}
                                            </div>
                                            <div className="log-time">
                                                Tulevikus: +{formatDuration(log.minutesInFuture)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-logs">
                                Kahtlaseid tegevusi pole tuvastatud
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};