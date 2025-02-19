import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import { requestNotificationPermissions, scheduleNotification } from '../helpers/notifications';
import { COLOURS, NOTIFICATION_OPTIONS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
import DateTimeSelector from '../components/DateTimeSelector';
import { scheduleTaskNotification } from '../helpers/notificationsHelpers';
import SubtaskList from '../components/SubtaskList';
import AttachmentsList from '../components/AttachmentsList';
import * as FileSystem from 'expo-file-system';
import { addAttachmentOfflineAndOnline, removeAttachment, deleteAllAttachmentsFromSupabase } from '../helpers/attachmentHelpers';
import { removeFileFromSupabase } from '../helpers/supabaseStorageHelpers';
import { createTask, addSubtaskToCalendar, addTaskToCalendar } from '../helpers/taskActions';
import ColourPicker from '../components/ColourPicker';
import SpeechToTextButton from '../components/SpeechToTextButton';

const TaskCreationScreen = ({ navigation }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [notification, setNotification] = useState('None');
    const [priority, setPriorityState] = useState('Low');
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
    const [originalAttachments, setOriginalAttachments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [addedAttachments, setAddedAttachments] = useState([]);
    const [deletedAttachments, setDeletedAttachments] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const [taskId, setTaskId] = useState(null);
    const [userId, setUserId] = useState(null);

    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [selectedColour, setSelectedColour] = useState(COLOURS[0].value);

    // Request permissions for notifications and get user ID
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

    // Add or edit a subtask by updating the local state
    const handleAddSubtask = async () => {
        if (!currentSubtask.title.trim()) {
            Alert.alert('Error', 'Subtask title is required');
            return;
        }

        let subtaskDueDate = currentSubtask.dueDate;
        if (!(subtaskDueDate instanceof Date) || isNaN(subtaskDueDate.getTime())) {
            subtaskDueDate = new Date();
        }

        // Schedule Subtask Notification
        let subtaskNotificationId = null;
        if (currentSubtask.reminder !== 'None') {
            subtaskNotificationId = await scheduleTaskNotification(
                currentSubtask.title,
                currentSubtask.reminder,
                subtaskDueDate
            );
        }

        const newSubtask = {
            ...currentSubtask,
            dueDate: subtaskDueDate,
            notificationId: subtaskNotificationId || null
        };

        // Add the subtask
        setSubtasks([...subtasks, newSubtask]);

        setCurrentSubtask({
            title: '',
            dueDate: new Date(),
            priority: 'Low',
            reminder: 'None',
            isRecurrent: false,
            notificationId: null,
            eventId: null,
        });
        setShowSubtaskForm(false);
    };

    // Save the new to-do list by calling the createTask helper function
    const handleSaveTask = async () => {
        if (isSaving) return;
        setIsSaving(true);

        if (!taskTitle.trim()) {
            Alert.alert('Error', 'Task title is required');
            setIsSaving(false);
            return;
        }

        if (!userId) {
            Alert.alert('Error', 'You need to be logged in to create a task');
            setIsSaving(false);
            return;
        }

        try {
            const currentTask = {
                title: taskTitle,
                notes,
                dueDate,
                notification,
                priority,
                subtasks,
                attachments,
                colour: selectedColour,
            };

            await createTask({
                userId,
                db,
                currentTask,
                setTaskId,
                setOriginalTask: () => {},
                setOriginalAttachments: setOriginalAttachments,
                setDeletedAttachments: setDeletedAttachments,
                setAddedAttachments: setAddedAttachments,
            });

            Alert.alert('Success', 'Task created successfully');
            navigation.navigate('Home');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Add the to-do list to the calendar by calling the addTaskToCalendar helper function
    const addMainTaskToCalendar = async () => {
        if (!userId || !taskId) {
            Alert.alert('Info', 'You need to save the task first before adding it to calendar.');
            return;
        }

        try {
            await addTaskToCalendar({
                userId,
                taskId,
                db,
                taskTitle,
                dueDate,
                setTaskNotificationId: () => {},
                promptAddEventAnyway: (title, date, notes, existingId, onConfirm) => {
                    Alert.alert(
                        'Already in Calendar',
                        'This event already exists. Do you want to add another one anyway?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Add Anyway', onPress: onConfirm },
                        ]
                    );
                },
            });
        } catch (error) {
            console.error('Error adding task to calendar:', error);
            Alert.alert('Error', 'Failed to add task to calendar.');
        }
    };

    // Add a subtask to the calendar by calling the addSubtaskToCalendar helper function
    const addSubtaskToCalendarHandler = async (subtask, index) => {
        if (!userId || !taskId) {
            Alert.alert('Info', 'You need to save the task first before adding subtasks to calendar.');
            return;
        }

        try {
            await addSubtaskToCalendar({
                userId,
                taskId,
                db,
                subtask,
                index,
                setSubtasks,
                promptAddEventAnyway: (title, date, notes, existingId, onConfirm) => {
                    Alert.alert(
                        'Already in Calendar',
                        'This subtask already exists. Do you want to add another one anyway?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Add Anyway', onPress: onConfirm },
                        ]
                    );
                },
            });
        } catch (error) {
            console.error('Error adding subtask to calendar:', error);
            Alert.alert('Error', 'Failed to add subtask to calendar.');
        }
    };

    // Cancel the to-do list creation by deleting any newly added attachments and resetting the form
    const handleCancel = async () => {
        if (isCancelling) return;
        setIsCancelling(true);

        try {
            // Delete 'addedAttachments' from Supabase and local storage
            for (const attachment of addedAttachments) {
                if (attachment.supabaseKey) {
                    await removeFileFromSupabase(attachment.supabaseKey);
                }
                if (attachment.localUri) {
                    await FileSystem.deleteAsync(attachment.localUri, { idempotent: true });
                }
            }

            // Revert
            setAttachments([]);
            // Clear tracking states
            setDeletedAttachments([]);
            setAddedAttachments([]);

            // Reset other form fields
            setTaskTitle('');
            setNotes('');
            setDueDate(new Date());
            setNotification('None');
            setPriorityState('Low');
            setSubtasks([]);
            setSelectedColour(COLOURS[0].value);

            navigation.goBack();
        } catch (error) {
            console.log('Error during cancellation:', error);
            Alert.alert('Error', 'Failed to cancel task editing.');
        } finally {
            setIsCancelling(false);
        }
    }

    const setPriority = (p) => setPriorityState(cyclePriority(p));

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} disabled={isCancelling || isUploadingAttachment}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Create To-Do List</Text>
                <TouchableOpacity 
                    onPress={handleSaveTask}
                    disabled={isSaving || isUploadingAttachment}
                >
                    <Ionicons name="save" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Main to-do list form */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <View style={styles.titleContainer}>
                    <TextInput
                        style={styles.input}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        placeholder="To-Do List Title"
                    />
                    {/* Microphone button */}
                    <SpeechToTextButton onTranscribedText={(text) => setTaskTitle(text)}/>
                </View>
                {/* Notes */}
                <View style={styles.notesContainer}>
                    <TextInput
                        style={[styles.input, styles.notesInput, { flex: 1, marginRight: 10 }]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Notes"
                        multiline
                    />
                    <SpeechToTextButton
                        onTranscribedText={(text) => setNotes(text)}
                    />
                </View>
                

                {/* Color Picker */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ marginBottom: 10, fontWeight: '600' }}>Category Colour:</Text>
                    <ColourPicker
                        selectedColour={selectedColour}
                        onSelectColour={setSelectedColour}
                    />
                </View>

                {/* Due date selector */}
                <DateTimeSelector date={dueDate} onDateChange={setDueDate} />

                {/* Notification picker */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ marginBottom: 10, fontWeight: '600' }}>Reminder:</Text>
                    <NotificationPicker
                        selectedValue={notification}
                        onValueChange={setNotification}
                        options={NOTIFICATION_OPTIONS}
                    />
                </View>

                {/* Priority button */}
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => setPriority(priority)}
                >
                    <Text style={styles.buttonText}>Priority: {priority}</Text>
                </TouchableOpacity>

                {/* Add subtask button */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#28a745' }]}
                    onPress={() => {
                        setShowSubtaskForm(true);
                        setCurrentSubtask({
                            title: '',
                            dueDate: new Date(),
                            priority: 'Low',
                            reminder: 'None',
                            isRecurrent: false,
                            notificationId: null,
                            eventId: null,
                        });
                    }}
                >
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add Subtask</Text>
                </TouchableOpacity>

                {/* Subtasks list */}
                <SubtaskList 
                    subtasks={subtasks}
                    onEditSubtask={() => {}}
                    onDeleteSubtask={(index) => {
                        const updated = [...subtasks];
                        updated.splice(index, 1);
                        setSubtasks(updated);
                    }}
                    onAddSubtaskToCalendar={(subtask, idx) => addSubtaskToCalendarHandler(subtask, idx)}
                />
                {/* Add to-do list to calendar */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FFA726' }]}
                    onPress={addMainTaskToCalendar}
                >
                    <Ionicons name="calendar-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add To-Do List to Calendar</Text>
                </TouchableOpacity>
                {/* Attachments list*/}
                <AttachmentsList 
                    attachments={attachments}
                    setAttachments={setAttachments}
                    // onAddAttachment={handleAddAttachment}
                    onAddAttachment={() =>
                        addAttachmentOfflineAndOnline({
                            attachments,
                            setAttachments,
                            addedAttachments,
                            setAddedAttachments,
                        })
                    }
                    onRemoveAttachment={(index) =>
                        removeAttachment({
                            attachments,
                            setAttachments,
                            index,
                            shouldDeleteSupabase: false,
                        })
                    }
                    setIsUploading={setIsUploadingAttachment}
                />
            </ScrollView>
            
            {/* Subtask form modal */}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        padding: 16,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
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
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },
});

export default TaskCreationScreen;