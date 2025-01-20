import { db } from '../firebaseConfig';
import { doc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, collection, query, where } from 'firebase/firestore';
import { cancelTaskNotification, scheduleTaskNotification } from '../helpers/notificationsHelpers'; 
import { removeFileFromSupabase } from '../helpers/supabaseStorageHelpers';
import { addEventToCalendar } from './calendar';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { COLOURS } from './constants';

// Fetch task details from Firestore
export async function fetchTaskDetails(userId, taskId) {
    const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
    const taskSnapshot = await getDoc(taskDocRef);
    if (!taskSnapshot.exists()) {
        throw new Error('Task not found.');
    }

    const data = taskSnapshot.data();

    // Convert main dueDate to Date object
    let mainDueDate = new Date(data.dueDate);
    if (isNaN(mainDueDate.getTime())) {
        mainDueDate = new Date();
    }

    // Convert each subtask's dueDate to Date object
    let fetchedSubtasks = data.subtasks || [];
    fetchedSubtasks = fetchedSubtasks.map(subtask => {
        let validDueDate = new Date(subtask.dueDate);
        if (isNaN(validDueDate.getTime())) {
            // Default to main task's dueDate if subtask dueDate is invalid
            validDueDate = mainDueDate;
        }
        return {
            ...subtask,
            dueDate: validDueDate,
        };
    });

    return {
        title: data.title,
        notes: data.notes || '',
        dueDate: mainDueDate,
        notification: data.notification || 'None',
        priority: data.priority || 'Low',
        subtasks: fetchedSubtasks,
        notificationId: data.notificationId || null,
        attachments: data.attachments || [],
        colour: data.colour || COLOURS[0].value,
    };
}

// Create a new task in Firestore, schedule notification, handle attachments
export async function createTask({
    userId,
    // db,
    currentTask,
    setTaskId,
    setOriginalTask,
    setOriginalAttachments,
    setDeletedAttachments,
    setAddedAttachments,
}) {
    const {title, notes, dueDate, notification, priority, subtasks, attachments, colour} = currentTask;

    try {
        // Prepare subtasks for Firestore by converting dueDate to ISO strings
        const subtasksForDb = subtasks.map(subtask => ({
            ...subtask,
            dueDate: subtask.dueDate.toISOString(),
        }));

        // Prepare attachments for Firestore
        const attachmentsForDb = attachments.map(a => ({
            name: a.name, 
            supabaseKey: a.supabaseKey, 
            mimeType: a.mimeType,
            signedUrl: a.signedUrl,
        }));

        // Determine the next order value in unassigned tasks
        const tasksRef = collection(db, `tasks/${userId}/taskList`);
        const q = query(tasksRef, where("projectId", "==", null));
        const snapshot = await getDocs(q);
        const orderValues = snapshot.docs
            .map(doc => doc.data().order || 0)
            .sort((a, b) => b - a); // sort descending to get the max
        const nextOrder = orderValues.length > 0 ? orderValues[0] + 1 : 0;

        // Create to-do list's data
        const taskData = {
            title: title,
            notes: notes.trim() || null,
            dueDate: dueDate.toISOString(),
            notification: notification,
            priority: priority,
            subtasks: subtasksForDb,
            attachments: attachmentsForDb,
            userId: userId,
            createdAt: new Date().toISOString(),
            eventId: null,
            projectId: null,
            order: nextOrder,
            colour: colour,
        };

        // Add the task to Firestore
        const taskCollectionRef = collection(db, `tasks/${userId}/taskList`);
        const docRef = await addDoc(taskCollectionRef, taskData);
        const taskId = docRef.id;
        setTaskId(taskId);

        // Schedule Notification for the main to-do list
        let mainNotificationId = null;
        if (notification !== 'None') {
            mainNotificationId = await scheduleTaskNotification(title, notification, dueDate);
            // Update Firestore with the notificationId
            await updateDoc(doc(db, `tasks/${userId}/taskList`, taskId), {
                notificationId: mainNotificationId
            });
        }

        // Schedule Notifications for Subtasks
        for (let i = 0; i < subtasks.length; i++) {
            const subtask = subtasks[i];
            if (subtask.reminder !== 'None') {
                const subtaskNotificationId = await scheduleTaskNotification(
                    subtask.title,
                    subtask.reminder,
                    subtask.dueDate
                );
                // Update subtask with notificationId
                subtasksForDb[i].notificationId = subtaskNotificationId;
            }
        }

        // Update Firestore with subtasks' notificationIds
        await updateDoc(doc(db, `tasks/${userId}/taskList`, taskId), {
            subtasks: subtasksForDb
        });

        // Set original task and attachments
        setOriginalTask({
            title: title,
            notes: notes,
            dueDate: dueDate,
            notification: notification,
            priority: priority,
            subtasks: subtasksForDb,
            notificationId: mainNotificationId,
            attachments: attachmentsForDb,
            colour: colour,
        });

        setOriginalAttachments(attachmentsForDb);
        setDeletedAttachments([]);
        setAddedAttachments([]);

    } catch (error) {
        console.error('Error creating task:', error);
        Alert.alert('Error', 'Failed to create task.');
        throw error;
    }
}

