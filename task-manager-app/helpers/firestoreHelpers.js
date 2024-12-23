// import { doc, updateDoc } from 'firebase/firestore';
// import { db } from '../firebaseConfig';

// // Add or update eventId for a To-Do list
// export async function updateTaskEventId(userId, taskId, eventId) {
//     const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
//     await updateDoc(taskDocRef, { eventId });
// }

// // // Add or update eventId for a subtask inside a to-do list
// // export async function updateSubtaskEventId(userId, taskId, subtaskIndex, eventId) {
// //     const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
// // }

// // Update tasks' project fields
// export async function updateTasksProject(userId, tasks, projectName) {
//     for (const t of tasks) {
//         const tRef = doc(db, `tasks/${userId}/taskList`, t.id);
//         await updateDoc(tRef, { project: projectName });
//     }
// }