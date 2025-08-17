// src/pages/HomePage.tsx
import React from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Hero } from '../components/home/Hero';
import { Features } from '../components/home/Features';
import { GameInfo } from '../components/home/GameInfo';
import { CallToAction } from '../components/home/CallToAction';
import { Updates } from '../components/home/Updates';

const HomePage: React.FC = () => {
    return (
        <div className="page">
            <PublicHeader />
            <Hero />
            <Features />
            <GameInfo />
            <CallToAction />
            <Updates />
        </div>
    );
};

export default HomePage;