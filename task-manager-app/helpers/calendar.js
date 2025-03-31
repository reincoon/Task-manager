import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export async function ensureCalendarPermissions() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission required', 'Calendar permission is not granted.');
        return false;
    }

    if (Platform.OS === 'ios') {
        const { status: reminderStatus } = await Calendar.requestRemindersPermissionsAsync();
        if (reminderStatus !== 'granted') {
            Alert.alert('Permission required', 'Reminders permission is not granted.');
            return false;
        }
    }
    return true;
}

export async function getDefaultCalendarId() {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    let defaultCalendar = calendars.find(cal => cal.source && cal.source.isLocalAccount && !cal.isHidden) || calendars[0];
    if (!defaultCalendar) {
        Alert.alert('No Calendar', 'No default calendar found on this device.');
        return null;
    }
    return defaultCalendar.id;
}

export async function addEventToCalendar(title, startDate, notes = '', addAlarm = true) {
    const allowed = await ensureCalendarPermissions();
    if (!allowed) return null;

    const defaultCalId = await getDefaultCalendarId();
    if (!defaultCalId) return null;

    if (!title || typeof title !== 'string') {
        title = 'Untitled';
    }
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        startDate = new Date(Date.now() + 60_000);
    }
    if (!notes || typeof notes !== 'string') {
        notes = '';
    }

    // A 30-minute event
    const endDate = new Date(startDate.getTime() + 30*60*1000);
    const eventConfig = {
        title,
        startDate,
        endDate,
        notes,
    };
    if (addAlarm) {
        // 5 minutes before event
        eventConfig.alarms = [{ relativeOffset: 0, method: Calendar.AlarmMethod.ALERT }];
    }
    try {
        const eventId = await Calendar.createEventAsync(defaultCalId, eventConfig);
        if (eventId) {
            Alert.alert('Event Added', `Event "${title}" added to calendar. Check your calendar app for any alarms or notifications.`);
        }
        return eventId;
    } catch (err) {
        Alert.alert('Error', 'Failed to add event to calendar.');
        return null;
    }
}