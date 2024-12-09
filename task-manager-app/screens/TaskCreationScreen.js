import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, FlatList, Modal, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

const TaskCreationScreen = ({ navigation }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
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
    const [showSubtaskDatePicker, setShowSubtaskDatePicker] = useState(false);

    const notificationOptions = [
        'None',
        'At Due Time',
        '5 Minutes Before',
        '10 Minutes Before',
        '15 Minutes Before',
        '1 Hour Before',
        '1 Day Before',
        '1 Week Before',
    ];

    // Request permissions for notifications
    useEffect(() => {
        const requestNotificationPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'You need to enable notifications to receive alerts.');
                return;
            }
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Push token:', token);
        };
        requestNotificationPermissions();
    }, []);

    const scheduleNotification = async (title, message, time) => {
        if (time <= Date.now()) {
            Alert.alert('Error', 'Notification time must be in the future.');
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

    const cancelNotification = async (notificationId) => {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            console.log(`Notification with ID ${notificationId} canceled.`);
        } catch (error) {
            console.error('Error canceling notification:', error);
        }
    };

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
            if (notification !== 'None') {
                const timeDiffMap = {
                    'At Due Time': 0,
                    '5 Minutes Before': -5 * 60 * 1000,
                    '10 Minutes Before': -10 * 60 * 1000,
                    '15 Minutes Before': -15 * 60 * 1000,
                    '1 Hour Before': -60 * 60 * 1000,
                    '1 Day Before': -24 * 60 * 60 * 1000,
                    '1 Week Before': -7 * 24 * 60 * 60 * 1000,
                };
                const notificationTime = new Date(
                    dueDate.getTime() + (timeDiffMap[notification] || 0)
                );
                await scheduleNotification(taskTitle, `Reminder for task: ${taskTitle}`, notificationTime);
            }

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
        setSubtasks([...subtasks, currentSubtask]);

        // Schedule Subtask Notification
        if (currentSubtask.reminder !== 'None') {
            const timeDiffMap = {
                'At Due Time': 0,
                '5 Minutes Before': -5 * 60 * 1000,
                '10 Minutes Before': -10 * 60 * 1000,
                '15 Minutes Before': -15 * 60 * 1000,
                '1 Hour Before': -60 * 60 * 1000,
                '1 Day Before': -24 * 60 * 60 * 1000,
                '1 Week Before': -7 * 24 * 60 * 60 * 1000,
            };
            const notificationTime = new Date(
                currentSubtask.dueDate.getTime() + (timeDiffMap[currentSubtask.reminder] || 0)
            );
            await scheduleNotification(
                currentSubtask.title,
                `Reminder for subtask: ${currentSubtask.title}`,
                notificationTime
            );
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

    const renderSubtaskItem = ({ item, index }) => (
        <View style={styles.subtaskItem}>
            <Text>{item.title} (Priority: {item.priority})</Text>
            <Text>Due: {item.dueDate.toLocaleDateString()}</Text>
            {item.reminder !== 'None' && <Text>Reminder: {item.reminder}</Text>}
            {item.isRecurrent && <Text>Recurrent: Yes</Text>}
        </View>
    );

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

            <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.buttonText}>Set Due Date: {dueDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={dueDate}
                    mode="datetime"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setDueDate(selectedDate);
                        }
                    }}
                />
            )}

            <TouchableOpacity style={styles.button}>
                <Picker
                    selectedValue={notification}
                    onValueChange={(itemValue) => setNotification(itemValue)}
                    style={styles.picker}
                >
                    {notificationOptions.map((option) => (
                        <Picker.Item key={option} label={option} value={option} />
                    ))}
                </Picker>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Priority: {priority}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#28a745' }]}
                onPress={() => setShowSubtaskForm(true)}
            >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Add Subtask</Text>
            </TouchableOpacity>

            {subtasks.length > 0 && (
                <FlatList
                    data={subtasks}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderSubtaskItem}
                    style={styles.subtaskList}
                />
            )}
            <Modal
                visible={showSubtaskForm}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowSubtaskForm(false)}
            >
                <View style={styles.modal}>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Subtask</Text>
                        <TextInput
                            style={styles.input}
                            value={currentSubtask.title}
                            onChangeText={(text) => setCurrentSubtask({ ...currentSubtask, title: text })}
                            placeholder="Subtask Title"
                        />
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() =>
                                setCurrentSubtask({
                                    ...currentSubtask,
                                    priority: currentSubtask.priority === 'Low' ? 'High' : 'Low',
                                })
                            }
                        >
                            <Text style={styles.buttonText}>Priority: {currentSubtask.priority}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() =>
                                setCurrentSubtask({
                                    ...currentSubtask,
                                    isRecurrent: !currentSubtask.isRecurrent,
                                })
                            }
                        >
                            <Text style={styles.buttonText}>
                                Recurrent: {currentSubtask.isRecurrent ? 'Yes' : 'No'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setShowSubtaskDatePicker(true)}
                        >
                            <Text style={styles.buttonText}>Pick Date for Subtask</Text>
                        </TouchableOpacity>

                        {showSubtaskDatePicker && (
                            <DateTimePicker
                                value={currentSubtask.dueDate}
                                mode="datetime"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowSubtaskDatePicker(false);
                                    if (selectedDate) {
                                        setCurrentSubtask({ ...currentSubtask, dueDate: selectedDate });
                                    }
                                }}
                            />
                        )}

                        <TouchableOpacity style={styles.button}>
                            <Picker
                                selectedValue={currentSubtask.reminder}
                                onValueChange={(value) =>
                                    setCurrentSubtask({ ...currentSubtask, reminder: value })
                                }
                                style={styles.picker}
                            >
                                {notificationOptions.map((option) => (
                                    <Picker.Item key={option} label={option} value={option} />
                                ))}
                            </Picker>
                        </TouchableOpacity>

                        <Button title="Save Subtask" onPress={handleAddSubtask} />
                        <Button title="Cancel" onPress={() => setShowSubtaskForm(false)} />
                    </ScrollView>
                </View>
            </Modal>
            
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
        marginBottom: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },
    modal: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        padding: 20,
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
    },
});

