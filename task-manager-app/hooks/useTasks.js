import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function useTasks(userId) {
    const [rawTasks, setRawTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            return;
        }
        const tasksRef = collection(db, `tasks/${userId}/taskList`);
        const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
            const fetchedTasks = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                priority: doc.data().priority || 'Low',
            }));

            // Sort tasks by the order field
            const sortedTasks = [...fetchedTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
            setRawTasks(sortedTasks);
            setLoading(false);
        }, (error) => {
            setLoading(false);
        });
        return () => {
            if (unsubscribeTasks) {
                unsubscribeTasks();
            }
        };
    }, [userId]);

    return { rawTasks, loading, setRawTasks };
}