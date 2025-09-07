// src/components/dashboard/Tasks.tsx
import React, {useState, useEffect, useCallback} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { getPlayerTasks, claimRewards } from '../../services/TaskService';
import { PlayerTasks, Task } from '../../types';
import '../../styles/components/Tasks.css';

export const Tasks: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats } = usePlayerStats();
    const [tasks, setTasks] = useState<PlayerTasks | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    const isVip = playerStats?.isVip || false;

    const loadTasks = useCallback(async () => {
        if (!currentUser) return;

        try {
            const playerTasks = await getPlayerTasks(currentUser.uid);
            setTasks(playerTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]); // Only recreate if currentUser changes

    // Now include loadTasks in the dependency array
    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleClaimRewards = async (taskType: 'daily' | 'weekly') => {
        if (!currentUser || !tasks) return;

        setClaiming(taskType);
        try {
            const result = await claimRewards(currentUser.uid, taskType);
            if (result.success) {
                await loadTasks();
            }
        } catch (error) {
            console.error('Error claiming rewards:', error);
        } finally {
            setClaiming(null);
        }
    };

    if (loading) return <div className="tasks-loading">Laadin ülesandeid...</div>;
    if (!tasks) return <div className="tasks-error">Ülesanded pole saadaval</div>;

    return (
        <div className={`tasks-container ${isVip ? 'vip-tasks' : ''}`}>
            <div className="tasks-header">
                <h2 className="section-title">Ülesanded</h2>
            </div>

            <div className="tasks-grid">
                {tasks.daily && (
                    <TaskCard
                        task={tasks.daily}
                        type="daily"
                        onClaim={() => handleClaimRewards('daily')}
                        claiming={claiming === 'daily'}
                        isVip={isVip}
                    />
                )}

                {tasks.weekly && (
                    <TaskCard
                        task={tasks.weekly}
                        type="weekly"
                        onClaim={() => handleClaimRewards('weekly')}
                        claiming={claiming === 'weekly'}
                        isVip={isVip}
                    />
                )}
            </div>
        </div>
    );
};

interface TaskCardProps {
    task: Task;
    type: 'daily' | 'weekly';
    onClaim: () => void;
    claiming: boolean;
    isVip: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, type, onClaim, claiming, isVip }) => {
    const isComplete = task.completed;

    // Calculate individual progress percentages using existing structure
    const courseProgress = Math.min(100, (task.progress.coursesCompleted / task.requirements.courses) * 100);
    const workProgress = Math.min(100, (task.progress.hoursWorked / task.requirements.workHours) * 100);
    const trainingProgress = Math.min(100, (task.progress.attributeLevelsGained / task.requirements.attributeLevels) * 100);

    return (
        <div className={`task-card ${type} ${isComplete ? 'completed' : ''} ${isVip ? 'vip-enhanced' : ''}`}>
            {isVip && <div className="vip-glow"></div>}

            <div className="task-header">
                <div className="task-type-section">
                    <span className="task-type">{type === 'daily' ? 'Igapäevane' : 'Iganädalane'}</span>
                    {isVip && <span className="vip-bonus-indicator">✨ +50% XP</span>}
                </div>
                {isComplete && (
                    <span className="task-status">✓ Valmis</span>
                )}
            </div>

            <div className="task-content">
                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>
            </div>

            <div className="task-progress-container">
                <div className="progress-item">
                    <div className="progress-label">
                        <span className="progress-text">📚 Kursused</span>
                        <span className="progress-numbers">
                            {task.progress.coursesCompleted}/{task.requirements.courses}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${courseProgress}%` }} />
                    </div>
                </div>

                <div className="progress-item">
                    <div className="progress-label">
                        <span className="progress-text">💼 Tööaeg</span>
                        <span className="progress-numbers">
                            {task.progress.hoursWorked}h/{task.requirements.workHours}h
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${workProgress}%` }} />
                    </div>
                </div>

                <div className="progress-item">
                    <div className="progress-label">
                        <span className="progress-text">💪 Atribuudid</span>
                        <span className="progress-numbers">
                            {task.progress.attributeLevelsGained}/{task.requirements.attributeLevels}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${trainingProgress}%` }} />
                    </div>
                </div>
            </div>

            <div className="task-footer">
                <div className="task-rewards">
                    <span className="reward-experience">⭐ {task.rewards.experience} XP</span>
                    <span className="reward-money">💰 €{task.rewards.money}</span>
                    <span className="reward-reputation">🏆 {task.rewards.reputation} mainet</span>
                </div>

                {isComplete && (
                    <button
                        className={`claim-button ${isVip ? 'vip-claim' : ''}`}
                        onClick={onClaim}
                        disabled={claiming}
                    >
                        {claiming ? 'Nõuan...' : 'Saa auhind'}
                    </button>
                )}
            </div>
        </div>
    );
};