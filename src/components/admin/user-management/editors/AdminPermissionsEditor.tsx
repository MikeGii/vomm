// src/components/admin/user-management/editors/AdminPermissionsEditor.tsx
import React from 'react';
import { PlayerStats } from '../../../../types';
import { AdminPermissions, AdminTab } from '../../../../types/admin';
import { useAuth } from '../../../../contexts/AuthContext';

interface AdminPermissionsEditorProps {
    user: PlayerStats;
    isOpen: boolean;
    onToggle: () => void;
    onFieldUpdate: (path: string, value: any) => void;
}

export const AdminPermissionsEditor: React.FC<AdminPermissionsEditorProps> = ({
                                                                                  user,
                                                                                  isOpen,
                                                                                  onToggle,
                                                                                  onFieldUpdate
                                                                              }) => {
    const { currentUser } = useAuth();

    // Available admin tabs
    const availableTabs: { id: AdminTab; label: string; description: string }[] = [
        { id: 'tools', label: 'Admin tööriistad', description: 'Üldised admin tööriistad ja funktsioonid' },
        { id: 'applications', label: 'Kandideerimised', description: 'Töökohataotluste haldamine' },
        { id: 'users', label: 'Kasutajate haldus', description: 'Kasutajate andmete muutmine' },
        { id: 'vehicles', label: 'Sõidukite haldus', description: 'Sõidukite andmebaasi haldamine' }
    ];

    const hasAdminAccess = user.adminPermissions?.hasAdminAccess || false;
    const allowedTabs = user.adminPermissions?.allowedTabs || [];

    const toggleAdminAccess = (hasAccess: boolean) => {
        if (hasAccess) {
            // Grant access with basic permissions
            const newPermissions: AdminPermissions = {
                hasAdminAccess: true,
                allowedTabs: ['tools'], // Default to tools only
                grantedBy: currentUser?.uid || '',
                grantedAt: new Date()
            };
            onFieldUpdate('adminPermissions', newPermissions);
        } else {
            // Revoke access
            onFieldUpdate('adminPermissions', null);
        }
    };

    const toggleTab = (tabId: AdminTab) => {
        if (!user.adminPermissions) return;

        const currentTabs = user.adminPermissions.allowedTabs || [];
        const updatedTabs = currentTabs.includes(tabId)
            ? currentTabs.filter(tab => tab !== tabId)
            : [...currentTabs, tabId];

        const updatedPermissions: AdminPermissions = {
            ...user.adminPermissions,
            allowedTabs: updatedTabs,
            grantedBy: currentUser?.uid || '',
            grantedAt: new Date()
        };

        onFieldUpdate('adminPermissions', updatedPermissions);
    };

    return (
        <div className="editor-section">
            <button className="section-header" onClick={onToggle}>
                <span>⚙️ Admin õigused</span>
                <span className={`section-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="section-content">
                    <div className="admin-permissions-info">
                        <p>Määra kasutajale admin paneeli ligipääs ja valige milliseid tabbe ta näeb.</p>
                    </div>

                    {/* Admin Access Toggle */}
                    <div className="field-row">
                        <label>Admin paneeli ligipääs:</label>
                        <div className="toggle-container">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={hasAdminAccess}
                                    onChange={(e) => toggleAdminAccess(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className={`access-status ${hasAdminAccess ? 'granted' : 'denied'}`}>
                                {hasAdminAccess ? 'Lubatud' : 'Keelatud'}
                            </span>
                        </div>
                    </div>

                    {/* Tab Permissions */}
                    {hasAdminAccess && (
                        <div className="tab-permissions">
                            <h4 className="subsection-title">Lubatud admin tabad:</h4>
                            <div className="tabs-grid">
                                {availableTabs.map(tab => (
                                    <div key={tab.id} className="tab-permission-item">
                                        <label className="tab-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={allowedTabs.includes(tab.id)}
                                                onChange={() => toggleTab(tab.id)}
                                            />
                                            <div className="tab-info">
                                                <strong>{tab.label}</strong>
                                                <small>{tab.description}</small>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Permission Summary */}
                            <div className="permission-summary">
                                <strong>Kokkuvõte:</strong> Kasutaja näeb {allowedTabs.length} tabi {availableTabs.length}-st
                                {user.adminPermissions?.grantedBy && (
                                    <div className="permission-meta">
                                        <small>
                                            Õigused andis: {user.adminPermissions.grantedBy} <br/>
                                            Kuupäev: {new Date(user.adminPermissions.grantedAt).toLocaleString('et-EE')}
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="admin-warning">
                        ⚠️ <strong>Ettevaatust:</strong> Admin õiguste andmine annab kasutajale juurdepääsu tundlikele funktsioonidele.
                    </div>
                </div>
            )}
        </div>
    );
};