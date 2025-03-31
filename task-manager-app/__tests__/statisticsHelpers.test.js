jest.mock('../helpers/constants', () => ({
    PRIORITIES: ["Low", "Moderate", "High", "Critical"],
}));

import {
    formatDuration,
    filterTasks,
    computeStatistics,
    prepareBarChartData,
    prepareClosedSubtasksByPriority,
    prepareSubtasksOpenVsClosedData,
    prepareProjectsOpenVsClosedData,
    prepareTaskTrendLineData,
    prepareProjectTrendLineData,
    prepareAvgProjectCompletionTrendLineData,
    prepareAvgTaskTrendLineData,
    prepareTrendLineDataForMetric,
} from '../helpers/statisticsHelpers';

const defaultFilters = {
    startDate: undefined,
    endDate: undefined,
    selectedProject: "All",
    selectedPriority: "All",
};

describe('statisticsHelpers', () => {
    describe('formatDuration', () => {
        test('returns "0m" for falsy or NaN input', () => {
            expect(formatDuration(0)).toBe("0m");
            expect(formatDuration(undefined)).toBe("0m");
            expect(formatDuration(NaN)).toBe("0m");
        });
    
        test('formats a duration in hours correctly', () => {
            expect(formatDuration(1)).toBe("1h 0m");
            expect(formatDuration(26.3)).toBe("1d 2h 18m");
        });
    });

    describe('filterTasks', () => {
        test('filters tasks by creation date, project and priority', () => {
            const tasks = [
                { createdAt: new Date('2025-01-01T00:00:00Z'), projectId: "p1", priority: "Low" },
                { createdAt: new Date('2025-01-05T00:00:00Z'), projectId: "p2", priority: "High" },
                { createdAt: new Date('2025-01-10T00:00:00Z'), projectId: "p1", priority: "Moderate" },
            ];
            const filters = {
                startDate: new Date('2025-01-03T00:00:00Z'),
                endDate: new Date('2025-01-09T00:00:00Z'),
                selectedProject: "p1",
                selectedPriority: "All",
            };
            const result = filterTasks(tasks, filters);
            // No task should match
            expect(result).toHaveLength(0);

            // Change filters to include all dates and project "p1"
            const filters2 = {
                startDate: undefined,
                endDate: undefined,
                selectedProject: "p1",
                selectedPriority: "All",
            };
            const result2 = filterTasks(tasks, filters2);
            expect(result2).toHaveLength(2);
        });
    });

    describe('computeStatistics', () => {
        test('computes statistics from tasks and projects', () => {
            // Sample tasks
            const tasks = [
                {
                    createdAt: new Date('2025-01-01T00:00:00Z'),
                    taskCompletedAt: new Date('2025-01-02T00:00:00Z'),
                    projectId: "p1",
                    subtasks: [{ isCompleted: true }],
                },
                {
                    createdAt: new Date('2025-01-03T00:00:00Z'),
                    taskCompletedAt: null,
                    projectId: "p2",
                    subtasks: [{ isCompleted: false }],
                },
                {
                    createdAt: new Date('2025-01-04T00:00:00Z'),
                    taskCompletedAt: new Date('2025-01-05T00:00:00Z'),
                    projectId: "p1",
                    subtasks: [],
                },
            ];
            const projects = [
                { id: "p1" },
                { id: "p2" },
            ];
            const stats = computeStatistics(tasks, projects, defaultFilters);
            // totalTasks = 3, closedTasks = 2, openTasks = 1
            expect(stats.totalTasks).toBe(3);
            expect(stats.closedTasks).toBe(2);
            expect(stats.openTasks).toBe(1);
            expect(stats.avgTaskCompletionTime).toBe("1d 0h 0m");
            expect(stats.totalProjects).toBe(2);
            expect(stats.completedProjects).toBe(1);
            expect(stats.avgProjectCompletionTime).toBe("4d 0h 0m");
            expect(stats.totalSubtasks).toBe(2);
            expect(stats.closedSubtasks).toBe(1);
            expect(stats.unassignedOpenTasks).toBe(0);
        });
    });

    describe('prepareBarChartData', () => {
        test('prepares bar chart data for closed tasks grouped by priority', () => {
            const tasks = [
            { priority: "Low", taskCompletedAt: new Date(), createdAt: new Date() },
            { priority: "Moderate", taskCompletedAt: null, createdAt: new Date() },
            { priority: "High", taskCompletedAt: new Date(), createdAt: new Date() },
            ];
            const chartData = prepareBarChartData(tasks, defaultFilters);
            expect(chartData.labels).toEqual(["Low", "Moderate", "High", "Critical"]);
            // Low and High should count 1 each, Moderate and Critical 0.
            expect(chartData.datasets[0].data).toEqual([1, 0, 1, 0]);
        });
    });

    describe('prepareClosedSubtasksByPriority', () => {
        test('prepares data for closed subtasks grouped by priority', () => {
            const tasks = [
                { 
                    subtasks: [
                    { isCompleted: true, priority: "Low" },
                    { isCompleted: false, priority: "Low" },
                    { isCompleted: true, priority: "High" }
                    ], 
                    createdAt: new Date() 
                },
            ];
            const data = prepareClosedSubtasksByPriority(tasks, defaultFilters);
            expect(data.labels).toEqual(["Low", "Moderate", "High", "Critical"]);
            expect(data.datasets[0].data).toEqual([1, 0, 1, 0]);
        });
    });

    describe('prepareSubtasksOpenVsClosedData', () => {
        test('prepares open vs closed subtasks pie chart data', () => {
            const tasks = [
                { 
                    subtasks: [
                    { isCompleted: true },
                    { isCompleted: false },
                    ], 
                    createdAt: new Date() 
                },
            ];
            const data = prepareSubtasksOpenVsClosedData(tasks, defaultFilters);
            // Total subtasks: 2, closed: 1, open: 1
            expect(data[0].population).toBe(1);
            expect(data[1].population).toBe(1);
        });
    });

    describe('prepareProjectsOpenVsClosedData', () => {
        test('prepares open vs closed projects pie chart data', () => {
            const projects = [{ id: "p1" }, { id: "p2" }];
            const tasks = [
                { projectId: "p1", taskCompletedAt: new Date(), createdAt: new Date() },
                { projectId: "p2", taskCompletedAt: null, createdAt: new Date() },
            ];
            const data = prepareProjectsOpenVsClosedData(projects, tasks, defaultFilters);
            // p1 has one completed task, p2 has one open task
            expect(data[0].population).toBe(1); // Closed projects
            expect(data[1].population).toBe(1); // Open projects
        });
    });

    describe('prepareTaskTrendLineData', () => {
        test('counts a task completed today', () => {
            const now = new Date();
            const task = {
                createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
                taskCompletedAt: now,
            };
            const data = prepareTaskTrendLineData([task], defaultFilters);
            // Use today's date string as generated by new Date().toDateString()
            const todayLabel = now.toDateString();
            const index = data.labels.indexOf(todayLabel);
            expect(index).not.toBe(-1);
            expect(data.datasets[0].data[index]).toBe(1);
        });
    });

    describe('prepareProjectTrendLineData', () => {
        test('prepares trend line data for projects completed per day', () => {
            const today = new Date();
            const tasks = [
                {
                    projectId: "p1",
                    createdAt: new Date(today.getTime() - 5 * 60 * 60 * 1000),
                    taskCompletedAt: today,
                }
            ];
            const projects = [{ id: "p1" }];
            const data = prepareProjectTrendLineData(projects, tasks, defaultFilters);
            expect(data.labels.length).toBe(7);
            expect(data.datasets[0].data.some(count => count === 1)).toBe(true);
        });
    });

    describe('prepareAvgProjectCompletionTrendLineData', () => {
        test('prepares average project completion time trend line data', () => {
            const today = new Date();
            const tasks = [
                {
                    projectId: "p1",
                    createdAt: new Date(today.getTime() - 10 * 60 * 60 * 1000),
                    taskCompletedAt: today,
                }
            ];
            const projects = [{ id: "p1" }];
            const data = prepareAvgProjectCompletionTrendLineData(projects, tasks, defaultFilters);
            expect(data.labels.length).toBe(7);
            expect(data.datasets[0].data.some(avg => avg > 0)).toBe(true);
        });
    });

    describe('prepareAvgTaskTrendLineData', () => {
        test('prepares average task completion time trend line data', () => {
            const today = new Date();
            const task = {
                createdAt: new Date(today.getTime() - 3 * 60 * 60 * 1000),
                taskCompletedAt: today,
            };
            const data = prepareAvgTaskTrendLineData([task], defaultFilters);
            expect(data.labels.length).toBe(7);
            expect(data.datasets[0].data.some(avg => Math.abs(avg - 3) < 0.01)).toBe(true);
        });
    });
  
    describe('prepareTrendLineDataForMetric', () => {
        test('returns tasks completed data by default', () => {
            const tasks = [
                { createdAt: new Date(), taskCompletedAt: new Date(), projectId: "p1" }
            ];
            const projects = [{ id: "p1" }];
            const data = prepareTrendLineDataForMetric("Some Other Metric", tasks, projects, defaultFilters);
            const expected = prepareTaskTrendLineData(tasks, defaultFilters);
            expect(data).toEqual(expected);
        });
    
        test('returns project trend line data for "Projects Completed"', () => {
            const tasks = [
                { projectId: "p1", createdAt: new Date(), taskCompletedAt: new Date() }
            ];
            const projects = [{ id: "p1" }];
            const data = prepareTrendLineDataForMetric("Projects Completed", tasks, projects, defaultFilters);
            const expected = prepareProjectTrendLineData(projects, tasks, defaultFilters);
            expect(data).toEqual(expected);
        });
    });
});
