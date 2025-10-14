// src/utils/serverUtils.ts
export const getCurrentServer = (): string => {
    return localStorage.getItem('currentServer') || 'beta';
};

export const setCurrentServer = (serverId: string): void => {
    const oldServer = getCurrentServer();
    localStorage.setItem('currentServer', serverId);

    // Dispatch custom event for same-tab detection
    if (oldServer !== serverId) {
        console.log(`🔄 Server changed: ${oldServer} → ${serverId}`);
        window.dispatchEvent(new CustomEvent('serverChanged', {
            detail: { server: serverId }
        }));
    }
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