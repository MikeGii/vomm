// src/components/admin/AdminTools.tsx
import React from 'react';
import { CheatDetector } from './tools/CheatDetector';
import { CrimeInitializer } from './tools/CrimeInitializer';
import '../../styles/components/admin/AdminTools.css';

export const AdminTools: React.FC = () => {
    return (
        <div className="admin-tools">
            <div className="admin-header">
                <h2>Admin Tööriistad</h2>
                <p className="admin-subtitle">Mängu haldamise ja hoolduse tööriistad</p>
            </div>

            <div className="tools-grid">

                {/* Crime System */}
                <div className="tool-category">
                    <h3 className="category-title">Kuritegevuse Süsteem</h3>
                    <CrimeInitializer />
                </div>

                {/* Security Tools */}
                <div className="tool-category">
                    <h3 className="category-title">Turvalisus</h3>
                    <CheatDetector />
                </div>
            </div>
        </div>
    );
};