// src/utils/serverUtils.ts
export const getCurrentServer = (): string => {
    // Just get what's stored, no validation needed
    return localStorage.getItem('currentServer') || 'beta';
};

export const setCurrentServer = (serverId: string): void => {
    localStorage.setItem('currentServer', serverId);
};

export const getServerSpecificId = (userId: string, serverId?: string): string => {
    const server = serverId || getCurrentServer();

    // Beta server uses original ID (no suffix for backwards compatibility)
    if (server === 'beta') {
        return userId;
    }

    // Other servers use suffix
    return `${userId}_${server}`;
};