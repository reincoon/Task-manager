import { doc, deleteDoc, updateDoc, collection, addDoc, writeBatch, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Add or update eventId for a To-Do list
export async function updateTaskEventId(userId, taskId, eventId) {
    const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
    await updateDoc(taskDocRef, { eventId });
}

// Update multiple tasks' project fields
export async function updateTasksProject(userId, tasks, projectId = null) {
    if (!userId || !tasks) {
        throw new Error("User ID and Tasks are required.");
    }

    const batch = writeBatch(db);
    // Fetch current tasks in the target project to determine the starting order
    const tasksRef = collection(db, `tasks/${userId}/taskList`);
    const q = query(tasksRef, where("projectId", "==", projectId));
    const snapshot = await getDocs(q);
    const currentOrders = snapshot.docs.map(doc => doc.data().order || 0);
    let nextOrder = currentOrders.length > 0 ? Math.max(...currentOrders) + 1 : 0;
    
    tasks.forEach(task => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        // const updateData = projectId ? { projectId, order: nextOrder++ } : { projectId: null, order: nextOrder++ };
        const updateData = {
            projectId: projectId || null,
            order: nextOrder++
        };
        batch.update(taskRef, updateData);
    });
    await batch.commit();
}

// Update todo lists' priority
export async function updateTasksPriority(userId, tasks, newPriority) {
    if (!userId || !tasks || !newPriority) {
        throw new Error("User ID, Tasks, and newPriority are required.");
    }

    const batch = writeBatch(db);

    tasks.forEach((task, index) => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        batch.update(taskRef, { priority: newPriority, order: index });
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

// Delete a project by its ID
export async function deleteProject(userId, projectId) {
    const db = getFirestore();
    const projectRef = doc(db, 'projects', userId, 'userProjects', projectId);
    
    // Delete associated tasks
    const tasksRef = collection(db, 'tasks', userId, 'taskList');
    const q = query(tasksRef, where('projectId', '==', projectId));
    const taskSnapshot = await getDocs(q);

    taskSnapshot.forEach(async (taskDoc) => {
        await deleteDoc(doc(db, 'tasks', userId, 'taskList', taskDoc.id));
    });

    // Delete the project
    await deleteDoc(projectRef);
}

// Update a project's name
export async function updateProjectName(userId, projectId, newProjectName) {
    if (!userId || !projectId || !newProjectName) {
        throw new Error("User ID, Project ID, and the new project name are required.");
    }

    // const projectRef = doc(db, `projects/${userId}/userProjects`, projectId);
    const projectRef = doc(getFirestore(), 'projects', userId, 'userProjects', projectId);
    await updateDoc(projectRef, { name: newProjectName });
}

// // Reorder to-do lists within the same project
// export async function reorderTasksWithinProject(userId, tasks, projectId = null) {
//     if (!userId || !tasks) {
//         throw new Error("User ID and Tasks are required.");
//     }

//     const batch = writeBatch(db);
//     // Sort tasks by their current order or fallback 0
//     const sorted = [...tasks].sort((a,b) => (a.order || 0) - (b.order || 0));
//     // Reassign a new order
//     sorted.forEach((task, index) => {
//         const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
//         batch.update(taskRef, { order: index });
//     });
//     await batch.commit();
// }

// Reorder to-do lists within the same project or priority
export async function reorderTasks(userId, tasks, projectId = null, priority = null) {
    if (!userId || !tasks) {
        throw new Error("User ID and Tasks are required.");
    }

    const batch = writeBatch(db);

    // Sort tasks by their current order or fallback 0
    const sorted = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Reassign a new order
    sorted.forEach((task, index) => {
        const taskRef = doc(db, `tasks/${userId}/taskList`, task.id);
        const updateData = { order: index };

        if (projectId !== undefined) {
            updateData.projectId = projectId;
        }

        if (priority !== undefined) {
            updateData.priority = priority;
        }

        batch.update(taskRef, updateData);
    });

    await batch.commit();
}
