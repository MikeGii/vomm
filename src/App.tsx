// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
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
                    {/* Placeholder routes for future pages */}
                    <Route
                        path="/training"
                        element={
                            <ProtectedRoute>
                                <div className="page">
                                    <div className="page-content">
                                        <h1>Treening - Tulekul</h1>
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/patrol"
                        element={
                            <ProtectedRoute>
                                <div className="page">
                                    <div className="page-content">
                                        <h1>Mine tööle - Tulekul</h1>
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/department"
                        element={
                            <ProtectedRoute>
                                <div className="page">
                                    <div className="page-content">
                                        <h1>Osakond - Tulekul</h1>
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    {/* Redirect any unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;