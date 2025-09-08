// src/pages/AdminPage.tsx
// Updated version with UserManagement integration

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { AdminTools } from '../components/admin/AdminTools';
import { AdminApplicationsTab } from '../components/admin/AdminApplicationsTab';
import { UserManagement } from '../components/admin/user-management/UserManagement';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/Admin.css';

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<string>('tools');

    // Check if user is admin
    const isAdmin = currentUser?.uid === 'WUucfDi2DAat9sgDY75mDZ8ct1k2';

    // Add the user management tab to your tabs array
    const tabs = [
        { id: 'tools', label: 'Admin tööriistad' },
        { id: 'applications', label: 'Kandideerimised' },
        { id: 'users', label: 'Kasutajate haldus' }
    ];

    if (!isAdmin) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="admin-container">
                    <div className="access-denied">
                        <h1>Juurdepääs keelatud</h1>
                        <p>Sul pole õigusi selle lehe külastamiseks.</p>
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

                <h1 className="admin-title">Administraatori paneel</h1>

                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {activeTab === 'tools' && <AdminTools />}
                {activeTab === 'applications' && <AdminApplicationsTab />}
                {activeTab === 'users' && <UserManagement />}
            </main>
        </div>
    );
};

export default AdminPage;