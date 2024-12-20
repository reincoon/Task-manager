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

    const endDate = new Date(startDate.getTime() + 30*60*1000); // 30 min event
    try {
        const eventConfig = {
            title: title,
            startDate,
            endDate,
            timeZone: 'UTC',
            notes,
        };
        if (addAlarm) {
            // 5 minutes before event
            eventConfig.alarms = [{ relativeOffset: 0, method: Calendar.AlarmMethod.ALERT }];
        }
        const eventId = await Calendar.createEventAsync(defaultCalId, eventConfig);
        if (eventId) {
            Alert.alert('Event Added', `Event "${title}" added to calendar. Check your calendar app for any alarms or notifications.`);
        }
        return eventId;
    } catch (err) {
        console.error('Error adding event:', err);
        Alert.alert('Error', 'Failed to add event to calendar.');
        return null;
    }
}