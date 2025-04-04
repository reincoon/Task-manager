import { scheduleNotification } from './notifications';
import { NOTIFICATION_TIME_OFFSETS } from './constants';
import * as Notifications from 'expo-notifications';

export async function scheduleTaskNotification(title, notificationKey, dueDate) {
    if (notificationKey === 'None') {
        return null; // no notification needed
    }

    const offset = NOTIFICATION_TIME_OFFSETS[notificationKey] || 0;
    const notificationTime = new Date(dueDate.getTime() + offset);
    // ensure notificationTime is in future
    if (notificationTime.getTime() <= Date.now()) {
        return null;
    }
    return await scheduleNotification(title, `Reminder for task: ${title}`, notificationTime);
}

export async function cancelTaskNotification(notificationId) {
    if (!notificationId) {
        return;
    }

    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
        console.error('Error cancelling notification:', error);
    }
}