import { PRIORITIES } from './constants';

// Format a duration given in hours as "Xd Yh Zm"
export function formatDuration(hours) {
    if (!hours || isNaN(hours)) return "0m";
    const totalMinutes = Math.round(hours * 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const remainderMinutes = totalMinutes % (24 * 60);
    const hrs = Math.floor(remainderMinutes / 60);
    const mins = remainderMinutes % 60;
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hrs > 0 || days > 0) parts.push(`${hrs}h`);
    parts.push(`${mins}m`);
    return parts.join(" ");
}

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
    let avgTaskCompletionTime = 0;
    const closedTaskList = filteredTasks.filter(task => task.taskCompletedAt !== null);
    if (closedTaskList.length > 0) {
        const totalTimeMs = closedTaskList.reduce((sum, task) => sum + (task.taskCompletedAt.getTime() - task.createdAt.getTime()), 0);
        avgTaskCompletionTime = totalTimeMs / closedTaskList.length / (1000 * 60 * 60);
    }

    // Count total and closed subtasks across filtered tasks
    let totalSubtasks = 0;
    let closedSubtasks = 0;
    filteredTasks.forEach(task => {
        if (Array.isArray(task.subtasks)) {
            totalSubtasks += task.subtasks.length;
            closedSubtasks += task.subtasks.filter(sub => sub.isCompleted).length;
        }
    });

    // Compute projects statistics
    let totalProjects = 0;
    let completedProjects = 0;
    let totalProjectTimeMs = 0;
    let countCompletedProjects = 0;
    if (filters.selectedProject === "All") {
        projects.forEach(project => {
            const projectTasks = filteredTasks.filter(task => task.projectId === project.id);
            // totalProjects++;
            // // Completed project is if it has at least one task and all its tasks are closed
            // if (projectTasks.length > 0 && projectTasks.every(task => task.taskCompletedAt !== null)) {
            //     completedProjects++;
            // }
            if (projectTasks.length > 0) {
                totalProjects++;
                if (projectTasks.every(task => task.taskCompletedAt !== null)) {
                    completedProjects++;
                    const minCreatedAt = new Date(Math.min(...projectTasks.map(task => task.createdAt.getTime())));
                    const maxCompletedAt = new Date(Math.max(...projectTasks.map(task => task.taskCompletedAt.getTime())));
                    const projectTimeMs = maxCompletedAt.getTime() - minCreatedAt.getTime();
                    totalProjectTimeMs += projectTimeMs;
                    countCompletedProjects++;
                }
            }
        });
    } else {
        // Filtering by a single project
        totalProjects = 1;
        const projectTasks = filteredTasks.filter(task => task.projectId === filters.selectedProject);
        // if (projectTasks.length > 0 && projectTasks.every(task => task.taskCompletedAt !== null)) {
        //     completedProjects = 1;
        // }
        if (projectTasks.length > 0 && projectTasks.every(task => task.taskCompletedAt !== null)) {
            completedProjects = 1;
            const minCreatedAt = new Date(Math.min(...projectTasks.map(task => task.createdAt.getTime())));
            const maxCompletedAt = new Date(Math.max(...projectTasks.map(task => task.taskCompletedAt.getTime())));
            totalProjectTimeMs = maxCompletedAt.getTime() - minCreatedAt.getTime();
            countCompletedProjects = 1;
        }
    }

    let avgProjectCompletionTime = 0;
    if (countCompletedProjects > 0) {
        avgProjectCompletionTime = totalProjectTimeMs / countCompletedProjects / (1000 * 60 * 60);
    }

    // Compute unassigned open to‑do lists
    const unassignedOpenTasks = filteredTasks.filter(
        task => (!task.projectId || task.projectId === "null") && task.taskCompletedAt === null
    ).length;

    return {
        totalProjects,
        completedProjects,
        totalTasks,
        closedTasks,
        openTasks,
        avgTaskCompletionTime: formatDuration(avgTaskCompletionTime),
        totalSubtasks,
        closedSubtasks,
        // avgSubtaskCompletionTime: avgSubtaskCompletionTime.toFixed(2),
        avgProjectCompletionTime: formatDuration(avgProjectCompletionTime),
        unassignedOpenTasks,
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

// Prepare data for closed subtasks by priority
export function prepareClosedSubtasksByPriority(tasks, filters) {
    const counts = PRIORITIES.map(priority => {
        let count = 0;
        const filteredTasks = filterTasks(tasks, filters);
        filteredTasks.forEach(task => {
            if (Array.isArray(task.subtasks)) {
                count += task.subtasks.filter(sub => sub.isCompleted && sub.priority === priority).length;
            }
        });
        return count;
    });
    return {
        labels: PRIORITIES,
        datasets: [{ data: counts }]
    };
}

// Prepare data for open vs closed subtasks for a pie chart
export function prepareSubtasksOpenVsClosedData(tasks, filters) {
    let total = 0;
    let closed = 0;
    const filteredTasks = filterTasks(tasks, filters);
    filteredTasks.forEach(task => {
        if (Array.isArray(task.subtasks)) {
            total += task.subtasks.length;
            closed += task.subtasks.filter(sub => sub.isCompleted).length;
        }
    });
    const open = total - closed;
    return [
        {
            name: "Closed",
            population: closed,
            color: "#2ecc71",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12,
        },
        {
            name: "Open",
            population: open,
            color: "#e74c3c",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12,
        }
    ];
}

// Prepare data for open vs closed projects for a pie chart
export function prepareProjectsOpenVsClosedData(projects, tasks, filters) {
    let openProjects = 0;
    let closedProjects = 0;
    const filteredTasks = filterTasks(tasks, filters);
    projects.forEach(project => {
        const projectTasks = filteredTasks.filter(task => task.projectId === project.id);
        if (projectTasks.length > 0) {
            if (projectTasks.every(task => task.taskCompletedAt !== null)) {
                closedProjects++;
            } else {
                openProjects++;
            }
        }
    });
    return [
        {
            name: "Closed",
            population: closedProjects,
            color: "#2ecc71",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12,
        },
        {
            name: "Open",
            population: openProjects,
            color: "#e74c3c",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12,
        }
    ];
}


// ---------------- TREND CHARTS ----------------

// Prepare trend line data for tasks completed per day over the past 7 days
export function prepareTaskTrendLineData(tasks, filters) {
    const days = 7;
    const trendData = {};
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        trendData[date.toDateString()] = 0;
    }
    const filteredTasks = filterTasks(tasks, filters);
    filteredTasks.forEach(task => {
        if (task.taskCompletedAt) {
            const key = new Date(task.taskCompletedAt).toDateString();
            if (trendData.hasOwnProperty(key)) {
                trendData[key]++;
            }
        }
    });
    const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
    const dataPoints = labels.map(label => trendData[label]);
    return { labels, datasets: [{ data: dataPoints }] };
}

