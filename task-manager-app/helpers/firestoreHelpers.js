import { doc, updateDoc, deleteDoc, deleteField, collection, addDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { deleteTask } from './taskActions';

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

// Update an existing project's name
export async function updateProjectName(userId, projectId, newName) {
    if (!userId || !projectId || !newName) {
        throw new Error("User ID, Project ID, and New Name are required.");
    }

    const projectRef = doc(db, `projects/${userId}/userProjects`, projectId);
    await updateDoc(projectRef, {
        name: newName,
    });
}

// Delete a project and its associated tasks
export async function deleteProject(userId, projectId, navigation) {
    if (!userId || !projectId) {
        throw new Error("User ID and Project ID are required.");
    }

    const projectRef = doc(db, `projects/${userId}/userProjects`, projectId);
    const todoListsQuery = query(collection(db, `tasks/${userId}/taskList`), where('projectId', '==', projectId));

    try {
        const todoListsSnapshot = await getDocs(todoListsQuery);
        // Delete each todo list using deleteTask function
        const deleteTodoListPromises = [];
        todoListsSnapshot.forEach(doc => {
            const task = doc.data();
            task.id = doc.id; // Ensure the task ID is set
            deleteTodoListPromises.push(deleteTask(userId, task, navigation, false));
        });
        await Promise.all(deleteTodoListPromises);

        // Delete the project itself
        await deleteDoc(projectRef);
    } catch (error) {
        throw new Error('Error deleting project: ' + error.message);
    }
}
