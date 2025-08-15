// src/components/tutorial/TutorialWaitingIndicator.tsx
import React, { useEffect, useState, useRef } from 'react';

interface TutorialWaitingIndicatorProps {
    message: string;
    totalTime: number; // in seconds
    onComplete?: () => void;
    onSkip?: () => void;
    highlightElement?: string; // Selector for element to highlight during waiting
}

export const TutorialWaitingIndicator: React.FC<TutorialWaitingIndicatorProps> = ({
                                                                                      message,
                                                                                      totalTime,
                                                                                      onComplete,
                                                                                      onSkip,
                                                                                      highlightElement
                                                                                  }) => {
    const [timeLeft, setTimeLeft] = useState(totalTime);
    const startTimeRef = useRef(Date.now());
    const completedRef = useRef(false);

    // Highlight element if provided
    useEffect(() => {
        if (highlightElement) {
            const element = document.querySelector(highlightElement);
            if (element) {
                element.classList.add('tutorial-highlight');
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return () => {
                if (element) {
                    element.classList.remove('tutorial-highlight');
                }
            };
        }
    }, [highlightElement]);

    useEffect(() => {
        // Reset refs when totalTime changes
        startTimeRef.current = Date.now();
        completedRef.current = false;
        setTimeLeft(totalTime);
    }, [totalTime]);

    useEffect(() => {
        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const remaining = Math.max(0, totalTime - elapsed);

            setTimeLeft(remaining);

            if (remaining <= 0 && !completedRef.current) {
                completedRef.current = true;
                onComplete?.();
            }
        };

        // Update immediately
        updateTimer();

        // Then update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [totalTime, onComplete]);

    const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

    const formatTime = (seconds: number): string => {
        if (seconds <= 0) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <div className="tutorial-waiting-indicator">
            <div className="waiting-content">
                <p className="waiting-message">{message}</p>
                <div className="waiting-progress-bar">
                    <div
                        className="waiting-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="waiting-time">Aega jäänud: {formatTime(timeLeft)}</span>
                {onSkip && (
                    <button
                        className="waiting-skip-btn"
                        onClick={onSkip}
                    >
                        Jäta õpetus vahele
                    </button>
                )}
            </div>
        </div>
    );
};