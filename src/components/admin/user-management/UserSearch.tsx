// src/components/admin/user-management/UserSearch.tsx
import React, { useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { PlayerStats } from '../../../types';

interface UserSearchProps {
    onUserFound: (user: PlayerStats, userId: string) => void;
    onSearchStart: () => void;
    onSearchError: (error: string) => void;
    isLoading: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({
                                                          onUserFound,
                                                          onSearchStart,
                                                          onSearchError,
                                                          isLoading
                                                      }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchType, setSearchType] = useState<'userId' | 'username'>('username');

    const handleSearch = async () => {
        if (!searchValue.trim()) {
            onSearchError('Sisesta otsinguväärtus');
            return;
        }

        onSearchStart();

        try {
            let userId: string | null = null;
            let playerStats: PlayerStats | null = null;

            if (searchType === 'userId') {
                // Direct search by user ID
                const statsRef = doc(firestore, 'playerStats', searchValue.trim());
                const statsDoc = await getDoc(statsRef);

                if (statsDoc.exists()) {
                    playerStats = statsDoc.data() as PlayerStats;
                    userId = searchValue.trim();
                }
            } else {
                // Search by username - need to query users collection first
                const usersQuery = query(
                    collection(firestore, 'users'),
                    where('usernameLower', '==', searchValue.trim().toLowerCase())
                );

                const usersSnapshot = await getDocs(usersQuery);

                if (!usersSnapshot.empty) {
                    const userDoc = usersSnapshot.docs[0];
                    userId = userDoc.id;

                    // Now get player stats
                    const statsRef = doc(firestore, 'playerStats', userId);
                    const statsDoc = await getDoc(statsRef);

                    if (statsDoc.exists()) {
                        playerStats = statsDoc.data() as PlayerStats;
                    }
                }
            }

            if (playerStats && userId) {
                onUserFound(playerStats, userId);
            } else {
                onSearchError(`Kasutajat "${searchValue}" ei leitud`);
            }
        } catch (error) {
            console.error('Search error:', error);
            onSearchError('Viga otsingul. Kontrolli ühendust.');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="user-search">
            <div className="search-controls">
                <div className="search-type-selector">
                    <label>
                        <input
                            type="radio"
                            value="username"
                            checked={searchType === 'username'}
                            onChange={(e) => setSearchType('username')}
                        />
                        Kasutajanimi
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="userId"
                            checked={searchType === 'userId'}
                            onChange={(e) => setSearchType('userId')}
                        />
                        Kasutaja ID
                    </label>
                </div>

                <div className="search-input-group">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={searchType === 'username' ? 'Sisesta kasutajanimi...' : 'Sisesta kasutaja ID...'}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !searchValue.trim()}
                        className="search-btn"
                    >
                        {isLoading ? 'Otsin...' : 'Otsi'}
                    </button>
                </div>
            </div>
        </div>
    );
};