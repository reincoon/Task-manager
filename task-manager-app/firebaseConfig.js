import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCBr97rReWLjS0vGPkQlojsM6KObmZF3kQ",
    authDomain: "task-manager-7049b.firebaseapp.com",
    projectId: "task-manager-7049b",
    storageBucket: "task-manager-7049b.firebasestorage.app",
    messagingSenderId: "136836738424",
    appId: "1:136836738424:web:466d8092ed63995583ac8d",
    measurementId: "G-DSD5CGSQ73"
};

// const app = initializeApp(firebaseConfig);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const db = getFirestore(app);
// const auth = getAuth(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { db, auth, app };