import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function useProjects(userId) {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        if (!userId) {
            return;
        }
        const projectsRef = collection(db, `projects/${userId}/userProjects`);
        const unsubscribeProjects = onSnapshot(projectsRef, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProjects(fetchedProjects);
        }, (error) => {
            console.error("Snapshot listener error:", error);
        });
        return () => {
            if (unsubscribeProjects) {
                unsubscribeProjects();
            }
        };
    }, [userId]);

    return projects;
}