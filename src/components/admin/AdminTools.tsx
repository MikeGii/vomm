// src/components/admin/AdminTools.tsx
import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { CheatDetector } from './tools/CheatDetector';
import { LevelRecalculator } from './tools/LevelRecalculator';
import { WorkManager } from './tools/WorkManager';
import '../../styles/components/admin/AdminTools.css';

export const AdminTools: React.FC = () => {
    const { showToast } = useToast();

    return (
        <div className="admin-tools">
            <div className="admin-header">
                <h2>Admin Tööriistad</h2>
                <p className="admin-subtitle">Mängu haldamise ja hoolduse tööriistad</p>
            </div>

            <div className="tools-grid">

                {/* Work Management */}
                <div className="tool-category">
                    <h3 className="category-title">Tööde Haldus</h3>
                    <WorkManager />
                </div>

                {/* Player Management */}
                <div className="tool-category">
                    <h3 className="category-title">Mängijate Haldus</h3>
                    <LevelRecalculator />
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