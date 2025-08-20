// src/services/UserValidationService.ts
import {
    collection,
    query,
    where,
    getDocs,
    limit
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

interface UsernameValidationResult {
    isAvailable: boolean;
    isValid: boolean;
    message: string;
}

// Estonian bad words and vulgar content (expandable list)
const FORBIDDEN_WORDS = [
    // Common Estonian profanity
    'pede', 'lits', 'litt', 'türa', 'pask', 'sitt', 'kurat', 'raisk', 'põrgu',
    'vittu', 'putsi', 'nuss', 'nussima', 'nai', 'naida', 'keppi', 'keppima',
    'perse', 'munn', 'riist', 'loll', 'debill', 'idioot', 'tatt', 'tibla',

    // International bad words commonly used
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'nazi', 'hitler',
    'nigger', 'fag', 'gay', 'homo', 'whore', 'slut', 'cunt', 'dick',

    // Numbers/symbols often used inappropriately
    '666', '88', '1488',

    // Admin/system reserved words
    'admin', 'moderator', 'bot', 'system', 'null', 'undefined',
    'politsei', 'komissar', 'paanikateadaanne'
];

/**
 * Check if username contains forbidden words
 */
const containsForbiddenWords = (username: string): boolean => {
    const lowerUsername = username.toLowerCase();
    return FORBIDDEN_WORDS.some(word => lowerUsername.includes(word.toLowerCase()));
};

/**
 * Check if username is available and valid
 */
export const validateUsername = async (username: string): Promise<UsernameValidationResult> => {
    try {
        const cleanUsername = username.trim();

        // Basic validation first
        if (cleanUsername.length < 3) {
            return {
                isAvailable: false,
                isValid: false,
                message: 'Kasutajanimi peab olema vähemalt 3 tähemärki pikk'
            };
        }

        if (cleanUsername.length > 20) {
            return {
                isAvailable: false,
                isValid: false,
                message: 'Kasutajanimi ei tohi olla pikem kui 20 tähemärki'
            };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            return {
                isAvailable: false,
                isValid: false,
                message: 'Kasutajanimi tohib sisaldada ainult tähti, numbreid ja alakriipsu'
            };
        }

        // Check for forbidden words
        if (containsForbiddenWords(cleanUsername)) {
            return {
                isAvailable: false,
                isValid: false,
                message: 'Kasutajanimi sisaldab sobimatud sõnu'
            };
        }

        // Check if username is already taken (case-insensitive)
        const usersRef = collection(firestore, 'users');
        let q = query(
            usersRef,
            where('usernameLower', '==', cleanUsername.toLowerCase()),
            limit(1)
        );

        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            q = query(
                usersRef,
                where('username', '==', cleanUsername),
                limit(1)
            );
            querySnapshot = await getDocs(q);

            // Also check case variations for existing users
            if (querySnapshot.empty) {
                // Get all users and check case-insensitive manually
                const allUsersQuery = query(usersRef);
                const allUsersSnapshot = await getDocs(allUsersQuery);

                const usernameExists = allUsersSnapshot.docs.some(doc => {
                    const userData = doc.data();
                    return userData.username &&
                        userData.username.toLowerCase() === cleanUsername.toLowerCase();
                });

                if (usernameExists) {
                    return {
                        isAvailable: false,
                        isValid: true,
                        message: 'See kasutajanimi on juba kasutusel'
                    };
                }
            }
        }

        if (!querySnapshot.empty) {
            return {
                isAvailable: false,
                isValid: true,
                message: 'See kasutajanimi on juba kasutusel'
            };
        }

        return {
            isAvailable: true,
            isValid: true,
            message: 'Kasutajanimi on saadaval'
        };

    } catch (error) {
        console.error('Error validating username:', error);
        return {
            isAvailable: false,
            isValid: false,
            message: 'Viga kasutajanime kontrollimisel'
        };
    }
};

/**
 * Quick check if username exists (case-insensitive)
 */
export const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(
            usersRef,
            where('usernameLower', '==', username.trim().toLowerCase()),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking username existence:', error);
        return true; // Assume taken on error to be safe
    }
};