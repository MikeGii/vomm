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
                <h2>Tere tulemast, konstaabel {userData?.username}!</h2>
                <p>Sinu politseiteenistus algab siit. Uued ülesanded tulekul!</p>
            </main>
        </div>
    );
};

export default DashboardPage;