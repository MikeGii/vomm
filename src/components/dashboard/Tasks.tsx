// src/components/dashboard/Tasks.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlayerTasks, claimRewards } from '../../services/TaskService';
import { PlayerTasks, Task } from '../../types';
import '../../styles/components/Tasks.css';

export const Tasks: React.FC = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<PlayerTasks | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    useEffect(() => {
        loadTasks();
    }, [currentUser]);

    const loadTasks = async () => {
        if (!currentUser) return;

        try {
            const playerTasks = await getPlayerTasks(currentUser.uid);
            setTasks(playerTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

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
        <div className="tasks-container">
            <h2 className="tasks-title">Ülesanded</h2>

            <div className="tasks-grid">
                {tasks.daily && (
                    <TaskCard
                        task={tasks.daily}
                        type="daily"
                        onClaim={() => handleClaimRewards('daily')}
                        claiming={claiming === 'daily'}
                    />
                )}

                {tasks.weekly && (
                    <TaskCard
                        task={tasks.weekly}
                        type="weekly"
                        onClaim={() => handleClaimRewards('weekly')}
                        claiming={claiming === 'weekly'}
                    />
                )}
            </div>

            {tasks.streak > 0 && (
                <div className="streak-display">
                    <span className="streak-icon">🔥</span>
                    <span>{tasks.streak} päeva järjest</span>
                </div>
            )}
        </div>
    );
};

interface TaskCardProps {
    task: Task;
    type: 'daily' | 'weekly';
    onClaim: () => void;
    claiming: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, type, onClaim, claiming }) => {
    const isComplete = task.completed;

    // Calculate individual progress percentages
    const courseProgress = Math.min(100, (task.progress.coursesCompleted / task.requirements.courses) * 100);
    const workProgress = Math.min(100, (task.progress.hoursWorked / task.requirements.workHours) * 100);
    const trainingProgress = Math.min(100, (task.progress.attributeLevelsGained / task.requirements.attributeLevels) * 100);

    return (
        <div className={`task-card ${type} ${isComplete ? 'completed' : ''}`}>
            <div className="task-header">
                <span className="task-type">{type === 'daily' ? 'Päevane' : 'Nädalane'}</span>
                {isComplete && <span className="task-status">✓ Valmis</span>}
            </div>

            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>

            {/* Three separate progress bars */}
            <div className="task-progress-container">
                <div className="progress-item">
                    <span className="progress-label">Kursused: {task.progress.coursesCompleted}/{task.requirements.courses}</span>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${courseProgress}%` }} />
                    </div>
                </div>

                <div className="progress-item">
                    <span className="progress-label">Tööaeg: {task.progress.hoursWorked}h/{task.requirements.workHours}h</span>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${workProgress}%` }} />
                    </div>
                </div>

                <div className="progress-item">
                    <span className="progress-label">Atribuudid: {task.progress.attributeLevelsGained}/{task.requirements.attributeLevels}</span>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${trainingProgress}%` }} />
                    </div>
                </div>
            </div>

            <div className="task-rewards">
                <span>{task.rewards.experience} XP</span>
                <span>{task.rewards.money}€</span>
                <span>{task.rewards.reputation} mainet</span>
            </div>

            {isComplete && (
                <button
                    className="claim-button"
                    onClick={onClaim}
                    disabled={claiming}
                >
                    {claiming ? 'Võtan...' : 'Võta preemia'}
                </button>
            )}
        </div>
    );
};