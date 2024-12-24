import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import { requestNotificationPermissions } from '../helpers/notifications';
import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
// import { formatDateTime } from '../helpers/date';
import DateTimeSelector from '../components/DateTimeSelector';
import { scheduleTaskNotification, cancelTaskNotification } from '../helpers/notificationsHelpers';
import SubtaskList from '../components/SubtaskList';
import { addEventToCalendar } from '../helpers/calendar';
import { addAttachment, removeAttachment } from '../helpers/attachmentHelpers';
import AttachmentsList from '../components/AttachmentsList';

const TaskDetailsScreen = ({ route, navigation }) => {
    const { taskId } = route.params;
    const [loading, setLoading] = useState(true);
    const [taskTitle, setTaskTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [notification, setNotification] = useState('None');
    const [priority, setPriority] = useState('Low');
    const [subtasks, setSubtasks] = useState([]);
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [currentSubtask, setCurrentSubtask] = useState({
        title: '',
        dueDate: new Date(),
        priority: 'Low',
        reminder: 'None',
        isRecurrent: false,
        notificationId: null,
        eventId: null
    });
    const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
    // original task is stored to revert in case if cancelled
    const [originalTask, setOriginalTask] = useState(null); 
    // notificationId is stored to keep in case if cancelled
    const [taskNotificationId, setTaskNotificationId] = useState(null);
    const [userId, setUserId] = useState(null);

    const [attachments, setAttachments] = useState([]);


    useEffect(() => {
        requestNotificationPermissions();
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUserId(currentUser.uid);
            } else {
                Alert.alert('Error', 'No user signed in.');
                navigation.goBack();
            }
        });

        return () => {
            unsubscribe();
        };
    }, [navigation]);

    useEffect(() => {
        const fetchTask = async () => {
            if (!userId) return;

            const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
            const taskSnapshot = await getDoc(taskDocRef);
            if (!taskSnapshot.exists()) {
                Alert.alert('Error', 'Task not found.');
                navigation.goBack();
                return;
            }

            const data = taskSnapshot.data();
            // Convert to-do list dueDate to Date object
            let mainDueDate = new Date(data.dueDate);
            if (isNaN(mainDueDate.getTime())) {
                mainDueDate = new Date();
            }
            // Convert each subtask's dueDate to a Date object
            let fetchedSubtasks = data.subtasks || [];
            fetchedSubtasks = fetchedSubtasks.map(subtask => {
                let validDueDate = new Date(subtask.dueDate);
                if (isNaN(validDueDate.getTime())) {
                    // If invalid, default to current date or dueDate of the task
                    validDueDate = new Date();
                }
                return {
                    ...subtask,
                    dueDate: validDueDate,
                };    
            });

            setTaskTitle(data.title);
            setNotes(data.notes || '');
            setDueDate(mainDueDate);
            setNotification(data.notification || 'None');
            setPriority(data.priority || 'Low');
            setSubtasks(fetchedSubtasks);
            setTaskNotificationId(data.notificationId || null);

            // Initialise attachments
            const fetchedAttachments = data.attachments || [];
            setAttachments(fetchedAttachments);

            setOriginalTask({
                title: data.title,
                notes: data.notes || '',
                dueDate: mainDueDate,
                notification: data.notification || 'None',
                priority: data.priority || 'Low',
                subtasks: fetchedSubtasks,
                notificationId: data.notificationId || null,
            });

            setLoading(false);
        };
        // fetchTask();
        if (userId) {
            fetchTask();
        }
    }, [userId, taskId, navigation]);

    const handleSaveTask = async () => {
        if (!taskTitle.trim()) {
            Alert.alert('Error', 'Task title is required');
            return;
        }

        if (!userId) {
            Alert.alert('Error', 'No user signed in.');
            return;
        }

        try {
            // if saved cancel old notification and schedule new one
            let newNotificationId = taskNotificationId;
            const mainReminderChanged  = (originalTask.notification !== notification) || (originalTask.dueDate.getTime() !== dueDate.getTime());
            // If reminder changed, aattempt to reschedule
            if (mainReminderChanged ) {
                // Cancel old notification
                if (taskNotificationId) {
                    await cancelTaskNotification(taskNotificationId);
                }
                // Schedule new
                newNotificationId = await scheduleTaskNotification(taskTitle, notification, dueDate);
            }

            // Handle subtasks notifications changes
            let updatedSubtasks = [...subtasks];
            
            if (originalTask) {
                for (let i = 0; i < updatedSubtasks.length; i++) {
                    const subtask = updatedSubtasks[i];
                    const originalSubtask = originalTask.subtasks[i] || {};
                    const reminderChanged = originalSubtask.reminder !== subtask.reminder;
                    const dueDateChanged = (originalSubtask.dueDate && 
                        (new Date(originalSubtask.dueDate).getTime() !== subtask.dueDate.getTime()));

                    if (reminderChanged || dueDateChanged) {
                        // Cancel old subtask notification
                        if (subtask.notificationId) {
                            await cancelTaskNotification(subtask.notificationId);
                        }
                        // Schedule new subtask notification
                        let newSubtaskNotificationId = null;
                        if (subtask.reminder !== 'None') {
                            newSubtaskNotificationId = await scheduleTaskNotification(subtask.title, subtask.reminder, subtask.dueDate);
                        }
                        updatedSubtasks[i] = { ...subtask, notificationId: newSubtaskNotificationId };
                    }
                }
            }

            updatedSubtasks = updatedSubtasks.map(s => ({
                ...s,
                dueDate: s.dueDate.toISOString()  // Store as ISO string
            }));

            const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
            await updateDoc(taskDocRef, {
                title: taskTitle,
                notes: notes.trim() || null,
                dueDate: dueDate.toISOString(),
                notification,
                priority,
                subtasks: updatedSubtasks,
                notificationId: newNotificationId || null,
            });

            Alert.alert('Success', 'Task updated successfully');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleCancel = () => {
        // Revert to original task if the user doesn't want to save
        if (originalTask) {
            setTaskTitle(originalTask.title);
            setNotes(originalTask.notes);
            setDueDate(originalTask.dueDate);
            setNotification(originalTask.notification);
            setPriority(originalTask.priority);
            setSubtasks(originalTask.subtasks);
        }
        navigation.goBack();
    };

    const handleAddSubtask = async () => {
        if (!currentSubtask.title.trim()) {
            Alert.alert('Error', 'Subtask title is required');
            return;
        }

        // Schedule Subtask Notification
        // let newSubtaskNotificationId = null;
        let subtaskDueDate = currentSubtask.dueDate;

        if (!(subtaskDueDate instanceof Date) || isNaN(subtaskDueDate.getTime())) {
            subtaskDueDate = new Date();
        }

        // if (currentSubtask.reminder !== 'None') {
        //     newSubtaskNotificationId = await scheduleTaskNotification(currentSubtask.title, currentSubtask.reminder, subtaskDueDate);
        // }

        const updatedSubtask = {
            ...currentSubtask,
            dueDate: subtaskDueDate,
            // notificationId: newSubtaskNotificationId
        };

        if (editingSubtaskIndex !== null) {
            // Editing existing subtask
            const updatedSubtasks = [...subtasks];
            updatedSubtasks[editingSubtaskIndex] = updatedSubtask;
            setSubtasks(updatedSubtasks);
        } else {
            setSubtasks([...subtasks, updatedSubtask]);
        }
        // Reset current subtask and close sheet
        setCurrentSubtask({
            title: '',
            dueDate: new Date(),
            priority: 'Low',
            reminder: 'None',
            isRecurrent: false,
            notificationId: null
        });
        setEditingSubtaskIndex(null);
        setShowSubtaskForm(false);
    };

    // Delete the entire to-do lisy
    const handleDeleteTask = async () => {
        Alert.alert('Delete To-Do List', 'Are you sure you want to delete this to-do list?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                if (!userId) {
                    return;
                }
                const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);

                // Cancel to-do list notification
                if (taskNotificationId) {
                    await cancelTaskNotification(taskNotificationId);
                }

                // Cancel all subtasks notifications
                for (const subtask of subtasks) {
                    if (subtask.notificationId) {
                        await cancelTaskNotification(subtask.notificationId);
                    }
                }

                await deleteDoc(taskDocRef);
                Alert.alert('Deleted', 'Task deleted successfully');
                navigation.goBack();
            }}
        ]);
    };

    // Edit a subtask
    const handleEditSubtask = (index) => {
        const subtaskToEdit = subtasks[index];
        // Check date is valid
        let safeDueDate = subtaskToEdit.dueDate;
        if (!(safeDueDate instanceof Date) || isNaN(safeDueDate.getTime())) {
            safeDueDate = new Date();
        }

        setCurrentSubtask({
            ...subtaskToEdit,
            dueDate: safeDueDate
        });
        setEditingSubtaskIndex(index);
        setShowSubtaskForm(true);
    };

    // Delete a subtask
    const handleDeleteSubtask = (index) => {
        Alert.alert('Delete Subtask', 'Are you sure you want to delete this subtask?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                const updatedSubtasks = [...subtasks];
                const subtaskToDelete = updatedSubtasks[index];

                // Cancel the subtask's notification
                if (subtaskToDelete.notificationId) {
                    await cancelTaskNotification(subtaskToDelete.notificationId);
                }

                updatedSubtasks.splice(index, 1);
                setSubtasks(updatedSubtasks);

                // Update Firestore
                if (userId && taskId) {
                    const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
                    const subtasksForDb = updatedSubtasks.map(s => ({
                        ...s,
                        dueDate: s.dueDate.toISOString()
                    }));
                    await updateDoc(taskDocRef, { subtasks: subtasksForDb });
                }
            }}
        ]);
    };

    const promptAddEventAnyway = async (title, dueDate, notes, existingEventId, onConfirm) => {
        Alert.alert(
            'Already in Calendar',
            'This event already exists in your calendar. Do you want to add another one anyway?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Add Anyway', style: 'default', onPress: onConfirm }
            ]
        );
    };

    const promptAddEvent = async (title, dueDate, notes, onConfirm) => {
        Alert.alert(
            'Add to Calendar',
            `Do you want to add "${title}" to your calendar?`,
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', style: 'default', onPress: onConfirm }
            ]
        );
    };

    // Add a to-do list to calendar
    const addTaskToCalendar = async () => {
        // await addEventToCalendar(taskTitle, dueDate, `Task: ${taskTitle} due at ${dueDate.toLocaleString()}`);
        if (!userId) {
            Alert.alert('Error', 'No user logged in.');
            return;
        }
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        const snapshot = await getDoc(taskDocRef);
        if (!snapshot.exists()) {
            Alert.alert('Error', 'Task not found.');
            return;
        }
        const data = snapshot.data();
        const doAddEvent = async () => {
            const eventId = await addEventToCalendar(taskTitle, dueDate, `Task: ${taskTitle} due at ${dueDate.toLocaleString()}`, true);
            if (eventId) {
                await updateDoc(taskDocRef, { eventId });
                setTaskNotificationId(eventId);
            }
        };

        if (data.eventId) {
            await promptAddEventAnyway(taskTitle, dueDate, '', data.eventId, doAddEvent);
        } else {
            await promptAddEvent(taskTitle, dueDate, '', doAddEvent);
        }        
    };
    // Add a subtask to calendar
    const addSubtaskToCalendar  = async (subtask, index) => {
        // await addEventToCalendar(subtask.title, subtask.dueDate, `Subtask: ${subtask.title}`);
        if (!userId) {
            Alert.alert('Error', 'No user logged in.');
            return;
        }
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        const snapshot = await getDoc(taskDocRef);
        if (!snapshot.exists()) {
            Alert.alert('Error', 'Task not found.');
            return;
        }
        const data = snapshot.data();
        let updatedSubtasks = data.subtasks || [];
        
        const doAddSubtaskEvent = async () => {
            const eventId = await addEventToCalendar(subtask.title, subtask.dueDate, `Subtask: ${subtask.title}`, true);
            if (eventId) {
                updatedSubtasks[index] = {
                    ...updatedSubtasks[index],
                    eventId
                };
                await updateDoc(taskDocRef, { subtasks: updatedSubtasks });
                setSubtasks(prev => {
                    const copy = [...prev];
                    copy[index] = { ...copy[index], eventId };
                    return copy;
                });
            }
        };

        if (updatedSubtasks[index].eventId) {
            await promptAddEventAnyway(subtask.title, subtask.dueDate, '', updatedSubtasks[index].eventId, doAddSubtaskEvent);
        } else {
            await promptAddEvent(subtask.title, subtask.dueDate, '', doAddSubtaskEvent);
        }
    };

    return loading ? (
        <SafeAreaView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
        </SafeAreaView>
    ) : (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit To-Do List</Text>
                <TouchableOpacity onPress={handleSaveTask}>
                    <Ionicons name="save" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                    style={styles.input}
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    placeholder="To-Do List Title"
                />
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Notes"
                    multiline
                />

                <DateTimeSelector date={dueDate} onDateChange={setDueDate} />

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ marginBottom: 10, fontWeight: '600' }}>Reminder:</Text>
                    <NotificationPicker
                        selectedValue={notification}
                        onValueChange={setNotification}
                        options={NOTIFICATION_OPTIONS}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => setPriority(cyclePriority(priority))}
                >
                    <Text style={styles.buttonText}>Priority: {priority}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#28a745' }]}
                    onPress={() => {
                        setEditingSubtaskIndex(null);
                        setCurrentSubtask({
                            title: '',
                            dueDate: new Date(),
                            priority: 'Low',
                            reminder: 'None',
                            isRecurrent: false,
                            notificationId: null,
                            eventId: null
                        });
                        setShowSubtaskForm(true);
                    }}
                >
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add Subtask</Text>
                </TouchableOpacity>

                {/* Delete To-Do List */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: 'red' }]}
                    onPress={handleDeleteTask}
                >
                    <Ionicons name="trash-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Delete Task</Text>
                </TouchableOpacity>
                {/* Add to-do list to calendar */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FFA726' }]}
                    onPress={addTaskToCalendar}
                >
                    <Ionicons name="calendar-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add To-Do List to Calendar</Text>
                </TouchableOpacity>
                {/* List of subtasks */}
                <SubtaskList 
                    subtasks={subtasks} 
                    onEditSubtask={handleEditSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    onAddSubtaskToCalendar={addSubtaskToCalendar}
                />
                {/* Attachments */}
                <AttachmentsList
                    attachments={attachments}
                    onAddAttachment={() =>
                        addAttachment({
                            setAttachments,
                            attachments,
                            userId,
                            taskId,
                        })
                    }
                    onRemoveAttachment={(index) =>
                        removeAttachment({
                            setAttachments,
                            attachments,
                            index,
                            userId,
                            taskId,
                        })
                    }
                />
            </ScrollView>

            <SubtaskBottomSheet
                visible={showSubtaskForm}
                onClose={() => setShowSubtaskForm(false)}
                currentSubtask={currentSubtask}
                setCurrentSubtask={setCurrentSubtask}
                onSave={handleAddSubtask}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    notesInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        marginLeft: 5,
    },
    subtaskItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: 10,
    },
});

export default TaskDetailsScreen;