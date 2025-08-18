// src/utils/timeFormatter.ts

/**
 * Formats seconds into a user-friendly time string in Estonian
 * @param seconds - Total seconds to format
 * @returns Formatted time string
 */
export const formatTimeEstonian = (seconds: number): string => {
    if (seconds <= 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Under 1 hour - show as MM:SS
    if (hours === 0) {
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 1 hour or more - show as Xt YYmin ZZs
    // If exactly on the hour (no minutes or seconds)
    if (mins === 0 && secs === 0) {
        return `${hours} ${hours === 1 ? 'tund' : 'tundi'}`;
    }

    // Full format with hours, minutes and seconds
    return `${hours}t ${mins}min ${secs}s`;
};

/**
 * Formats seconds for countdown timers (HH:MM:SS format)
 * @param seconds - Total seconds to format
 * @returns Formatted time string in HH:MM:SS or MM:SS format
 */
export const formatCountdownTime = (seconds: number): string => {
    if (seconds <= 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};