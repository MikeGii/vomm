// src/pages/TrainingPage.tsx
import React from 'react';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Training.css';

const TrainingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="training-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="training-title">Treening</h1>

                <div className="training-placeholder">
                    <p>Treeningu funktsioon on arendamisel...</p>
                    <p>Siin saad tulevikus harjutada oma oskusi ja tõsta võimekust.</p>
                </div>
            </main>
        </div>
    );
};

export default TrainingPage;