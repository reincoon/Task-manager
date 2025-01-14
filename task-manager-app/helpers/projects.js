import { PRIORITY_ORDER, COLOUR_ORDER } from "./constants";
// Group to-do lists by projects
export function groupTasksByProject(tasks, projects) {
    const noProject = tasks.filter(t => !t.projectId);
        // .sort((a, b) => (a.order || 0) - (b.order || 0));
    const byProject = {};
    projects.forEach((proj) => {
        byProject[proj.id] = [];
    });
    tasks.forEach(t => {
        if (t.projectId && byProject[t.projectId]) {
            byProject[t.projectId].push(t);
        }
    });

    // // Sort each project's tasks by order
    // for (let pId in byProject) {
    //     byProject[pId].sort((a, b) => (a.order || 0) - (b.order || 0));
    // }
    
    return { noProject, byProject };
}

// Sort todo lists for different sorting options
function applySortOption(a, b, sortOption) {
    if (sortOption === 'priority') {
        return (PRIORITY_ORDER[a.priority] || 999) - (PRIORITY_ORDER[b.priority] || 999);
    } else if (sortOption === 'date') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
    } else if (sortOption === 'colour') {
        return (COLOUR_ORDER[a.colour] || 999) - (COLOUR_ORDER[b.colour] || 999);
    }
    return (a.order || 0) - (b.order || 0);
}

// Create a flat data structure for DraggableFlatList
export function buildListData(noProject, byProject, projects, sortOption = null) {
    let data = [];
    data.push({ type: 'noProjectHeader' });
    // Sort unassigned to-do lists
    noProject.sort((a, b) => applySortOption(a, b, sortOption));
    noProject.forEach(task => data.push({ type: 'task', ...task }));

    for (let pId in byProject) {
        const project = projects.find(p => p.id === pId);
        const projectName = project ? project.name : 'Unknown Project';
    
        // Insert a projectHeader row
        data.push({ type: 'projectHeader', pName: pId, projectName });
    
        // Sort todo lists within the project
        byProject[pId].sort((a, b) => applySortOption(a, b, sortOption));

        // Insert each task in that project
        byProject[pId].forEach(task => data.push({ type: 'task', ...task }));
    }
    return data;
}