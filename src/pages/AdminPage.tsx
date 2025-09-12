// src/pages/AdminPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { AdminTools } from '../components/admin/AdminTools';
import { AdminApplicationsTab } from '../components/admin/AdminApplicationsTab';
import { UserManagement } from '../components/admin/user-management/UserManagement';
import { VehicleManagement } from '../components/admin/VehicleManagement';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { UpdatesManagement } from '../components/admin/UpdatesManagement';
import '../styles/pages/Admin.css';

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading } = usePlayerStats();
    const [activeTab, setActiveTab] = useState<string>('tools');

    // Uuendatud admin õiguste kontroll
    const hasAdminAccess = playerStats?.adminPermissions?.hasAdminAccess || false;
    const allowedTabs = playerStats?.adminPermissions?.allowedTabs || [];

    // Super admin kontroll (backup)
    const isSuperAdmin = currentUser?.uid === 'WUucfDi2DAat9sgDY75mDZ8ct1k2';

    // Lõplik admin ligipääsu kontroll
    const isAdmin = isSuperAdmin || hasAdminAccess;

    // Filtreeri tabad vastavalt õigustele
    const allTabs = [
        { id: 'tools', label: 'Admin tööriistad' },
        { id: 'applications', label: 'Kandideerimised' },
        { id: 'users', label: 'Kasutajate haldus' },
        { id: 'vehicles', label: 'Sõidukid' },
        { id: 'updates', label: 'Uuendused' },
    ];

    // Super admin näeb kõiki tabbe, teised ainult lubatuid
    const availableTabs = isSuperAdmin
        ? allTabs
        : allTabs.filter(tab => allowedTabs.includes(tab.id as any));

    // Seadista esimene lubatud tab kui praegune pole lubatud
    React.useEffect(() => {
        if (!isSuperAdmin && availableTabs.length > 0) {
            const currentTabAllowed = availableTabs.some(tab => tab.id === activeTab);
            if (!currentTabAllowed) {
                setActiveTab(availableTabs[0].id);
            }
        }
    }, [availableTabs, activeTab, isSuperAdmin]);

    // Loading state
    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="admin-container">
                    <div className="loading">
                        Kontrollime õigusi...
                    </div>
                </main>
            </div>
        );
    }

    // Access denied
    if (!isAdmin) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="admin-container">
                    <div className="access-denied">
                        <h1>Juurdepääs keelatud</h1>
                        <p>Sul pole admin õigusi selle lehe külastamiseks.</p>
                        <button
                            className="back-to-dashboard"
                            onClick={() => navigate('/dashboard')}
                        >
                            ← Tagasi töölauale
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Kontroll, kas kasutaja saab vaadata praegust tabi
    const canViewCurrentTab = isSuperAdmin || allowedTabs.includes(activeTab as any);

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="admin-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <div className="admin-header">
                    <h1 className="admin-title">Administraatori paneel</h1>
                    {hasAdminAccess && !isSuperAdmin && (
                        <div className="admin-permissions-info">
                            <span>Lubatud tabad: {allowedTabs.length}/{allTabs.length}</span>
                        </div>
                    )}
                </div>

                <TabNavigation
                    tabs={availableTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Näita komponente ainult kui on õigus */}
                {canViewCurrentTab && (
                    <>
                        {activeTab === 'tools' && <AdminTools />}
                        {activeTab === 'applications' && <AdminApplicationsTab />}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'vehicles' && <VehicleManagement />}
                        {activeTab === 'updates' && <UpdatesManagement />}
                    </>
                )}

                {!canViewCurrentTab && (
                    <div className="tab-access-denied">
                        <h3>Juurdepääs sellele tabiile keelatud</h3>
                        <p>Sul pole õigusi selle tabi vaatamiseks.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;