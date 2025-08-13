// src/pages/DashboardPage.tsx
import React from 'react';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
    const { userData } = useAuth();

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="page-content">
                <h2>Welcome, {userData?.username}!</h2>
                <p>This is your dashboard. Game features coming soon!</p>
            </main>
        </div>
    );
};

export default DashboardPage;