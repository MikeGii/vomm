// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import TrainingPage from './pages/TrainingPage';
import PatrolPage from "./pages/PatrolPage";
import { ToastProvider } from './contexts/ToastContext';
import ProfilePage from './pages/ProfilePage';
import ShopPage from './pages/ShopPage';
import {DebugMenu} from "./components/dev/DebugMenu";
import CasinoPage from './pages/CasinoPage';
import BankPage from "./pages/BankPage";
import FightClubPage from './pages/FightClubPage';
import { PlayerStatsProvider } from './contexts/PlayerStatsContext';
import { EstateProvider } from './contexts/EstateContext';
import DepartmentPage from "./pages/DepartmentPage";
import FeedbackPage from "./pages/FeedbackPage";
import AdminPage from './pages/AdminPage';
import TestsPage from './pages/TestsPage';
import SettingsPage from "./pages/SettingsPage";
import VIPPage from "./pages/VIPPage";
import RealEstatePage from "./pages/RealEstatePage";

function App() {
    return (
        <Router>
            <AuthProvider>
                <PlayerStatsProvider>
                    <EstateProvider>
                        <ToastProvider>
                            <DebugMenu />
                            <Routes>
                                <Route path="/" element={<HomePage />} />

                                <Route path="/admin" element={<AdminPage />} />

                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <DashboardPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/courses"
                                    element={
                                        <ProtectedRoute>
                                            <CoursesPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/training"
                                    element={
                                        <ProtectedRoute>
                                            <TrainingPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/patrol"
                                    element={
                                        <ProtectedRoute>
                                            <PatrolPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/shop" element={
                                    <ProtectedRoute>
                                        <ShopPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/real-estate" element={
                                    <ProtectedRoute>
                                        <RealEstatePage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/casino" element={
                                    <ProtectedRoute>
                                        <CasinoPage />
                                    </ProtectedRoute>
                                } />

                                <Route
                                    path="/bank"
                                    element={
                                        <ProtectedRoute>
                                            <BankPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/fight-club"
                                    element={
                                        <ProtectedRoute>
                                            <FightClubPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/department"
                                    element={
                                        <ProtectedRoute>
                                            <DepartmentPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="/tests" element={<TestsPage />} />

                                <Route
                                    path="/feedback"
                                    element={
                                        <ProtectedRoute>
                                            <FeedbackPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/settings"
                                    element={
                                        <ProtectedRoute>
                                            <SettingsPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/vip"
                                    element={
                                        <ProtectedRoute>
                                            <VIPPage />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                            <DebugMenu />
                        </ToastProvider>
                    </EstateProvider>
                </PlayerStatsProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;