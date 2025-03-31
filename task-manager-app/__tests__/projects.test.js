import {
    groupTasksByProject,
    buildListData,
    groupTasksByPriority,
    buildListDataByPriority,
} from '../helpers/projects';

describe('projects module', () => {
    test('groupTasksByProject groups tasks into noProject and byProject', () => {
        const tasks = [
            { id: "t1", title: "Task 1", projectId: "p1" },
            { id: "t2", title: "Task 2" }, // no project
            { id: "t3", title: "Task 3", projectId: "p2" },
            { id: "t4", title: "Task 4", projectId: "p1" },
        ];
        const projects = [
            { id: "p1", name: "Project One" },
            { id: "p2", name: "Project Two" },
        ];

        const { noProject, byProject } = groupTasksByProject(tasks, projects);
    
        // Tasks without a project
        expect(noProject).toHaveLength(1);
        expect(noProject[0].id).toBe("t2");
    
        // Tasks with project assigned
        expect(Object.keys(byProject)).toEqual(["p1", "p2"]);
        expect(byProject["p1"]).toHaveLength(2);
        expect(byProject["p2"]).toHaveLength(1);
    });

    test('buildListData returns a flat list with headers and tasks', () => {
        const noProject = [
            { id: "t1", title: "Task 1", order: 2 },
            { id: "t2", title: "Task 2", order: 1 },
        ];
        const byProject = {
            p1: [
                { id: "t3", title: "Task 3", order: 3 },
                { id: "t4", title: "Task 4", order: 1 },
            ],
            p2: [
                { id: "t5", title: "Task 5", order: 2 },
            ],
        };
        const projects = [
            { id: "p1", name: "Project One" },
            { id: "p2", name: "Project Two" },
        ];
  
        const listData = buildListData(noProject, byProject, projects, null);
        expect(listData[0]).toEqual({ type: 'noProjectHeader' });
        // Check that tasks in noProject are sorted by order
        expect(listData[1].order).toBeLessThanOrEqual(listData[2].order);
        // Check that a project header is present
        const headerP1 = listData.find(item => item.type === 'projectHeader' && item.pName === 'p1');
        expect(headerP1).toBeDefined();
    });
  
    test('groupTasksByPriority groups tasks by provided priorities and unexpected ones', () => {
        const tasks = [
            { id: "t1", title: "Task 1", priority: "Low" },
            { id: "t2", title: "Task 2", priority: "High" },
            { id: "t3", title: "Task 3", priority: "Urgent" }, // unexpected priority
        ];
        // Priorities provided
        const priorities = ["Low", "Moderate", "High", "Critical"];
        const byPriority = groupTasksByPriority(tasks, priorities);
        expect(byPriority.Low).toHaveLength(1);
        expect(byPriority.Moderate).toHaveLength(0);
        expect(byPriority.High).toHaveLength(1);
        expect(byPriority.Critical).toHaveLength(0);
        // Unexpected priority should be added
        expect(byPriority.Urgent).toHaveLength(1);
    });

    test('buildListDataByPriority returns a flat list with priority headers and sorted tasks', () => {
        // Manually construct a byPriority object
        const byPriority = {
            Low: [
                { id: "t1", title: "Task A", order: 2 },
                { id: "t2", title: "Task B", order: 1 },
            ],
            Moderate: [
                { id: "t3", title: "Task C", order: 3 },
            ],
            High: [],
            Critical: [
                { id: "t4", title: "Task D", order: 5 },
                { id: "t5", title: "Task E", order: 4 },
            ],
        };
        const listData = buildListDataByPriority(byPriority, null);
        // Headers for each key
        expect(listData).toEqual([
            { type: 'priorityHeader', priority: 'Low' },
            // Tasks under Low should be sorted by order ascending
            { type: 'task', id: "t2", title: "Task B", order: 1 },
            { type: 'task', id: "t1", title: "Task A", order: 2 },
            { type: 'priorityHeader', priority: 'Moderate' },
            { type: 'task', id: "t3", title: "Task C", order: 3 },
            { type: 'priorityHeader', priority: 'High' },
            // No tasks under High
            { type: 'priorityHeader', priority: 'Critical' },
            { type: 'task', id: "t5", title: "Task E", order: 4 },
            { type: 'task', id: "t4", title: "Task D", order: 5 },
        ]);
    });
});