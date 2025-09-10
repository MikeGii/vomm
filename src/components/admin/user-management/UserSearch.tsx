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

interface SearchResult {
    user: PlayerStats;
    userId: string;
}

export const UserSearch: React.FC<UserSearchProps> = ({
                                                          onUserFound,
                                                          onSearchStart,
                                                          onSearchError,
                                                          isLoading
                                                      }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchType, setSearchType] = useState<'userId' | 'username' | 'badgeNumber'>('username');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    const searchByUsername = async (searchTerm: string): Promise<SearchResult[]> => {
        const results: SearchResult[] = [];
        const searchTermLower = searchTerm.trim().toLowerCase();

        try {
            // Strategy 1: Try exact match with usernameLower field
            const exactQuery = query(
                collection(firestore, 'users'),
                where('usernameLower', '==', searchTermLower)
            );
            const exactSnapshot = await getDocs(exactQuery);

            if (!exactSnapshot.empty) {
                // Found exact match
                for (const userDoc of exactSnapshot.docs) {
                    const statsRef = doc(firestore, 'playerStats', userDoc.id);
                    const statsDoc = await getDoc(statsRef);

                    if (statsDoc.exists()) {
                        results.push({
                            user: statsDoc.data() as PlayerStats,
                            userId: userDoc.id
                        });
                    }
                }
                return results;
            }

            // Strategy 2: If no exact match, try partial matching
            const allUsersQuery = query(collection(firestore, 'users'));
            const allUsersSnapshot = await getDocs(allUsersQuery);

            const matchingUserIds: string[] = [];

            allUsersSnapshot.forEach(doc => {
                const userData = doc.data();
                const username = userData.username || '';
                const usernameLower = userData.usernameLower || username.toLowerCase();

                // Check for partial matches (contains search term)
                if (usernameLower.includes(searchTermLower) ||
                    username.toLowerCase().includes(searchTermLower)) {
                    matchingUserIds.push(doc.id);
                }
            });

            // Get player stats for matching users
            for (const userId of matchingUserIds) {
                const statsRef = doc(firestore, 'playerStats', userId);
                const statsDoc = await getDoc(statsRef);

                if (statsDoc.exists()) {
                    results.push({
                        user: statsDoc.data() as PlayerStats,
                        userId: userId
                    });
                }
            }

            return results;

        } catch (error) {
            console.error('Username search error:', error);
            throw error;
        }
    };

    const searchByBadgeNumber = async (badgeNumber: string): Promise<SearchResult[]> => {
        const results: SearchResult[] = [];

        try {
            const badgeQuery = query(
                collection(firestore, 'playerStats'),
                where('badgeNumber', '==', badgeNumber.trim())
            );
            const badgeSnapshot = await getDocs(badgeQuery);

            badgeSnapshot.forEach(doc => {
                results.push({
                    user: doc.data() as PlayerStats,
                    userId: doc.id
                });
            });

            return results;

        } catch (error) {
            console.error('Badge number search error:', error);
            throw error;
        }
    };

    const searchByUserId = async (userId: string): Promise<SearchResult[]> => {
        const results: SearchResult[] = [];

        try {
            const statsRef = doc(firestore, 'playerStats', userId.trim());
            const statsDoc = await getDoc(statsRef);

            if (statsDoc.exists()) {
                results.push({
                    user: statsDoc.data() as PlayerStats,
                    userId: userId.trim()
                });
            }

            return results;

        } catch (error) {
            console.error('User ID search error:', error);
            throw error;
        }
    };

    const handleSearch = async () => {
        if (!searchValue.trim()) {
            onSearchError('Sisesta otsinguväärtus');
            return;
        }

        onSearchStart();
        setShowResults(false);
        setSearchResults([]);

        try {
            let results: SearchResult[] = [];

            switch (searchType) {
                case 'userId':
                    results = await searchByUserId(searchValue);
                    break;
                case 'username':
                    results = await searchByUsername(searchValue);
                    break;
                case 'badgeNumber':
                    results = await searchByBadgeNumber(searchValue);
                    break;
            }

            if (results.length === 0) {
                onSearchError(`Kasutajat "${searchValue}" ei leitud`);
            } else if (results.length === 1) {
                // Single result - select automatically
                onUserFound(results[0].user, results[0].userId);
            } else {
                // Multiple results - show selection list
                setSearchResults(results);
                setShowResults(true);
            }

        } catch (error) {
            console.error('Search error:', error);
            onSearchError('Viga otsingul. Kontrolli ühendust.');
        }
    };

    const selectUser = (result: SearchResult) => {
        onUserFound(result.user, result.userId);
        setShowResults(false);
        setSearchResults([]);
    };

    const clearResults = () => {
        setShowResults(false);
        setSearchResults([]);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
        if (e.key === 'Escape') {
            clearResults();
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
                    <label>
                        <input
                            type="radio"
                            value="badgeNumber"
                            checked={searchType === 'badgeNumber'}
                            onChange={(e) => setSearchType('badgeNumber')}
                        />
                        Märginumber
                    </label>
                </div>

                <div className="search-input-group">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            searchType === 'username' ? 'Sisesta kasutajanimi (täpne või osaline)...' :
                                searchType === 'userId' ? 'Sisesta kasutaja ID...' :
                                    'Sisesta märginumber...'
                        }
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

                {/* Search hint */}
                <div className="search-hint">
                    {searchType === 'username' && (
                        <small>💡 Võid otsida täpse nimega või nime osaga (nt "joh" leiab "john_doe")</small>
                    )}
                    {searchType === 'badgeNumber' && (
                        <small>💡 Sisesta politsei märginumber</small>
                    )}
                </div>
            </div>

            {/* Multiple Results Display */}
            {showResults && searchResults.length > 0 && (
                <div className="search-results">
                    <div className="results-header">
                        <h4>Leitud {searchResults.length} kasutajat:</h4>
                        <button
                            className="clear-results-btn"
                            onClick={clearResults}
                            title="Sulge tulemused"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="results-list">
                        {searchResults.map((result) => (
                            <div
                                key={result.userId}
                                className="result-item"
                                onClick={() => selectUser(result)}
                                title="Klõpsa valimiseks"
                            >
                                <div className="result-main-info">
                                    <strong className="username">
                                        {result.user.username || 'Tundmatu kasutaja'}
                                    </strong>
                                    <span className="user-level">
                                        Tase {result.user.level || 1}
                                    </span>
                                </div>
                                <div className="result-details">
                                    <span className="user-id">ID: {result.userId}</span>
                                    {result.user.badgeNumber && (
                                        <span className="badge-number">Märk: {result.user.badgeNumber}</span>
                                    )}
                                    {result.user.department && (
                                        <span className="department">{result.user.department}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};