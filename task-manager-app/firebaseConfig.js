import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCBr97rReWLjS0vGPkQlojsM6KObmZF3kQ",
    authDomain: "task-manager-7049b.firebaseapp.com",
    projectId: "task-manager-7049b",
    storageBucket: "task-manager-7049b.firebasestorage.app",
    messagingSenderId: "136836738424",
    appId: "1:136836738424:web:466d8092ed63995583ac8d",
    measurementId: "G-DSD5CGSQ73"
};

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };