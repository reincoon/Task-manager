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

    // // Manual completion of to-do list without subtasks
    // if (manuallyFinished) {
    //     return 'Finished';
    // }

    // // // Manual completion of to-do list without subtasks
    // // if (task.taskCompletedAt) {
    // //     return 'Finished';
    // // }

    
    
    // // Convert dueDate to a Date object
    // // const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
    // // Count completed subtasks
    
    // // If not all subtasks completed and current time is past due date, then overdue
    // // If the task has no subtasks, determine its status
    // // if (subtasks.length === 0) {
    // //     // const due = new Date(dueDate);
    // //     // const now = new Date();
    // //     if (taskCompletedAt) {
    // //         return 'Finished';
    // //     }
    // //     return isPastDue ? 'Overdue' : 'Not Started';
    // // }
    // if (totalSubtasks === 0) {
    //     if (taskCompletedAt) {
    //         return 'Finished';
    //     }
    //     return isPastDue ? 'Overdue' : 'Not Started';
    // }

    // if (completedCount === 0) {
    //     // No subtasks completed
    //     if (isPastDue) {
    //         return 'Overdue';
    //     } 
    //     return 'Not Started';
    // // } else if (completedCount > 0 && completedCount < totalSubtasks) {
    // } else if (completedCount < totalSubtasks) {
    //     // Some subtasks completed
    //     if (isPastDue) {
    //         return 'Overdue';
    //     }
    //     return 'In Progress';
    // // } else if (completedCount === totalSubtasks) {
    // } else {
    //     // All subtasks completed
    //     return 'Finished';
    // }
    // // Default to 'Not Started'
    // // return 'Not Started';
}

// // Toggle a subtask's completion status and update Firestore
// export async function toggleSubtaskCompletion({
//     userId,
//     taskId,
//     subtasks,
//     subtaskIndex,
// }) {
//     try {
//         const updatedSubtasks = [...subtasks];
//         const oldValue = updatedSubtasks[subtaskIndex].isCompleted || false;
//         updatedSubtasks[subtaskIndex].isCompleted = !oldValue;

//         // Update Firestore
//         const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
//         await updateDoc(taskDocRef, {
//             subtasks: updatedSubtasks.map((s) => ({
//                 ...s,
//                 dueDate: s.dueDate instanceof Date ? s.dueDate.toISOString() : s.dueDate,
//             })),
//         });

//         // Play a completion sound + vibration
//         if (!oldValue) {
//             await playCompletionFeedback();
//         }
//         return updatedSubtasks;
//     } catch (err) {
//         Alert.alert('Error', `Failed to update subtask completion : ${err.message}`);
//         throw err;
//     }
// }

export async function toggleSubtaskCompletionLocal({ subtasks, subtaskIndex }) {
    const updatedSubtasks = [...subtasks];
    // const wasCompleted = updatedSubtasks[subtaskIndex].isCompleted;
    // updatedSubtasks[subtaskIndex].isCompleted = !wasCompleted;
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

// Toggle the entire to-do list as "all subtasks completed" or "uncompleted"
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
                // dueDate: s.dueDate instanceof Date ? s.dueDate.toISOString() : s.dueDate,
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
        console.error("Error updating task status:", err);
        Alert.alert("Error", "Failed to update task status.");
    }
};