import { doc, updateDoc, collection, addDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
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
    const tasksRef = collection(db, `tasks/${userId}/taskList`);

    // Fetch current tasks in the project to determine the starting order
    const q = query(tasksRef, where("projectId", "==", projectId));
    const snapshot = await getDocs(q);
    const currentOrders = snapshot.docs.map(doc => doc.data().order || 0);
    let nextOrder = currentOrders.length > 0 ? Math.max(...currentOrders) + 1 : 0;

    tasks.forEach(task => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        batch.update(taskRef, { projectId, order: nextOrder++ });
    });
    await batch.commit();
}

// Unassign tasks from any project
export async function unassignTasksFromProject(userId, tasks) {
    if (!userId || !tasks) {
        throw new Error("User ID and Tasks are required.");
    }
    
    const batch = writeBatch(db);
    const tasksRef = collection(db, `tasks/${userId}/taskList`);

    // Fetch current unassigned tasks to determine the starting order
    const q = query(tasksRef, where("projectId", "==", null));
    const snapshot = await getDocs(q);
    const currentOrders = snapshot.docs.map(doc => doc.data().order || 0);
    let nextOrder = currentOrders.length > 0 ? Math.max(...currentOrders) + 1 : 0;

    tasks.forEach(task => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        batch.update(taskRef, { projectId: null, order: nextOrder++ });
    });
    await batch.commit();
}

// Reorder to-do lists within the same project
export async function reorderTasksWithinProject(userId, tasks, projectId = null) {
    const batch = writeBatch(db);
    // Sort tasks by their current order or fallback 0
    const sorted = [...tasks].sort((a,b) => (a.order || 0) - (b.order || 0));
    // Reassign a new order
    sorted.forEach((task, idx) => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        batch.update(taskRef, { order: idx, projectId });
    });
    await batch.commit();
}