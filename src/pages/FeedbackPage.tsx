// src/pages/FeedbackPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ContactForm } from '../components/feedback/ContactForm';
import '../styles/pages/FeedbackPage.css';

const FeedbackPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="feedback-container">
                <div className="page-header">
                    <button
                        className="back-to-dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Tagasi töölauale
                    </button>
                </div>

                <div className="feedback-content">
                    <ContactForm />
                </div>
            </main>
        </div>
    );
};

export default FeedbackPage;