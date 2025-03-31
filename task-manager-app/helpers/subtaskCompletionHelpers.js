import { doc, updateDoc } from "firebase/firestore";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { Alert } from "react-native";
import { db } from "../firebaseConfig";
import { safeDate } from "./date";

// Play a short "completion" sound and trigger a light haptic feedback
async function playCompletionFeedback() {
    try {
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Load and play a success sound
        const { sound } = await Audio.Sound.createAsync(
            require('../assets/decidemp3-14575.mp3')
        );
        await sound.playAsync();

        // Unload the sound from memory
        sound.setOnPlaybackStatusUpdate(async (status) => {
            if (!status.isLoaded) {
                return;
            }
            if (status.didJustFinish) {
                await sound.unloadAsync();
            }
        });
    } catch (error) {
        console.error('Failed to play sound feedback:', error);
    }
}

// Recompute the status of the to-do list based on completed subtasks and due date
export function calculateTaskStatus(task) {
    const { subtasks = [], dueDate, taskCompletedAt, manuallyFinished } = task;
    const due = new Date(dueDate);
    const now = new Date();
    const isPastDue = now > due;
    const totalSubtasks = subtasks.length;
    const completedCount = subtasks.filter((s) => s.isCompleted).length;

    if (!subtasks || totalSubtasks === 0) {
        return manuallyFinished ? 'Finished' : isPastDue ? 'Overdue' : 'Not Started';
    }

    if (completedCount === totalSubtasks) {
        return 'Finished';
    }
    if (isPastDue) {
        return 'Overdue';
    }
    if (completedCount === 0) {
        return 'Not Started';
    }
    return 'In Progress';
}

export async function toggleSubtaskCompletionLocal({ subtasks, subtaskIndex }) {
    const updatedSubtasks = [...subtasks];
    const subtask = updatedSubtasks[subtaskIndex];
    subtask.isCompleted = !subtask.isCompleted;
    // Store completion timestamp
    if (subtask.isCompleted) {
        subtask.completedAt = new Date().toISOString();
        await playCompletionFeedback();
    } else {
        // remove timestamp if uncompleted
        subtask.completedAt = null;
    }
    return updatedSubtasks;
}

// Toggle the entire to-do list as all subtasks completed or uncompleted
export async function toggleTaskCompletion({
    userId,
    taskId,
    subtasks,
    markAsComplete = true,
}) {
    try {
        let nowString = new Date().toISOString();
        const updatedSubtasks = subtasks.map((s) => {
            return {
                ...s,
                isCompleted: markAsComplete ? true : false,
                completedAt: markAsComplete ? (s.completedAt || nowString) : null,
            };
        });

        const updates = {
            subtasks: updatedSubtasks.map((s) => ({
                ...s,
                dueDate: safeDate(s.dueDate).toISOString(),
            })),
            taskCompletedAt: markAsComplete ? nowString : null,
        };

        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        await updateDoc(taskDocRef, updates);

        if (markAsComplete) {
            await playCompletionFeedback();
        }
        return updatedSubtasks;
    } catch (error) {
        Alert.alert('Error', `Failed to update task completion: ${error.message}`);
        throw error;
    }
}

// Function to update task status in Firestore
export async function updateTaskStatusInFirestore(isFinished, userId, taskId) {
    try {
        if (!userId || !taskId) {
            throw new Error("Missing userId or taskId.");
        }
        const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        await updateDoc(taskDocRef, { manuallyFinished: isFinished });
    } catch (err) {
        Alert.alert("Error", "Failed to update task status.");
    }
};