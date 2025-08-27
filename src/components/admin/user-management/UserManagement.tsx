// src/components/admin/user-management/UserManagement.tsx
import React, { useState } from 'react';
import { UserSearch } from './UserSearch';
import { PlayerStatsEditor } from './PlayerStatsEditor';
import { PlayerStats } from '../../../types';
import '../../../styles/components/admin/user-management/UserManagement.css';


interface UserManagementState {
    searchedUser: PlayerStats | null;
    userId: string | null;
    isLoading: boolean;
    error: string | null;
}

export const UserManagement: React.FC = () => {
    const [state, setState] = useState<UserManagementState>({
        searchedUser: null,
        userId: null,
        isLoading: false,
        error: null
    });

    const handleUserFound = (user: PlayerStats, userId: string) => {
        setState({
            searchedUser: user,
            userId: userId,
            isLoading: false,
            error: null
        });
    };

    const handleSearchStart = () => {
        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            searchedUser: null,
            userId: null
        }));
    };

    const handleSearchError = (error: string) => {
        setState(prev => ({
            ...prev,
            isLoading: false,
            error: error,
            searchedUser: null,
            userId: null
        }));
    };

    const handleUserUpdated = (updatedUser: PlayerStats) => {
        setState(prev => ({
            ...prev,
            searchedUser: updatedUser
        }));
    };

    const clearSearch = () => {
        setState({
            searchedUser: null,
            userId: null,
            isLoading: false,
            error: null
        });
    };

    return (
        <div className="user-management">
            <div className="user-management-header">
                <h2>Kasutajate haldus</h2>
                <p>Otsi kasutajat ID või kasutajanime järgi andmete vaatamiseks ja muutmiseks</p>
            </div>

            <UserSearch
                onUserFound={handleUserFound}
                onSearchStart={handleSearchStart}
                onSearchError={handleSearchError}
                isLoading={state.isLoading}
            />

            {state.error && (
                <div className="search-error">
                    <p>{state.error}</p>
                </div>
            )}

            {state.searchedUser && state.userId && (
                <div className="user-editor-section">
                    <div className="user-editor-header">
                        <h3>Kasutaja: {state.searchedUser.username}</h3>
                        <button
                            className="clear-search-btn"
                            onClick={clearSearch}
                        >
                            Tühjenda otsing
                        </button>
                    </div>

                    <PlayerStatsEditor
                        user={state.searchedUser}
                        userId={state.userId}
                        onUserUpdated={handleUserUpdated}
                    />
                </div>
            )}
        </div>
    );
};