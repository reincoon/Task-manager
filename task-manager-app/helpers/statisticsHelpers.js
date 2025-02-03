import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Fetch tasks with optional filters: period type, priority, project
export async function getStatistics({ userId, periodType, priority, projectId }) {
    try {
        // Build a Firestore query
        let tasksRef = collection(db, `tasks/${userId}/taskList`);
        let q = tasksRef;
        // Define a start date
        const now = new Date();
        let startDate = new Date();
        if (periodType === 'daily') {
            startDate.setDate(now.getDate() - 1);
        } else if (periodType === 'weekly') {
            startDate.setDate(now.getDate() - 7);
        } else if (periodType === 'monthly') {
            startDate.setMonth(now.getMonth() - 1);
        } else if (periodType === 'yearly') {
            startDate.setFullYear(now.getFullYear() - 1);
        }

        // Filter by priority
        if (priority) {
            q = query(q, where('priority', '==', priority));
        }
        // Filter by projectId
        if (projectId) {
            q = query(q, where('projectId', '==', projectId));
        }

        const snapshot = await getDocs(q);

        // Process tasks
        let totalTasks = 0;
        let completedTasks = 0;
        let totalSubtasks = 0;
        let completedSubtasks = 0;
        let totalTimeSpent = 0;
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            totalTasks++;
            // Count completed to-do lists
            if (data.taskCompletedAt) {
                completedTasks++;
            }
            // Aggregate subtasks data
            if (data.subtasks) {
                data.subtasks.forEach(subtask => {
                    totalSubtasks++;
                    if (subtask.isCompleted) {
                        completedSubtasks++;
                    }
                    if (subtask.timeSpent) {
                        totalTimeSpent += subtask.timeSpent;
                    }
                });
            }

            if (data.timeSpent) {
                totalTimeSpent += data.timeSpent;
            }
            // Filter by priority
            if (priority && data.priority !== priority) {
                return;
            }
            // Filter by project
            if (projectId && data.projectId !== projectId) {
                return;
            }

            const isTaskCompleted = !!data.taskCompletedAt || data.subtasks?.every(s => s.isCompleted);
            if (isTaskCompleted && !data.taskCompletedAt) {
                completedTasks += 1;
            }

            // Summation of timeSpent
            if (data.timeSpent) {
                totalTimeSpent += data.timeSpent;
            }

            // Subtasks
            let subs = data.subtasks || [];
            totalSubtasks += subs.length;
            subs.forEach(s => {
                if (s.isCompleted) {
                    completedSubtasks += 1;
                }
                if (s.timeSpent) {
                    totalTimeSpent += s.timeSpent;
                }
            });
        });
        // Return aggregated stats
        return {
            totalTasks,
            completedTasks,
            totalSubtasks,
            completedSubtasks,
            totalTimeSpent,
        };
    } catch (error) {
        console.error('Error in getStatistics:', error);
        throw error;
    }
}