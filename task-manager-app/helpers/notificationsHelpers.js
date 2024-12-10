import { scheduleNotification } from './notifications';
import { NOTIFICATION_TIME_OFFSETS } from './constants';

export async function scheduleTaskNotification(title, notificationKey, dueDate) {
    if (notificationKey === 'None') {
        return; // no notification needed
    }
    
    const offset = NOTIFICATION_TIME_OFFSETS[notificationKey] || 0;
    const notificationTime = new Date(dueDate.getTime() + offset);
    await scheduleNotification(title, `Reminder for task: ${title}`, notificationTime);
}