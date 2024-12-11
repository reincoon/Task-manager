import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Add or update eventId for a To-Do list
export async function updateTaskEventId(userId, taskId, eventId) {
    const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
    await updateDoc(taskDocRef, { eventId });
}

// Add or update eventId for a subtask inside a to-do list

export async function updateSubtaskEventId(userId, taskId, subtaskIndex, eventId) {
    const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
}