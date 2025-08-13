// src/pages/HomePage.tsx
import React from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';

const HomePage: React.FC = () => {
    return (
        <div className="page">
            <PublicHeader />
            <main className="page-content">
                <h2>Welcome to Võmm RPG</h2>
                <p>Register or Login to start playing!</p>
            </main>
        </div>
    );
};

export default HomePage;