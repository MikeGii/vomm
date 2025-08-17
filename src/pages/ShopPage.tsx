// src/pages/ShopPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import '../styles/pages/Shop.css';

const ShopPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="shop-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="shop-title">Pood</h1>

                <div className="shop-content">
                    <p className="coming-soon">Pood on varsti saadaval!</p>
                </div>
            </main>
        </div>
    );
};

export default ShopPage;