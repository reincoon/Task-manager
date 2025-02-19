import { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { auth, db } from "../firebaseConfig";
import { requestNotificationPermissions } from "../helpers/notifications";
import { createTask, addTaskToCalendar, addSubtaskToCalendar } from "../helpers/taskActions";
import { cyclePriority } from "../helpers/priority";
import { COLOURS } from "../helpers/constants";
import { removeFileFromSupabase } from "../helpers/supabaseStorageHelpers";
import { scheduleTaskNotification } from '../helpers/notificationsHelpers';

// Custom hook to manage to-do list creation
export function useTaskCreation(navigation) {
    // Main to-do list state
    const [taskTitle, setTaskTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [notification, setNotification] = useState('None');
    const [priority, setPriorityState] = useState('Low');
    const [selectedColour, setSelectedColour] = useState(COLOURS[0].value);
    // Subtasks and attachments
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
    });
    const [attachments, setAttachments] = useState([]);
    const [addedAttachments, setAddedAttachments] = useState([]);
    const [deletedAttachments, setDeletedAttachments] = useState([]);
    
    // Loading and tracking states
    const [isSaving, setIsSaving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [userId, setUserId] = useState(null);

    // Request permissions and set up auth listener
    useEffect(() => {
        requestNotificationPermissions();
        // Listen for authentication changes
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUserId(currentUser.uid);
            } else {
                Alert.alert('Error', 'No user signed in.');
                navigation.goBack();
            }
        });
        return unsubscribe;
    }, [navigation]);

    // Add a new subtask
    const handleAddSubtask = async () => {
        if (!currentSubtask.title.trim()) {
            Alert.alert("Error", "Subtask title is required");
            return;
        }
    
        // Validate and normalise due date
        let subtaskDueDate = currentSubtask.dueDate;
        if (!(subtaskDueDate instanceof Date) || isNaN(subtaskDueDate.getTime())) {
            subtaskDueDate = new Date();
        }
    
        // Schedule notification for the subtask
        let subtaskNotificationId = null;
        if (currentSubtask.reminder !== "None") {
            subtaskNotificationId = await scheduleTaskNotification(
                currentSubtask.title,
                currentSubtask.reminder,
                subtaskDueDate
            );
        }
    
        const newSubtask = {
            ...currentSubtask,
            dueDate: subtaskDueDate,
            notificationId: subtaskNotificationId || null,
        };
    
        // Add the new subtask and reset the subtask form
        setSubtasks([...subtasks, newSubtask]);
        setCurrentSubtask({
            title: "",
            dueDate: new Date(),
            priority: "Low",
            reminder: "None",
            isRecurrent: false,
            notificationId: null,
            eventId: null,
        });
        setShowSubtaskForm(false);
    };

    // Save to-do list
    const handleSaveTask = async () => {
        if (isSaving) {
            return;
        }
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
                currentTask,
                setTaskId,
                setOriginalTask: () => {},
                setOriginalAttachments: setAttachments,
                setDeletedAttachments,
                setAddedAttachments,
            });
            Alert.alert('Success', 'Task created successfully');
            navigation.navigate('Home');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Add To-do list to calendar
    const addMainTaskToCalendar = async () => {
        if (!userId || !taskId) {
            Alert.alert("Info", "You need to save the task first before adding it to the calendar.");
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
                        "Already in Calendar",
                        "This event already exists. Do you want to add another one anyway?",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Add Anyway", onPress: onConfirm },
                        ]
                    );
                },
            });
        } catch (error) {
            Alert.alert("Error", "Failed to add task to calendar.");
        }
    };

    // Add a subtask to the calendar
    const addSubtaskToCalendarHandler = async (subtask, index) => {
        if (!userId || !taskId) {
            Alert.alert("Info", "You need to save the task first before adding subtasks to the calendar.");
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
                        "Already in Calendar",
                        "This subtask already exists. Do you want to add another one anyway?",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Add Anyway", onPress: onConfirm },
                        ]
                    );
                },
            });
        } catch (error) {
            Alert.alert("Error", "Failed to add subtask to calendar.");
        }
    };

    // Cancel task creation
    const handleCancel = async () => {
        if (isCancelling) return;
        setIsCancelling(true);
        try {
            // Delete any added attachments from storage
            for (const attachment of addedAttachments) {
                if (attachment.supabaseKey) {
                    await removeFileFromSupabase(attachment.supabaseKey);
                }
                if (attachment.localUri) {
                    await FileSystem.deleteAsync(attachment.localUri, { idempotent: true });
                }
            }
            // Clear attachments and reset tracking state
            setAttachments([]);
            setDeletedAttachments([]);
            setAddedAttachments([]);
            // Reset form fields to initial values
            setTaskTitle("");
            setNotes("");
            setDueDate(new Date());
            setNotification("None");
            setPriorityState("Low");
            setSubtasks([]);
            setSelectedColour(COLOURS[0].value);
            // Navigate back
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to cancel task editing.");
        } finally {
            setIsCancelling(false);
        }
    };

    return {
        taskTitle,
        setTaskTitle,
        notes,
        setNotes,
        dueDate,
        setDueDate,
        notification,
        setNotification,
        priority,
        setPriority: (p) => setPriorityState(cyclePriority(p)),
        selectedColour,
        setSelectedColour,
        subtasks,
        setSubtasks,
        showSubtaskForm,
        setShowSubtaskForm,
        currentSubtask,
        setCurrentSubtask,
        attachments,
        setAttachments,
        addedAttachments,
        setAddedAttachments,
        deletedAttachments,
        setDeletedAttachments,
        isSaving,
        isCancelling,
        taskId,
        userId,
        isUploadingAttachment,
        setIsUploadingAttachment,
        handleAddSubtask,
        handleSaveTask,
        addMainTaskToCalendar,
        addSubtaskToCalendarHandler,
        handleCancel,
    };
}