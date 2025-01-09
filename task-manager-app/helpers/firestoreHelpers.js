import { doc, updateDoc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Add or update eventId for a To-Do list
export async function updateTaskEventId(userId, taskId, eventId) {
    const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
    await updateDoc(taskDocRef, { eventId });
}

// // Add or update eventId for a subtask inside a to-do list
// export async function updateSubtaskEventId(userId, taskId, subtaskIndex, eventId) {
//     const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
// }

// // Update tasks' project fields
// export async function updateTasksProject(userId, tasks, projectName) {
//     // for (const t of tasks) {
//     //     const tRef = doc(db, `tasks/${userId}/taskList`, t.id);
//     //     await updateDoc(tRef, { project: projectName });
//     // }



//     // const batch = db.batch();
//     // tasks.forEach(task => {
//     //     const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
//     //     batch.update(taskRef, { project: projectName });
//     // });
//     // await batch.commit();


//     const batch = writeBatch(db);
//     tasks.forEach(task => {
//         const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
//         const updateData = projectName ? { project: projectName } : { project: null };
//         batch.update(taskRef, updateData);
//     });
//     await batch.commit();
// }

// Update multiple tasks' project fields
export async function updateTasksProject(userId, tasks, projectId = null) {
    if (!userId || !tasks) {
        throw new Error("User ID and Tasks are required.");
    }

    const batch = writeBatch(db);
    tasks.forEach(task => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        const updateData = projectId ? { projectId } : { projectId: null };
        batch.update(taskRef, updateData);
    });
    await batch.commit();
}

// Create a new project and return its ID
export async function createProject(userId, projectName) {
    if (!userId || !projectName) {
        throw new Error("User ID and Project Name are required.");
    }
    
    const projectsRef = collection(db, `projects/${userId}/userProjects`);
    const projectDoc = await addDoc(projectsRef, {
        name: projectName,
        createdAt: new Date(),
    });
    return projectDoc.id;
}

// Assign tasks to a project
export async function assignTasksToProject(userId, tasks, projectId) {
    if (!userId || !tasks || !projectId) {
        throw new Error("User ID, Tasks, and Project ID are required.");
    }

    const batch = writeBatch(db);
    tasks.forEach(task => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        batch.update(taskRef, { projectId });
    });
    await batch.commit();
}

// Unassign tasks from any project
export async function unassignTasksFromProject(userId, tasks) {
    if (!userId || !tasks) {
        throw new Error("User ID and Tasks are required.");
    }
    
    const batch = writeBatch(db);
    tasks.forEach(task => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        batch.update(taskRef, { projectId: null });
    });
    await batch.commit();
}

