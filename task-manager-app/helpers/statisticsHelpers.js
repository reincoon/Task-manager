import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { PRIORITIES } from './priority';

// // Fetch tasks with optional filters: period type, priority, project
// export async function getStatistics({ userId, periodType, priority, projectId }) {
//     try {
//         // Build a Firestore query
//         let tasksRef = collection(db, `tasks/${userId}/taskList`);
//         let q = tasksRef;
//         // Define a start date
//         const now = new Date();
//         let startDate = new Date();
//         if (periodType === 'daily') {
//             startDate.setDate(now.getDate() - 1);
//         } else if (periodType === 'weekly') {
//             startDate.setDate(now.getDate() - 7);
//         } else if (periodType === 'monthly') {
//             startDate.setMonth(now.getMonth() - 1);
//         } else if (periodType === 'yearly') {
//             startDate.setFullYear(now.getFullYear() - 1);
//         }

//         // Filter by priority
//         if (priority) {
//             q = query(q, where('priority', '==', priority));
//         }
//         // Filter by projectId
//         if (projectId) {
//             q = query(q, where('projectId', '==', projectId));
//         }

//         const snapshot = await getDocs(q);

//         // Process tasks
//         let totalTasks = 0;
//         let completedTasks = 0;
//         let totalSubtasks = 0;
//         let completedSubtasks = 0;
//         let totalTimeSpent = 0;
        
//         snapshot.forEach(docSnap => {
//             const data = docSnap.data();
//             totalTasks++;
//             // Count completed to-do lists
//             if (data.taskCompletedAt) {
//                 completedTasks++;
//             }
//             // Aggregate subtasks data
//             if (data.subtasks) {
//                 data.subtasks.forEach(subtask => {
//                     totalSubtasks++;
//                     if (subtask.isCompleted) {
//                         completedSubtasks++;
//                     }
//                     if (subtask.timeSpent) {
//                         totalTimeSpent += subtask.timeSpent;
//                     }
//                 });
//             }

//             if (data.timeSpent) {
//                 totalTimeSpent += data.timeSpent;
//             }
//             // Filter by priority
//             if (priority && data.priority !== priority) {
//                 return;
//             }
//             // Filter by project
//             if (projectId && data.projectId !== projectId) {
//                 return;
//             }

//             const isTaskCompleted = !!data.taskCompletedAt || data.subtasks?.every(s => s.isCompleted);
//             if (isTaskCompleted && !data.taskCompletedAt) {
//                 completedTasks += 1;
//             }

//             // Summation of timeSpent
//             if (data.timeSpent) {
//                 totalTimeSpent += data.timeSpent;
//             }

//             // Subtasks
//             let subs = data.subtasks || [];
//             totalSubtasks += subs.length;
//             subs.forEach(s => {
//                 if (s.isCompleted) {
//                     completedSubtasks += 1;
//                 }
//                 if (s.timeSpent) {
//                     totalTimeSpent += s.timeSpent;
//                 }
//             });
//         });
//         // Return aggregated stats
//         return {
//             totalTasks,
//             completedTasks,
//             totalSubtasks,
//             completedSubtasks,
//             totalTimeSpent,
//         };
//     } catch (error) {
//         console.error('Error in getStatistics:', error);
//         throw error;
//     }
// }


// Filter tasks based on the provided filter options
export function filterTasks(tasks, { startDate, endDate, selectedProject, selectedPriority }) {
    return tasks.filter(task => {
      // Filter by creation date (using task.createdAt)
        if (startDate && task.createdAt < startDate) return false;
        if (endDate && task.createdAt > endDate) return false;
        // If filtering by project (if not "All")
        if (selectedProject !== "All" && task.projectId !== selectedProject) return false;
        // If filtering by priority (if not "All")
        if (selectedPriority !== "All" && task.priority !== selectedPriority) return false;
        return true;
    });
}


// Compute statistics from tasks and projects given filter options.

export function computeStatistics(tasks, projects, filters) {
    const filteredTasks = filterTasks(tasks, filters);
    const totalTasks = filteredTasks.length;
    const closedTasks = filteredTasks.filter(task => task.taskCompletedAt !== null).length;
    const openTasks = totalTasks - closedTasks;

    // Compute average to-do lists completion time (in hours)
    let avgCompletionTime = 0;
    const closedTaskList = filteredTasks.filter(task => task.taskCompletedAt !== null);
    if (closedTaskList.length > 0) {
        const totalTimeMs = closedTaskList.reduce((sum, task) => sum + (task.taskCompletedAt - task.createdAt), 0);
        avgCompletionTime = totalTimeMs / closedTaskList.length / (1000 * 60 * 60);
    }

    // Count total and closed subtasks across filtered tasks.
    let totalSubtasks = 0;
    let closedSubtasks = 0;
    filteredTasks.forEach(task => {
        if (Array.isArray(task.subtasks)) {
            totalSubtasks += task.subtasks.length;
            closedSubtasks += task.subtasks.filter(sub => sub.isCompleted).length;
        }
    });

    // If filtering by project is "All" then count all projects; otherwise, count as 1.
    const totalProjects = filters.selectedProject === "All" ? projects.length : 1;
  
    return {
        totalProjects,
        totalTasks,
        closedTasks,
        openTasks,
        avgCompletionTime: avgCompletionTime.toFixed(2),
        totalSubtasks,
        closedSubtasks,
    };
}

// Prepare bar chart data for closed tasks grouped by priority

export function prepareBarChartData(tasks, filters) {
    const data = {
        labels: PRIORITIES,
        datasets: [
            {
                data: PRIORITIES.map(priority => {
                    return tasks.filter(task => {
                        // Apply the same filters as in filterTasks
                        if (filters.startDate && task.createdAt < filters.startDate) return false;
                        if (filters.endDate && task.createdAt > filters.endDate) return false;
                        if (filters.selectedProject !== "All" && task.projectId !== filters.selectedProject) return false;
                        if (filters.selectedPriority !== "All" && task.priority !== filters.selectedPriority) return false;
                        return task.priority === priority && task.taskCompletedAt !== null;
                    }).length;
                })
            }
        ]
    };
    return data;
}

// Prepare trend line chart data based on the number of tasks completed per day over the past 7 days
export function prepareTrendLineData(tasks, filters) {
    // Create an object for the past 7 days
    const days = 7;
    const trendData = {};
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        trendData[date.toDateString()] = 0;
    }
    // Count the number of tasks completed per day
    const filteredTasks = filterTasks(tasks, filters);
    filteredTasks.forEach(task => {
        if (task.taskCompletedAt) {
            const key = new Date(task.taskCompletedAt).toLocaleDateString();
            if (trendData.hasOwnProperty(key)) {
                trendData[key]++;
            }
        }
    });
    // Sort labels (oldest to newest)
    const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
    const dataPoints = labels.map(label => trendData[label]);
    return { labels, datasets: [{ data: dataPoints }] };
}