import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import { requestNotificationPermissions, scheduleNotification } from '../helpers/notifications';
import { NOTIFICATION_OPTIONS, NOTIFICATION_TIME_OFFSETS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
// import { formatDateTime } from '../helpers/date';
import DateTimeSelector from '../components/DateTimeSelector';
import { scheduleTaskNotification } from '../helpers/notificationsHelpers';
import SubtaskList from '../components/SubtaskList';
import { addEventToCalendar } from '../helpers/calendar';
import AttachmentsList from '../components/AttachmentsList';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { addAttachment, removeAttachment } from '../helpers/attachmentHelpers';

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
    });
    const [attachments, setAttachments] = useState([]);

    const [taskId, setTaskId] = useState(null);
    const [userId, setUserId] = useState(null);

    // Request permissions for notifications
    useEffect(() => {
        requestNotificationPermissions();
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUserId(currentUser.uid);
        }
    }, []);

    

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
        // await scheduleTaskNotification(currentSubtask.title, currentSubtask.reminder, currentSubtask.dueDate);

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
        if (taskId && userId) {
            const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
            const subtasksForDb = updatedSubtasks.map(s => ({
                ...s,
                dueDate: s.dueDate.toISOString()
            }));
            await updateDoc(taskDocRef, { subtasks: subtasksForDb });
        }

        setCurrentSubtask({
            title: '',
            dueDate: new Date(),
            priority: 'Low',
            reminder: 'None',
            isRecurrent: false,
        });
        setShowSubtaskForm(false);
    };

    // const handleAddAttachment = async () => {
    //     try {
    //         const result = await DocumentPicker.getDocumentAsync({
    //             copyToCacheDirectory: true,
    //             type: '*/*',
    //         });
    //         if (result.canceled) {
    //             return;
    //         }
    //         console.log('DocumentPicker result:', result);

    //         const { name, uri } = result.assets?.[0] ?? {};
    //         if (!uri) {
    //             Alert.alert('Error', 'No file URI found.');
    //             return;
    //         }
    //         // Copy a file to local storage
    //         const fileName = `${Date.now()}-${name}`;
    //         const newUri = FileSystem.documentDirectory + fileName;
    //         try {
    //             await FileSystem.copyAsync({ from: uri, to: newUri });
    //             console.log('File copied to local sandbox at: ', newUri);
    //         } catch (copyErr) {
    //             console.log('copyAsync error:', copyErr);
    //             try {
    //                 const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    //                 await FileSystem.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    //                 console.log('File written from base64 to:', newUri);
    //             } catch (base64Err) {
    //                 console.log('base64 fallback error:', base64Err);
    //                 Alert.alert('Error', 'Failed to load the file. Please try a different file type or location.');
    //                 return;
    //             }
    //         }

    //         // const info = await FileSystem.getInfoAsync(newUri);
    //         const info = await FileSystem.getInfoAsync(newUri);
    //         console.log('File info from DocumentPicker:', info);

    //         if (!info.exists) {
    //             Alert.alert('File not downloaded', 'This file might still be in iCloud. Please open it in the Files app or choose a file that is stored locally.');
    //             return;
    //         }
            
    //         const newAttachment = { name, uri: newUri };
    //         const updatedAttachments = [...attachments, newAttachment];
    //         setAttachments(updatedAttachments);
    //         // Update Firestore references
    //         if (taskId && userId) {
    //             const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
    //             await updateDoc(taskDocRef, { attachments: updatedAttachments });
    //         }
    //     } catch (error) {
    //         console.log('DocumentPicker error:', error);
    //         Alert.alert('Error', 'Failed to pick the file');
    //     }
    // }

    // const handleRemoveAttachment = async (index) => {
    //     const updatedAttachments = [...attachments];
    //     const removed = updatedAttachments.splice(index, 1);
    //     setAttachments(updatedAttachments);
    //     // If task is already saved
    //     if (taskId && userId) {
    //         const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
    //         await updateDoc(taskDocRef, { attachments: updatedAttachments });
    //     }
    //     // Delete the file from local storage:
    //     await FileSystem.deleteAsync(removed[0].uri);
    // }

    const handleSaveTask = async () => {
        if (!taskTitle.trim()) {
            Alert.alert('Error', 'Task title is required');
            return;
        }

        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert('Error', 'You need to be logged in to create a task');
            return;
        }

        try {
            const subtasksForDb = subtasks.map(s => ({...s, dueDate: s.dueDate.toISOString()}));
            const attachmentsForDb = attachments.map(a => ({ name: a.name, uri: a.uri }));

            const taskData = {
                title: taskTitle,
                notes: notes.trim() || null,
                dueDate: dueDate.toISOString(),
                notification,
                priority,
                subtasks: subtasksForDb,
                attachments: attachmentsForDb,
                userId,
                createdAt: new Date().toISOString(),
                eventId: null
            };
            const taskRef = collection(db, `tasks/${userId}/taskList`);
            const docRef = await addDoc(taskRef, taskData);

            // Schedule Notification for to-do list
            let mainNotificationId = null;
            if (notification !== 'None') {
                mainNotificationId = await scheduleTaskNotification(taskTitle, notification, dueDate);
            }
            // Update Firestore with mainNotificationId
            if (mainNotificationId) {
                await updateDoc(doc(db, `tasks/${userId}/taskList`, docRef.id), {
                notificationId: mainNotificationId
                });
            }

            Alert.alert('Success', 'Task created successfully');
            setTaskId(docRef.id);
            navigation.navigate('Home');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const addMainTaskToCalendar = async () => {
        // await addEventToCalendar(taskTitle, dueDate, `Task: ${taskTitle} due at ${dueDate.toLocaleString()}`);
        if (!userId || !taskId) {
            Alert.alert('Info', 'You need to save the task first before adding it to calendar.');
            return;
        }

        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        const snapshot = await getDoc(taskDocRef);
        if (!snapshot.exists()) {
            Alert.alert('Error', 'Task not found.');
            return;
        }
        const data = snapshot.data();
        if (data.eventId) {
            Alert.alert('Already in Calendar', 'This task is already added to your calendar.');
            return;
        }

        const eventId = await addEventToCalendar(taskTitle, dueDate, `Task: ${taskTitle} due at ${dueDate.toLocaleString()}`);
        if (eventId) {
            await updateDoc(taskDocRef, { eventId });
        }
    };

    const addSubtaskToCalendar = async (subtask) => {
        // await addEventToCalendar(subtask.title, subtask.dueDate, `Subtask: ${subtask.title}`);
        if (!userId || !taskId) {
            Alert.alert('Info', 'You need to save the task first before adding subtasks to calendar.');
            return;
        }

        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        const snapshot = await getDoc(taskDocRef);
        if (!snapshot.exists()) {
            Alert.alert('Error', 'Task not found.');
            return;
        }
        let data = snapshot.data();
        let updatedSubtasks = data.subtasks || [];
        const currentSubtaskData = updatedSubtasks[index];
        if (currentSubtaskData.eventId) {
            Alert.alert('Already in Calendar', 'This subtask is already added to your calendar.');
            return;
        }

        // create event
        const eventId = await addEventToCalendar(subtask.title, subtask.dueDate, `Subtask: ${subtask.title}`);
        if (eventId) {
            updatedSubtasks[index] = {
                ...updatedSubtasks[index],
                eventId
            };
            await updateDoc(taskDocRef, { subtasks: updatedSubtasks });
        }
    };

    const setPriority = (p) => setPriorityState(cyclePriority(p));

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Create To-Do List</Text>
                <TouchableOpacity onPress={handleSaveTask}>
                    <Ionicons name="save" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Main to-do list form */}
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
                    onPress={() => setPriority(priority)}
                >
                    <Text style={styles.buttonText}>Priority: {priority}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#28a745' }]}
                    onPress={() => setShowSubtaskForm(true)}
                >
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add Subtask</Text>
                </TouchableOpacity>

                <SubtaskList 
                    subtasks={subtasks}
                    onEditSubtask={() => {}}
                    onDeleteSubtask={(index) => {
                        const updated = [...subtasks];
                        updated.splice(index, 1);
                        setSubtasks(updated);
                    }}
                    onAddSubtaskToCalendar={(subtask, idx) => addSubtaskToCalendar(subtask, idx)}
                />
                {/* Add main task to calendar */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FFA726' }]}
                    onPress={addMainTaskToCalendar}
                >
                    <Ionicons name="calendar-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add To-Do List to Calendar</Text>
                </TouchableOpacity>
                {/* Attachments */}
                <AttachmentsList 
                    attachments={attachments}
                    // onAddAttachment={handleAddAttachment}
                    onAddAttachment={() =>
                        addAttachment({
                            setAttachments,
                            attachments,
                            userId,
                            taskId,
                        })
                    }
                    // onRemoveAttachment={handleRemoveAttachment}
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
            
            {/* Subtask Bottom Sheet */}
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
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },
});

export default TaskCreationScreen;