export default TaskCreationScreen;

// import { useState, useEffect } from 'react';
// import { SafeAreaView, View, Text, FlatList, Modal, ScrollView, Alert, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { db, auth } from '../firebaseConfig';
// import { collection, addDoc } from 'firebase/firestore';
// import * as Notifications from 'expo-notifications';
// import TaskDetails from '../components/TaskDetails';
// import SubtaskForm from '../components/SubtaskForm';
// import DatePicker from '../components/DatePicker';

// const TaskCreationScreen = ({ navigation }) => {
//     const [taskTitle, setTaskTitle] = useState('');
//     const [notes, setNotes] = useState('');
//     const [dueDate, setDueDate] = useState(new Date());
//     const [showDatePicker, setShowDatePicker] = useState(false);
//     const [notification, setNotification] = useState('None');
//     const [priority, setPriority] = useState('Low');
//     const [subtasks, setSubtasks] = useState([]);
//     const [showSubtaskForm, setShowSubtaskForm] = useState(false);
//     const [currentSubtask, setCurrentSubtask] = useState({
//         title: '',
//         dueDate: new Date(),
//         priority: 'Low',
//         reminder: 'None',
//         isRecurrent: false,
//     });
//     const [showSubtaskDatePicker, setShowSubtaskDatePicker] = useState(false);

//     const notificationOptions = [
//         'None',
//         'At Due Time',
//         '5 Minutes Before',
//         '10 Minutes Before',
//         '15 Minutes Before',
//         '1 Hour Before',
//         '1 Day Before',
//         '1 Week Before',
//     ];

//     useEffect(() => {
//         const requestNotificationPermissions = async () => {
//             const { status } = await Notifications.requestPermissionsAsync();
//             if (status !== 'granted') {
//                 Alert.alert('Permission required', 'You need to enable notifications to receive alerts.');
//             }
//         };

//         requestNotificationPermissions();
//     }, []);