// Prepare trend line data for projects completed per day over the past 7 days
export function prepareProjectTrendLineData(projects, tasks, filters) {
    // For each project determine its completion date if it is complete and group by completion date
    const days = 7;
    const trendData = {};
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        trendData[date.toDateString()] = 0;
    }
    // For each project get its tasks from the filtered tasks
    projects.forEach(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        if (projectTasks.length > 0 && projectTasks.every(task => task.taskCompletedAt !== null)) {
            const projectCompletionDate = new Date(Math.max(...projectTasks.map(task => task.taskCompletedAt.getTime())));
            const key = projectCompletionDate.toDateString();
            if (trendData.hasOwnProperty(key)) {
                trendData[key]++;
            }
        }
    });
    const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
    const dataPoints = labels.map(label => trendData[label]);
    return { labels, datasets: [{ data: dataPoints }] };
}

// Prepare trend line data for average project completion time per day over the past 7 days
export function prepareAvgProjectCompletionTrendLineData(projects, tasks, filters) {
    const days = 7;
    const trendData = {};
    const today = new Date();
    // For each day store an array of project completion times (in hours)
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        trendData[date.toDateString()] = [];
    }
    projects.forEach(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        if (projectTasks.length > 0 && projectTasks.every(task => task.taskCompletedAt !== null)) {
            const minCreatedAt = new Date(Math.min(...projectTasks.map(task => task.createdAt.getTime())));
            const maxCompletedAt = new Date(Math.max(...projectTasks.map(task => task.taskCompletedAt.getTime())));
            const projectCompletionTime = (maxCompletedAt.getTime() - minCreatedAt.getTime()) / (1000 * 60 * 60);
            const key = maxCompletedAt.toDateString();
            if (trendData.hasOwnProperty(key)) {
                trendData[key].push(projectCompletionTime);
            }
        }
    });
    // Compute the average for each day
    const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
    const dataPoints = labels.map(label => {
        const times = trendData[label];
        if (times.length === 0) return 0;
        const avg = times.reduce((sum, val) => sum + val, 0) / times.length;
        return parseFloat(avg.toFixed(2));
    });
    return { labels, datasets: [{ data: dataPoints }] };
}

// Compute average To-Do List completion time trend
export function prepareAvgTaskTrendLineData(tasks, filters) {
    const days = 7;
    const trendData = {};
    const today = new Date();
    // For each day create an empty array to collect durations in hours
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        trendData[date.toDateString()] = [];
    }
    const filteredTasks = filterTasks(tasks, filters);
    filteredTasks.forEach(task => {
        if (task.taskCompletedAt) {
            const key = new Date(task.taskCompletedAt).toDateString();
            if (trendData.hasOwnProperty(key)) {
                const duration = (task.taskCompletedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
                trendData[key].push(duration);
            }
        }
    });
    const labels = Object.keys(trendData).sort((a, b) => new Date(a) - new Date(b));
    const dataPoints = labels.map(label => {
        const durations = trendData[label];
        if (durations.length === 0) return 0;
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        return parseFloat(avg.toFixed(2));
    });
    return { labels, datasets: [{ data: dataPoints }] };
}

// Wrapper function allows to choose which trend data to return based on a metric
export function prepareTrendLineDataForMetric(metric, tasks, projects, filters) {
    // metric can be one of: "Tasks Completed", "Projects Completed", "Avg Project Completion Time"
    if (metric === "Projects Completed") {
        return prepareProjectTrendLineData(projects, tasks, filters);
    } else if (metric === "Avg Project Completion Time") {
        return prepareAvgProjectCompletionTrendLineData(projects, tasks, filters);
    } else if (metric === "Avg To-Do List Completion Time") {
        return prepareAvgTaskTrendLineData(tasks, filters);
    } else {
        // Default to "Tasks Completed"
        return prepareTaskTrendLineData(tasks, filters);
    }
}
