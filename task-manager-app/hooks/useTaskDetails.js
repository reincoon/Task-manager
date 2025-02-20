import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { auth, db } from "../firebaseConfig";
import { requestNotificationPermissions } from "../helpers/notifications";
import { fetchTaskDetails, saveTask, cancelTaskChanges, deleteTask, deleteSubtask, addTaskToCalendar, addSubtaskToCalendar } from "../helpers/taskActions";
import { calculateTaskStatus, toggleTaskCompletion, updateTaskStatusInFirestore } from "../helpers/subtaskCompletionHelpers";
import { safeDate } from "../helpers/date";
import { COLOURS } from "../helpers/constants";
import { doc, updateDoc } from "firebase/firestore";

// Custom hook to manage task details
export function useTaskDetails(taskId, navigation) {
    // Loading and Auth
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    // Task fields
    const [taskTitle, setTaskTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [notification, setNotification] = useState("None");
    const [priority, setPriority] = useState("Low");
    const [selectedColour, setSelectedColour] = useState(COLOURS[0].value);

    // Subtasks
    const [subtasks, setSubtasks] = useState([]);
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [currentSubtask, setCurrentSubtask] = useState({
        title: "",
        dueDate: new Date(),
        priority: "Low",
        reminder: "None",
        isRecurrent: false,
        notificationId: null,
        eventId: null,
        isCompleted: false,
    });
    const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
    
    // Attachments
    const [attachments, setAttachments] = useState([]);
    const [deletedAttachments, setDeletedAttachments] = useState([]);
    const [addedAttachments, setAddedAttachments] = useState([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [originalAttachments, setOriginalAttachments] = useState([]);

    // Other states
    const [isSaving, setIsSaving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [taskNotificationId, setTaskNotificationId] = useState(null);
    const [originalTask, setOriginalTask] = useState(null);
    const [taskStatus, setTaskStatus] = useState("Not Started");
    const [completedCount, setCompletedCount] = useState(0);
    const [manuallyFinished, setManuallyFinished] = useState(false);
    const [localTaskCompletedAt, setLocalTaskCompletedAt] = useState(null);

    // Request notification permissions and set up auth listener
    useEffect(() => {
        requestNotificationPermissions();
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUserId(currentUser.uid);
            } else {
                Alert.alert("Error", "No user signed in.");
                navigation.goBack();
            }
        });
        return unsubscribe;
    }, [navigation]);

    // Fetch task details once userId is available
    useEffect(() => {
        async function loadTask() {
            if (!userId) {
                return;
            }
            try {
                const fetched = await fetchTaskDetails(userId, taskId, db);
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
                setManuallyFinished(fetched.manuallyFinished || false);
                // Keep original attachments
                setOriginalAttachments(fetched.attachments);
                // Store original to-do list
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
                Alert.alert("Error", err.message);
                navigation.goBack();
            }
        }
        loadTask();
    }, [userId, taskId, navigation]);

    // Recalculate task status and completed subtasks count whenever subtasks change
    useEffect(() => {
        const finishedCount = subtasks.filter((s) => s.isCompleted).length;
        setCompletedCount(finishedCount);
        // For to-do lists with subtasks ignore manuallyFinished
        const status = calculateTaskStatus({
            subtasks,
            dueDate,
            manuallyFinished: subtasks.length === 0 ? manuallyFinished : false,
        });
        setTaskStatus(status);
    }, [subtasks, dueDate, manuallyFinished]);

    // Save to-do list's changes
    const handleSaveTask = async () => {
        if (isSaving || !userId) {
            return;
        }
        setIsSaving(true);
        if (!taskTitle.trim()) {
            Alert.alert("Error", "Task title is required");
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
            const newStatus = subtasks.length === 0
                ? manuallyFinished ? "Finished" : calculateTaskStatus({ subtasks, dueDate })
                : calculateTaskStatus({ subtasks, dueDate, manuallyFinished: false });
            setTaskStatus(newStatus);
            Alert.alert("Success", "Task updated successfully");
            navigation.goBack();
        } catch (err) {
            Alert.alert("Error", err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Cancel changes and revert to original to-do list
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
                subtasks: originalTask.subtasks.map((s) => ({
                    ...s,
                    dueDate: safeDate(s.dueDate).toISOString(),
                })),
                manuallyFinished: originalTask.manuallyFinished,
                taskCompletedAt: null,
            });
            setTaskStatus(calculateTaskStatus({
                subtasks: originalTask.subtasks,
                dueDate: safeDate(originalTask.dueDate),
                manuallyFinished: originalTask.manuallyFinished,
            }));
            setSelectedColour(originalTask?.colour || COLOURS[0].value);
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to cancel task editing.");
            console.log("Error during cancellation:", error);
        }
    };

    // Add or edit a subtask
    const handleAddSubtask = async () => {
        if (!currentSubtask.title.trim()) {
            Alert.alert("Error", "Subtask title is required");
            return;
        }
        const updatedSubtask = {
            ...currentSubtask,
            dueDate: currentSubtask.dueDate instanceof Date ? currentSubtask.dueDate : new Date(),
        };
        if (editingSubtaskIndex !== null) {
            const updatedSubtasks = [...subtasks];
            updatedSubtasks[editingSubtaskIndex] = updatedSubtask;
            setSubtasks(updatedSubtasks);
        } else {
            setSubtasks([...subtasks, updatedSubtask]);
        }
        // Reset current subtask and close form
        setCurrentSubtask({
            title: "",
            dueDate: new Date(),
            priority: "Low",
            reminder: "None",
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
        Alert.alert("Delete To-Do List", "Are you sure you want to delete this to-do list?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteTask(
                            userId,
                            {
                                id: taskId,
                                notificationId: taskNotificationId,
                                subtasks,
                                attachments,
                                colour: selectedColour,
                            },
                            navigation,
                            true
                        );
                        Alert.alert("Deleted", "Task deleted successfully");
                    } catch (err) {
                        console.error("Error deleting task:", err);
                        Alert.alert("Error", "Could not delete task");
                    }
                },
            },
        ]);
    };

    // Edit a subtask
    const handleEditSubtask = (index) => {
        const subtaskToEdit = subtasks[index];
        let safeDueDate = subtaskToEdit.dueDate instanceof Date ? subtaskToEdit.dueDate : new Date();
        setCurrentSubtask({
            ...subtaskToEdit,
            dueDate: safeDueDate,
        });
        setEditingSubtaskIndex(index);
        setShowSubtaskForm(true);
    };

    // Delete a subtask
    const handleDeleteSubtask = async (index) => {
        Alert.alert("Delete Subtask", "Are you sure you want to delete this subtask?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteSubtask({
                            userId,
                            taskId,
                            db,
                            subtasks,
                            index,
                            setSubtasks,
                        });
                        Alert.alert("Deleted", "Subtask deleted successfully");
                    } catch (err) {
                        console.error("Error deleting subtask:", err);
                        Alert.alert("Error", "Could not delete subtask");
                    }
                },
            },
        ]);
    };

    // Mark a to-do list as completed locally
    const markTaskAsCompletedLocally = async () => {
        setManuallyFinished(true);
        await updateTaskStatusInFirestore(true, userId, taskId);
        const nowStr = new Date().toISOString();
        const updated = subtasks.map((s) => {
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
        setTaskStatus("Finished");
    };

    // Mark a to-do list as unfinished locally
    const markTaskAsUnfinishedLocally = async () => {
        setManuallyFinished(false);
        const updatedSubtasks = await toggleTaskCompletion({
            userId,
            taskId,
            subtasks,
            markAsComplete: false,
        });
        setSubtasks(updatedSubtasks);
        setLocalTaskCompletedAt(null);
        setTaskStatus("Not Started");
        await updateTaskStatusInFirestore(false, userId, taskId);
    };

    // Add to-do list to calendar    
    const addMainTaskToCalendarHandler = async () => {
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


    // Add a subtask to calendar
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
            Alert.alert("Success", "Subtask added to calendar");
        } catch (err) {
            console.error("Error adding subtask to calendar:", err);
            Alert.alert("Error", "Failed to add subtask to calendar.");
        }
    };

    return {
        userId,
        loading,
        taskTitle,
        setTaskTitle,
        notes,
        setNotes,
        dueDate,
        setDueDate,
        notification,
        setNotification,
        priority,
        setPriority,
        selectedColour,
        setSelectedColour,
        subtasks,
        setSubtasks,
        showSubtaskForm,
        setShowSubtaskForm,
        currentSubtask,
        setCurrentSubtask,
        editingSubtaskIndex,
        setEditingSubtaskIndex,
        originalTask,
        taskNotificationId,
        originalAttachments,
        attachments,
        setAttachments,
        deletedAttachments,
        setDeletedAttachments,
        addedAttachments,
        setAddedAttachments,
        isSaving,
        isCancelling,
        isUploadingAttachment,
        setIsUploadingAttachment,
        taskStatus,
        completedCount,
        manuallyFinished,
        localTaskCompletedAt,
        handleSaveTask,
        handleCancel,
        handleAddSubtask,
        handleDeleteTask,
        handleEditSubtask,
        handleDeleteSubtask,
        markTaskAsCompletedLocally,
        markTaskAsUnfinishedLocally,
        // addMainTaskToCalendarHandler: addTaskToCalendar,
        addMainTaskToCalendarHandler,
        addSubtaskToCalendarHandler,
    };
}