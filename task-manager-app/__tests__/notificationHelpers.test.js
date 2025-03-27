import { scheduleTaskNotification, cancelTaskNotification } from '../helpers/notificationsHelpers';
import * as Notifications from 'expo-notifications';

// Mocks
jest.mock('expo-notifications', () => ({
    cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
}));

// Mock the scheduleNotification function
jest.mock('../helpers/notifications', () => ({
    scheduleNotification: jest.fn(() => Promise.resolve("notifID")),
}));

// Mock constants
jest.mock('../helpers/constants', () => ({
    NOTIFICATION_TIME_OFFSETS: {
      "TestKey": 5000, // 5 seconds offset
    },
}));

describe('notificationHelpers', () => {

    describe('scheduleTaskNotification', () => {
        test('returns null when notificationKey is "None"', async () => {
            const title = "Test Task";
            const notificationKey = "None";
            const dueDate = new Date(Date.now() + 10000); // 10 seconds in the future
            const result = await scheduleTaskNotification(title, notificationKey, dueDate);
            expect(result).toBeNull();
        });

        test('schedules a notification when dueDate + offset is in the future', async () => {
            const title = "Test Task";
            const notificationKey = "TestKey"; // offset of 5000 ms
            // Set dueDate 20 seconds in the future
            const dueDate = new Date(Date.now() + 20000);
            const result = await scheduleTaskNotification(title, notificationKey, dueDate);
            expect(result).toBe("notifID");
            // Mocked scheduleNotification is called with the proper message
            const { scheduleNotification } = require('../helpers/notifications');
            expect(scheduleNotification).toHaveBeenCalledWith(title, `Reminder for task: ${title}`, expect.any(Date));
        });
    
        test('returns null when computed notification time is not in the future', async () => {
            const title = "Test Task";
            const notificationKey = "TestKey"; // offset 5000 ms
            // Set dueDate such that dueDate + offset is in the past
            const dueDate = new Date(Date.now() - 10000);
            const result = await scheduleTaskNotification(title, notificationKey, dueDate);
            expect(result).toBeNull();
        });
    });

    describe('cancelTaskNotification', () => {
        test('cancels scheduled notification when a valid id is provided', async () => {
            const notificationId = "notifID";
            await cancelTaskNotification(notificationId);
            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(notificationId);
        });
    });
});