import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyCBr97rReWLjS0vGPkQlojsM6KObmZF3kQ",
    authDomain: "task-manager-7049b.firebaseapp.com",
    projectId: "task-manager-7049b",
    storageBucket: "task-manager-7049b.firebasestorage.app",
    messagingSenderId: "136836738424",
    appId: "1:136836738424:web:466d8092ed63995583ac8d",
    measurementId: "G-DSD5CGSQ73"
};

// Initialise Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialise Firestore with offline storage
const db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
});

// Initialise Firebase Authentication with React Native persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export { db, auth, app };