// Save the task in Firestore, handling notifications and attachments
export async function saveTask({
    userId,
    taskId,
    // db,
    originalTask,
    currentTask,
    deletedAttachments,
    setOriginalAttachments,
    setDeletedAttachments,
    setAddedAttachments,
}) {
    const {
        title,
        notes,
        dueDate,
        notification,
        priority,
        subtasks,
        attachments,
        notificationId: currentNotifId,
        colour,
    } = currentTask;

    try {
        // Handle main task notification
        let newNotificationId = currentNotifId;
        const mainReminderChanged =
            originalTask.notification !== notification ||
            originalTask.dueDate.getTime() !== dueDate.getTime();

        if (mainReminderChanged) {
            // Cancel old notification
            if (originalTask.notificationId) {
                await cancelTaskNotification(originalTask.notificationId);
            }
            // Schedule new notification
            newNotificationId = await scheduleTaskNotification(title, notification, dueDate);
        }

        // Handle subtasks notifications
        let updatedSubtasks = [...subtasks];
        if (originalTask) {
            for (let i = 0; i < updatedSubtasks.length; i++) {
                const subtask = updatedSubtasks[i];
                const originalSubtask = originalTask.subtasks[i] || {};
                const reminderChanged = originalSubtask.reminder !== subtask.reminder;
                const dueDateChanged =
                    originalSubtask.dueDate &&
                    new Date(originalSubtask.dueDate).getTime() !== subtask.dueDate.getTime();

                if (reminderChanged || dueDateChanged) {
                    // Cancel old subtask notification
                    if (subtask.notificationId) {
                        await cancelTaskNotification(subtask.notificationId);
                    }
                    // Schedule new subtask notification if needed
                    let newSubtaskNotificationId = null;
                    if (subtask.reminder !== 'None') {
                        newSubtaskNotificationId = await scheduleTaskNotification(
                            subtask.title,
                            subtask.reminder,
                            subtask.dueDate
                        );
                    }
                    updatedSubtasks[i] = {
                        ...subtask,
                        notificationId: newSubtaskNotificationId,
                    };
                }
            }
        }

        // Convert subtasks' dueDates to ISO strings for Firestore
        updatedSubtasks = updatedSubtasks.map(s => ({
            ...s,
            // dueDate: s.dueDate.toISOString(),
            dueDate: new Date(s.dueDate).toISOString(),
        }));

        // Update Firestore document
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        await updateDoc(taskDocRef, {
            title: title,
            notes: notes.trim() || null,
            // dueDate: dueDate.toISOString(),
            dueDate: new Date(dueDate).toISOString(),
            notification: notification,
            priority: priority,
            subtasks: updatedSubtasks,
            notificationId: newNotificationId || null,
            attachments: attachments,
            colour: colour,
        });

        // Delete attachments from Supabase if flagged
        for (const attachment of deletedAttachments) {
            if (attachment.supabaseKey) {
                const success = await removeFileFromSupabase(attachment.supabaseKey);
                if (!success) {
                    Alert.alert('Error', `Failed to delete attachment "${attachment.name}" from storage.`);
                }
            }
        }

        // Clear tracking states
        setOriginalAttachments(attachments);
        setDeletedAttachments([]);
        setAddedAttachments([]);
    } catch (error) {
        Alert.alert('Error', 'Failed to save task.');
        throw error;
    }
}

// Delete the entire to-do list with notifications and attachments
export async function deleteTask(userId, task, navigation, shouldNavigateBack = true) {
    try {
        if (!userId || !task?.id) {
            throw new Error('No user or task specified');
        }
        // Cancel to-do list notifications
        if (task.notificationId) {
            console.log(`Canceling main task notification: ${task.notificationId}`);
            await cancelTaskNotification(task.notificationId);
        }

        // Cancel subtask notifications
        if (task.subtasks) {
            task.subtasks.forEach(async (subtask, index) => {
                if (subtask.notificationId) {
                    console.log(`Canceling subtask ${index} notification: ${subtask.notificationId}`);
                    await cancelTaskNotification(subtask.notificationId);
                } else {
                    console.log(`Subtask ${index} has no notificationId`);
                }
            });
        }

        // Delete attachments if needed
        if (task.attachments) {
            for (const attachment of task.attachments) {
                if (attachment.uri) {
                    await FileSystem.deleteAsync(attachment.uri, { idempotent: true });
                }
                if (attachment.supabaseKey) {
                    await removeFileFromSupabase(attachment.supabaseKey);
                }
            }
        }

        // Finally delete from Firestore
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, task.id);
        // const taskDocRef = doc(db, `projects/${userId}/userProjects/${task.projectId}/tasks`, task.id);
        await deleteDoc(taskDocRef);

        // Navigate back
        if (shouldNavigateBack) {
            navigation.goBack();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        Alert.alert('Error', 'Failed to delete task.');
        throw error;
    }
}