//     const scheduleNotification = async (title, message, time) => {
//         if (time <= Date.now()) return;
//         await Notifications.scheduleNotificationAsync({
//             content: { title, body: message },
//             trigger: { date: time },
//         });
//     };

//     const handleSaveTask = async () => {
//         if (!taskTitle.trim()) {
//             Alert.alert('Error', 'Task title is required');
//             return;
//         }

//         const userId = auth.currentUser?.uid;
//         if (!userId) {
//             Alert.alert('Error', 'You need to be logged in to create a task');
//             return;
//         }

//         const newTask = {
//             taskTitle,
//             notes,
//             priority,
//             dueDate,
//             notification,
//             subtasks,
//             userId,
//         };

//         try {
//             const docRef = await addDoc(collection(db, 'tasks'), newTask);
//             Alert.alert('Success', 'Task created successfully');
//             navigation.goBack();
//         } catch (e) {
//             Alert.alert('Error', 'Failed to save task');
//             console.error(e);
//         }
//     };

//     const handleAddSubtask = () => {
//         if (!currentSubtask.title.trim()) {
//             Alert.alert('Error', 'Subtask title is required');
//             return;
//         }

//         setSubtasks([...subtasks, currentSubtask]);
//         setCurrentSubtask({
//             title: '',
//             dueDate: new Date(),
//             priority: 'Low',
//             reminder: 'None',
//             isRecurrent: false,
//         });
//         setShowSubtaskForm(false);
//     };

//     return (
//         <SafeAreaView style={{ flex: 1, padding: 20 }}>
//             <ScrollView>
//                 <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Create New Task</Text>

//                 <TaskDetails
//                     taskTitle={taskTitle}
//                     setTaskTitle={setTaskTitle}
//                     notes={notes}
//                     setNotes={setNotes}
//                     priority={priority}
//                     setPriority={setPriority}
//                     notification={notification}
//                     setNotification={setNotification}
//                     notificationOptions={notificationOptions}
//                 />

//                 <DatePicker
//                     date={dueDate}
//                     showDatePicker={showDatePicker}
//                     setShowDatePicker={setShowDatePicker}
//                     setDate={setDueDate}
//                     title="Due Date"
//                 />

//                 <TouchableOpacity style={styles.button} onPress={() => setShowSubtaskForm(true)}>
//                     <Text style={styles.buttonText}>Add Subtask</Text>
//                 </TouchableOpacity>

//                 {subtasks.length > 0 && (
//                     <View>
//                         <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Subtasks</Text>
//                         <FlatList
//                             data={subtasks}
//                             keyExtractor={(item, index) => index.toString()}
//                             renderItem={({ item }) => (
//                                 <View style={styles.subtaskItem}>
//                                     <Text>{item.title} - {item.priority}</Text>
//                                 </View>
//                             )}
//                         />
//                     </View>
//                 )}

//                 <Modal visible={showSubtaskForm} animationType="slide">
//                     <SubtaskForm
//                         currentSubtask={currentSubtask}
//                         setCurrentSubtask={setCurrentSubtask}
//                         showSubtaskDatePicker={showSubtaskDatePicker}
//                         setShowSubtaskDatePicker={setShowSubtaskDatePicker}
//                         notificationOptions={notificationOptions}
//                         handleAddSubtask={handleAddSubtask}
//                     />
//                 </Modal>

//                 <TouchableOpacity style={styles.button} onPress={handleSaveTask}>
//                     <Text style={styles.buttonText}>Save Task</Text>
//                 </TouchableOpacity>
//             </ScrollView>
//         </SafeAreaView>
//     );
// };

// const styles = {
//     button: {
//         backgroundColor: '#007bff',
//         padding: 10,
//         marginBottom: 20,
//         borderRadius: 5,
//     },
//     buttonText: {
//         color: '#fff',
//         textAlign: 'center',
//     },
//     subtaskItem: {
//         padding: 10,
//         backgroundColor: '#f9f9f9',
//         marginBottom: 5,
//         borderRadius: 5,
//     },
// };

// export default TaskCreationScreen;