// src/types/admin.ts
export interface AdminPermissions {
    hasAdminAccess: boolean;
    allowedTabs: AdminTab[];
    grantedBy: string; // Admin user ID who granted permissions
    grantedAt: Date;
}

export type AdminTab = 'tools' | 'applications' | 'users' | 'vehicles';