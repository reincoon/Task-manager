import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { cancelTaskNotification, scheduleTaskNotification } from '../helpers/notificationsHelpers'; 
import { removeFileFromSupabase } from '../helpers/supabaseStorageHelpers';
import { addEventToCalendar } from './calendar';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Fetch task details from Firestore
export async function fetchTaskDetails(userId, taskId, db) {
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
    };
}

// Save the task in Firestore, handling notifications and attachments
export async function saveTask({
    userId,
    taskId,
    db,
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
    } = currentTask;

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
        dueDate: s.dueDate.toISOString(),
    }));

    // Update Firestore document
    const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
    await updateDoc(taskDocRef, {
        title: title,
        notes: notes.trim() || null,
        dueDate: dueDate.toISOString(),
        notification: notification,
        priority: priority,
        subtasks: updatedSubtasks,
        notificationId: newNotificationId || null,
        attachments: attachments,
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
}

export async function deleteTask(userId, task, navigation) {
    try {
        if (!userId || !task?.id) {
            throw new Error('No user or task specified');
        }
        // e.g. Cancel notifications
        if (task.notificationId) {
            await cancelTaskNotification(task.notificationId);
        }

        // Cancel subtask notifications
        if (task.subtasks) {
            for (const subtask of task.subtasks) {
                if (subtask.notificationId) {
                    await cancelTaskNotification(subtask.notificationId);
                }
            }
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
        await deleteDoc(taskDocRef);

        // Navigate back
        navigation.goBack();
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
    db,
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

// Add the main task to the user's calendar
export async function addTaskToCalendar({
    userId,
    taskId,
    db,
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
            const eventId = await addCalendarEvent(taskTitle, dueDate, `Task: ${taskTitle} due at ${dueDate.toLocaleString()}`, true);
            if (eventId) {
                await updateDoc(taskDocRef, { eventId });
                setTaskNotificationId(eventId);
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
    db,
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
            const eventId = await addCalendarEvent(subtask.title, subtask.dueDate, `Subtask: ${subtask.title}`, true);
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