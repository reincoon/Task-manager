import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import DateTimeSelector from '../components/DateTimeSelector';
import SubtaskList from '../components/SubtaskList';
import AttachmentsList from '../components/AttachmentsList';

import { requestNotificationPermissions } from '../helpers/notifications';
import { NOTIFICATION_OPTIONS, COLOURS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
import { addAttachmentOfflineAndOnline, removeAttachment } from '../helpers/attachmentHelpers';
import { fetchTaskDetails, saveTask, cancelTaskChanges, deleteTask, deleteSubtask, addTaskToCalendar, addSubtaskToCalendar } from '../helpers/taskActions';
import ColourPicker from '../components/ColourPicker';
import { calculateTaskStatus, toggleTaskCompletion, updateTaskStatusInFirestore } from '../helpers/subtaskCompletionHelpers';
import { doc, updateDoc } from 'firebase/firestore';
import { safeDate } from '../helpers/date';

const TaskDetailsScreen = ({ route, navigation }) => {
    const { taskId } = route.params;
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    // Task-level states
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
        eventId: null,
        isCompleted: false,
    });
    const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
    // original task is stored to revert in case if cancelled
    const [originalTask, setOriginalTask] = useState(null); 
    // notificationId is stored to keep in case if cancelled
    const [taskNotificationId, setTaskNotificationId] = useState(null);
    const [originalAttachments, setOriginalAttachments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [deletedAttachments, setDeletedAttachments] = useState([]);
    const [addedAttachments, setAddedAttachments] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [selectedColour, setSelectedColour] = useState(COLOURS[0].value);

    const [taskStatus, setTaskStatus] = useState('Not Started');
    const [completedCount, setCompletedCount] = useState(0);
    const [manuallyFinished, setManuallyFinished] = useState(false);
    const [localTaskCompletedAt, setLocalTaskCompletedAt] = useState(null);

    // Request notification permissions and get user ID
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

    // Fetch task details once userId is available
    useEffect(() => {
        async function loadTask() {
            if (!userId) return;
            try {
                const fetched = await fetchTaskDetails(userId, taskId, db);
                // Populate states
                setTaskTitle(fetched.title);
                setNotes(fetched.notes);
                setDueDate(fetched.dueDate);
                setNotification(fetched.notification);
                setPriority(fetched.priority);
                setSubtasks(fetched.subtasks);
                setTaskNotificationId(fetched.notificationId);
                setAttachments(fetched.attachments);

                // Fetch colour
                if (fetched.colour) {
                    setSelectedColour(fetched.colour);
                }
                // Set status based on fetched data
                setManuallyFinished(fetched.manuallyFinished || false);
                // Keep original atatchments
                setOriginalAttachments(fetched.attachments);
                // Store the original task
                setOriginalTask({
                    title: fetched.title,
                    notes: fetched.notes,
                    dueDate: fetched.dueDate,
                    notification: fetched.notification,
                    priority: fetched.priority,
                    subtasks: fetched.subtasks,
                    notificationId: fetched.notificationId,
                    attachments: fetched.attachments,
                    colour: fetched.colour || COLOURS[0].value,
                    manuallyFinished: fetched.manuallyFinished || false,
                });

                setLoading(false);
            } catch (err) {
                Alert.alert('Error', err.message);
                navigation.goBack();
            }
        }
        loadTask();
    }, [userId, taskId, db, navigation]);

    // Recalculate task status and progress on subtasks change
    useEffect(() => {
        // const currentTask = { subtasks, dueDate, manuallyFinished };
        // const status = calculateTaskStatus(currentTask);
        // setTaskStatus(status);
        // const total = subtasks.length;
        // const done = subtasks.filter((s) => s.isCompleted).length;
        // setCompletedCount(done);
        const finishedCount = subtasks.filter(s => s.isCompleted).length;
        setCompletedCount(finishedCount);
        
        // For tasks with subtasks, ignore manuallyFinished.
        const status = calculateTaskStatus({
            subtasks,
            dueDate,
            manuallyFinished: subtasks.length === 0 ? manuallyFinished : false,
        });
        setTaskStatus(status);
    }, [subtasks, dueDate, manuallyFinished]);

    // useEffect(() => {
    //     if (fetched.manuallyFinished) setManuallyFinished(fetched.manuallyFinished);
    // }, [fetched]);

    // Save the task by calling the saveTask helper function
    const handleSaveTask = async () => {
        if (isSaving || !userId) {
            return;
        }
        setIsSaving(true);
        
        if (!taskTitle.trim()) {
            Alert.alert('Error', 'Task title is required');
            setIsSaving(false);
            return;
        }

        try {
            await saveTask({
                userId,
                taskId,
                db,
                originalTask,
                currentTask: {
                    title: taskTitle,
                    notes,
                    dueDate: safeDate(dueDate),
                    notification,
                    priority,
                    subtasks,
                    attachments,
                    notificationId: taskNotificationId,
                    colour: selectedColour,
                    manuallyFinished: subtasks.length === 0 ? manuallyFinished : false,
                },
                deletedAttachments,
                setOriginalAttachments,
                setDeletedAttachments,
                setAddedAttachments,
            });
            // const newStatus = manuallyFinished ? 'Finished' : calculateTaskStatus({ subtasks, dueDate: safeDate(dueDate), manuallyFinished });
            const newStatus = subtasks.length === 0 
                ? (manuallyFinished ? 'Finished' : calculateTaskStatus({ subtasks, dueDate })) 
                : calculateTaskStatus({ subtasks, dueDate, manuallyFinished: false });
            setTaskStatus(newStatus);

            Alert.alert('Success', 'Task updated successfully');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Cancel any changes by calling the cancelTaskChanges helper function
    const handleCancel = async () => {
        try {
            await cancelTaskChanges({
                originalTask,
                addedAttachments,
                setAttachments,
                setDeletedAttachments,
                setAddedAttachments,
                setTaskTitle,
                setNotes,
                setDueDate,
                setNotification,
                setPriority,
                setSubtasks,
            });
            setManuallyFinished(originalTask.manuallyFinished);

            // Revert Firestore
            const docRef = doc(db, `tasks/${userId}/taskList`, taskId);
            await updateDoc(docRef, {
                subtasks: originalTask.subtasks.map(s => ({
                    ...s,
                    // dueDate: s.dueDate instanceof Date ? s.dueDate.toISOString() : s.dueDate,
                    dueDate: safeDate(s.dueDate).toISOString(),
                })),
                manuallyFinished: originalTask.manuallyFinished,
                taskCompletedAt: null,
            });
            setTaskStatus(calculateTaskStatus({
                subtasks: originalTask.subtasks,
                // dueDate: originalTask.dueDate,
                dueDate: safeDate(originalTask.dueDate),
                manuallyFinished: originalTask.manuallyFinished,
            }));
            // setTaskStatus(calculateTaskStatus({ subtasks, dueDate }));
            // Revert colour
            setSelectedColour(originalTask?.colour || COLOURS[0].value);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to cancel task editing.');
            console.log('Error during cancellation:', error);
        }
    };

    // Add or edit a subtask by updating the local state
    const handleAddSubtask = async () => {
        if (!currentSubtask.title.trim()) {
            Alert.alert('Error', 'Subtask title is required');
            return;
        }

        const updatedSubtask = {
            ...currentSubtask,
            dueDate: currentSubtask.dueDate instanceof Date ? currentSubtask.dueDate : new Date(),
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
            notificationId: null,
            eventId: null,
            isCompleted: false,
        });
        setEditingSubtaskIndex(null);
        setShowSubtaskForm(false);
    };

    // Delete the entire to-do list
    const handleDeleteTask = async () => {
        Alert.alert('Delete To-Do List', 'Are you sure you want to delete this to-do list?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    console.log('Deleting to-do list. Subtasks:', subtasks);
                    console.log('Deleting to-do list. Attachments:', attachments);
                    await deleteTask(userId, {
                        id: taskId,
                        notificationId: taskNotificationId,
                        subtasks,
                        attachments,
                        colour: selectedColour,
                    }, navigation, true);
                    Alert.alert('Deleted', 'Task deleted successfully');
                } catch (err) {
                    console.error('Error deleting task:', err);
                    Alert.alert('Error', 'Could not delete task');
                }
            }},
        ]);
    };

    // Edit a subtask
    const handleEditSubtask = (index) => {
        const subtaskToEdit = subtasks[index];
        let safeDueDate = subtaskToEdit.dueDate instanceof Date ? subtaskToEdit.dueDate : new Date();

        setCurrentSubtask({
            ...subtaskToEdit,
            dueDate: safeDueDate
        });
        setEditingSubtaskIndex(index);
        setShowSubtaskForm(true);
    };

    // Delete a subtask
    const handleDeleteSubtask = async (index) => {
        Alert.alert('Delete Subtask', 'Are you sure you want to delete this subtask?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    await deleteSubtask({
                        userId,
                        taskId,
                        db,
                        subtasks,
                        index,
                        setSubtasks,
                    });
                    Alert.alert('Deleted', 'Subtask deleted successfully');
                } catch (err) {
                    console.error('Error deleting subtask:', err);
                    Alert.alert('Error', 'Could not delete subtask');
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

    const addTaskToCalendarHandler = async () => {
        if (!userId) {
            Alert.alert('Error', 'No user logged in.');
            return;
        }
        try {
            await addTaskToCalendar({
                userId,
                taskId,
                taskTitle,
                dueDate,
                setTaskNotificationId,
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
            Alert.alert('Success', 'Task added to calendar');
        } catch (err) {
            console.error('Error adding task to calendar:', err);
        }
    };

    const addSubtaskToCalendarHandler = async (subtask, index) => {
        if (!userId) {
            Alert.alert('Error', 'No user logged in.');
            return;
        }
        try {
            await addSubtaskToCalendar({
                userId,
                taskId,
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
            Alert.alert('Success', 'Subtask added to calendar');
        } catch (err) {
            console.error('Error adding subtask to calendar:', err);
        }
    };

    // // Mark the task as finished local override
    // const markTaskAsFinished = () => {
    //     setManuallyFinished(true);
    // };
    // // Revert the task as unfinished local override 
    // const unfinishTaskLocally = () => {
    //     setManuallyFinished(false);
    //     setTaskStatus(calculateTaskStatus({ subtasks, dueDate }));
    // };

    // // final displayed status in the UI
    // const autoStatus = calculateTaskStatus({ subtasks, dueDate });
    // const displayedStatus = manuallyFinished ? 'Finished' : autoStatus;

    // Mark entire list as completed locally
    const markTaskAsCompletedLocally = async () => {
        setManuallyFinished(true);
        // setTaskStatus('Finished');
        await updateTaskStatusInFirestore(true, userId, taskId);
        const nowStr = new Date().toISOString();
        const updated = subtasks.map(s => {
            if (!s.isCompleted) {
                return {
                    ...s,
                    isCompleted: true,
                    completedAt: s.completedAt || nowStr,
                };
            }
            return s;
        });
        setSubtasks(updated);
        setLocalTaskCompletedAt(nowStr);
        setTaskStatus('Finished');
    };

    const markTaskAsUnfinishedLocally = async () => {
        // Set task as unfinished
        setManuallyFinished(false);
        // setTaskStatus('Finished');
        // setTaskStatus(calculateTaskStatus({ subtasks, dueDate }));
    
        // // Reset the completion status of subtasks locally
        // const updatedSubtasks = subtasks.map(subtask => {
        //     // For each subtask, mark it as not completed
        //     return { ...subtask, isCompleted: false, completedAt: null };
        // });
        const updatedSubtasks = await toggleTaskCompletion({
            userId,
            taskId,
            subtasks,
            markAsComplete: false,
        });
        
        setSubtasks(updatedSubtasks);
    
        // Reset the local completion date of the task itself
        setLocalTaskCompletedAt(null);
        setTaskStatus('Not Started');
        await updateTaskStatusInFirestore(false, userId, taskId);
    };

    // // Mark entire to-do list as completed
    // const markTaskAsCompleted = async () => {
    //     try {
    //         const updatedSubtasks = await toggleTaskCompletion({
    //             userId,
    //             taskId,
    //             subtasks,
    //             markAsComplete: true,
    //         });
    //         setSubtasks(updatedSubtasks);
    //     } catch (error) {
    //         console.error('Error marking task as completed:', error);
    //     }
    // };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </SafeAreaView>
        );
    }

    // Calculate subtask progress
    const totalSubtasks = subtasks.length;
    const progress = totalSubtasks > 0 ? (completedCount / totalSubtasks) * 100 : 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} disabled={isUploadingAttachment}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit To-Do List</Text>
                <TouchableOpacity 
                    onPress={handleSaveTask}
                    disabled={isSaving || isUploadingAttachment}
                >
                    <Ionicons name="save" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true}>
                {/* Display the status */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                        Status: {taskStatus}
                    </Text>

                    {/* Button/icon to mark entire list complete */}
                    {taskStatus !== 'Finished' ? (
                    // {/* {subtasks.length === 0 ? ( */}
                        <TouchableOpacity style={styles.completeButton} onPress={markTaskAsCompletedLocally}>
                            <Ionicons name="checkmark-circle" size={22} color="white" />
                            <Text style={styles.completeButtonText}>
                                Mark Complete
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.completeButton} onPress={markTaskAsUnfinishedLocally}>
                            <Ionicons name="arrow-undo" size={22} color="white" />
                            <Text style={styles.completeButtonText}>Mark Unfinished</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {completedCount} / {totalSubtasks} Subtasks Completed
                </Text>

                {/* Title and Notes */}
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
                {/* Colour Picker */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ marginBottom: 10, fontWeight: '600' }}>
                        Category Colour:
                    </Text>
                    <ColourPicker
                        selectedColour={selectedColour}
                        onSelectColour={setSelectedColour}
                    />
                </View>
                {/* Due Date selector */}
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
                    onPress={() => setPriority(cyclePriority(priority))}
                >
                    <Text style={styles.buttonText}>Priority: {priority}</Text>
                </TouchableOpacity>
                {/* Add subtask button */}
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
                            eventId: null,
                            isCompleted: false,
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
                    onPress={addTaskToCalendarHandler}
                >
                    <Ionicons name="calendar-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add To-Do List to Calendar</Text>
                </TouchableOpacity>
                {/* List of subtasks */}
                <SubtaskList 
                    subtasks={subtasks} 
                    onEditSubtask={handleEditSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    onAddSubtaskToCalendar={addSubtaskToCalendarHandler}
                    userId={userId}
                    taskId={taskId}
                    setSubtasks={setSubtasks}
                />
                {/* Attachments list */}
                <AttachmentsList
                    attachments={attachments}
                    setAttachments={setAttachments}
                    onAddAttachment={() =>
                        addAttachmentOfflineAndOnline({
                            attachments,
                            setAttachments,  
                            addedAttachments,
                            setAddedAttachments,
                        })
                    }
                    onRemoveAttachment={(index) => {
                        const removed = attachments[index];
                        setDeletedAttachments([...deletedAttachments, removed]);
                        removeAttachment({
                            attachments,
                            setAttachments,
                            index,
                            shouldDeleteSupabase: false,
                        });
                    }}
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
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 10,
    },
    completeButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 5,
    },
    completeButtonText: {
        color: '#fff',
        marginLeft: 5,
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#eee',
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#28a745',
    },
    progressText: {
        marginBottom: 15,
        fontWeight: '500',
    },
});

export default TaskDetailsScreen;