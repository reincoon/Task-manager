import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import { requestNotificationPermissions, scheduleNotification } from '../helpers/notifications';
import { NOTIFICATION_OPTIONS, NOTIFICATION_TIME_OFFSETS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
// import { formatDateTime } from '../helpers/date';
import DateTimeSelector from '../components/DateTimeSelector';
import { scheduleTaskNotification } from '../helpers/notificationsHelpers';
import SubtaskList from '../components/SubtaskList';

const TaskCreationScreen = ({ navigation }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    // const [showDatePicker, setShowDatePicker] = useState(false);
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
    });


    // Request permissions for notifications
    useEffect(() => {
        requestNotificationPermissions();
    }, []);

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
            const taskData = {
                title: taskTitle,
                notes: notes.trim() || null,
                dueDate: dueDate.toISOString(),
                notification,
                priority,
                subtasks,
                userId,
                createdAt: new Date().toISOString(),
            };
            const taskRef = collection(db, `tasks/${userId}/taskList`);
            await addDoc(taskRef, taskData);

            // Schedule Notification
            await scheduleTaskNotification(taskTitle, notification, dueDate);

            Alert.alert('Success', 'Task created successfully');
            navigation.navigate('Home');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleAddSubtask = async () => {
        if (!currentSubtask.title.trim()) {
            Alert.alert('Error', 'Subtask title is required');
            return;
        }

        // Schedule Subtask Notification
        await scheduleTaskNotification(currentSubtask.title, currentSubtask.reminder, currentSubtask.dueDate);

        // Add the subtask
        setSubtasks([...subtasks, currentSubtask]);
        setCurrentSubtask({
            title: '',
            dueDate: new Date(),
            priority: 'Low',
            reminder: 'None',
            isRecurrent: false,
        });
        setShowSubtaskForm(false);
    };

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
                    onPress={() => setPriority(cyclePriority(priority))}
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

                <SubtaskList subtasks={subtasks} />
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
    subtaskItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: 10,
    },
});

export default TaskCreationScreen;