// Cancel task changes and reverts state, deleting any newly added attachments
export async function cancelTaskChanges({
    originalTask,
    addedAttachments,
    setAttachments,
    setDeletedAttachments,
    setAddedAttachments,
    setTaskTitle,
    setNotes,
    setDueDate,
    setNotification,
    setPriority,
    setSubtasks,
}) {
    try {
        // Remove newly added attachments from Supabase and local storage
        for (const attachment of addedAttachments) {
            if (attachment.supabaseKey) {
                await removeFileFromSupabase(attachment.supabaseKey);
            }
            if (attachment.localUri) {
                await FileSystem.deleteAsync(attachment.localUri, { idempotent: true });
            }
        }

        // Revert attachments to original
        setAttachments(originalTask.attachments || []);
        setDeletedAttachments([]);
        setAddedAttachments([]);

        // Revert other states to original task
        setTaskTitle(originalTask.title);
        setNotes(originalTask.notes);
        setDueDate(originalTask.dueDate);
        setNotification(originalTask.notification);
        setPriority(originalTask.priority);
        setSubtasks(originalTask.subtasks);
    } catch (error) {
        console.error("Error cancelling changes:", error);
        Alert.alert('Error', 'Failed to cancel task editing.');
        throw error;
    }
}

// Delete a specific subtask, handling notifications and Firestore updates
export async function deleteSubtask({
    userId,
    taskId,
    // db,
    subtasks,
    index,
    setSubtasks,
}) {
    try {
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        const updatedSubtasks = [...subtasks];
        const subtaskToDelete = updatedSubtasks[index];

        // Cancel the subtask's notification
        if (subtaskToDelete.notificationId) {
            await cancelTaskNotification(subtaskToDelete.notificationId);
        }

        // Remove the subtask from the array
        updatedSubtasks.splice(index, 1);
        const subtasksForDb = updatedSubtasks.map(s => ({
            ...s,
            dueDate: new Date(s.dueDate).toISOString(),
        }));

        // Update Firestore with the new subtasks array
        await updateDoc(taskDocRef, { subtasks: subtasksForDb });

        // Update local state
        setSubtasks(updatedSubtasks);
    } catch (error) {
        console.error('Error deleting subtask:', error);
        Alert.alert('Error', 'Failed to delete subtask.');
        throw error;
    }
}

// Add the to-do list to the user's calendar
export async function addTaskToCalendar({
    userId,
    taskId,
    // db,
    taskTitle,
    dueDate,
    setTaskNotificationId,
    promptAddEventAnyway,
}) {
    try {
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        const snapshot = await getDoc(taskDocRef);
        if (!snapshot.exists()) {
            throw new Error('Task not found.');
        }
        const data = snapshot.data();
        const existingEventId = data.eventId;

        const doAddEvent = async () => {
            console.log('[addTaskToCalendar] about to add event =>', { taskTitle, dueDate });
            const eventId = await addEventToCalendar(taskTitle, dueDate, `Task: ${taskTitle} due at ${dueDate.toLocaleString()}`, true);
            if (eventId) {
                await updateDoc(taskDocRef, { eventId });
                if (typeof setTaskNotificationId === 'function') {
                    setTaskNotificationId(eventId);
                }
            }
        };

        if (existingEventId) {
            await promptAddEventAnyway(taskTitle, dueDate, '', existingEventId, doAddEvent);
        } else {
            await doAddEvent();
        }
    } catch (error) {
        console.error('Error adding task to calendar:', error);
        Alert.alert('Error', 'Failed to add task to calendar.');
        throw error;
    }
}

// Add a subtask to the user's calendar
export async function addSubtaskToCalendar({
    userId,
    taskId,
    // db,
    subtask,
    index,
    setSubtasks,
    promptAddEventAnyway,
}) {
    try {
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        const snapshot = await getDoc(taskDocRef);
        if (!snapshot.exists()) {
            throw new Error('Task not found.');
        }

        const data = snapshot.data();
        let updatedSubtasks = data.subtasks || [];

        const doAddSubtaskEvent = async () => {
            console.log('[addSubtaskToCalendar] about to add subtask =>', subtask);
            const eventId = await addEventToCalendar(subtask.title, subtask.dueDate, `Subtask: ${subtask.title}`, true);
            if (eventId) {
                updatedSubtasks[index] = {
                    ...updatedSubtasks[index],
                    eventId,
                };
                const subtasksForDb = updatedSubtasks.map(s => ({
                    ...s,
                    dueDate: new Date(s.dueDate).toISOString(),
                }));
                await updateDoc(taskDocRef, { subtasks: subtasksForDb });

                // Update local state
                setSubtasks(prev => {
                    const copy = [...prev];
                    copy[index] = { ...copy[index], eventId };
                    return copy;
                });
            }
        };

        const existingEventId = updatedSubtasks[index]?.eventId;

        if (existingEventId) {
            await promptAddEventAnyway(subtask.title, subtask.dueDate, '', existingEventId, doAddSubtaskEvent);
        } else {
            await doAddSubtaskEvent();
        }
    } catch (error) {
        console.error('Error adding subtask to calendar:', error);
        Alert.alert('Error', 'Failed to add subtask to calendar.');
        throw error;
    }
}