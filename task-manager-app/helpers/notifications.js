import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

export const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in settings.');
    }
};

export const scheduleNotification = async (title, message, time) => {
    if (!(time instanceof Date)) {
        Alert.alert('Error', 'Invalid notification time.');
        return;
    }

    if (time.getTime() <= Date.now()) {
        // No schedule if time is in the past
        return;
    }

    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
        content: { title, body: message, sound: true },
        trigger: time,
        });
        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
    }
};