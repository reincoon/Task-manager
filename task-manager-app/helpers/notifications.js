import * as Notifications from 'expo-notifications';

export const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in settings.');
    }
};

export const scheduleNotification = async (title, message, time) => {
    if (!(time instanceof Date)) {
        console.warn('Invalid notification time, skipping scheduling.');
        return null;
    }

    if (time.getTime() <= Date.now()) {
        // No schedule if time is in the past
        return null;
    }

    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
        content: { title, body: message, sound: true },
        trigger: time,
        });
        return notificationId;
    } catch (error) {
        return null;
    }
};