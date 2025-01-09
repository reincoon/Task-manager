import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { cancelTaskNotification } from '../helpers/notificationsHelpers'; 
import { removeFileFromSupabase } from '../helpers/supabaseStorageHelpers';
import * as FileSystem from 'expo-file-system';

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
        throw error;
    }
}