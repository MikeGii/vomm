// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDssboQ4CjH6gAg3tc2nNtr4tP7tez4Pqg",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "vomm-eesti.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "vomm-eesti",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "vomm-eesti.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "157866958098",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:157866958098:web:aa5800f0bdb3baf160a7cb",
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://vomm-eesti-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);