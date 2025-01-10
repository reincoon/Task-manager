// Group to-do lists by projects
export function groupTasksByProject(tasks, projects) {
    const noProject = tasks.filter(t => !t.projectId);
    const byProject = {};
    projects.forEach((proj) => {
        byProject[proj.id] = [];
    });
    tasks.forEach(t => {
        // if (t.project) {
        //     if (!byProject[t.project]) {
        //         byProject[t.project] = [];
        //     }
        //     byProject[t.project].push(t);
        // }
        if (t.projectId && byProject[t.projectId]) {
            byProject[t.projectId].push(t);
        }
    });
    return { noProject, byProject };
}

// Create a flat data structure for DraggableFlatList
export function buildListData(noProject, byProject, projects) {
    let data = [];
    // if (noProject.length > 0) {
    data.push({ type: 'noProjectHeader' });
    noProject.forEach(task => data.push({ type: 'task', ...task }));
    // }

    // for (let pName in byProject) {
    //     const project = projects.find(p => p.id === pName);
    //     const projectName = project ? project.name : 'Unknown Project';
    //     data.push({ type: 'projectHeader', pName: pName, projectName });
    //     // data.push({type:'projectHeader', projectName:pName});
    //     byProject[pName].forEach(task => data.push({ type:'task', ...task }));
    // }
    for (let pId in byProject) {
        const project = projects.find(p => p.id === pId);
        const projectName = project ? project.name : 'Unknown Project';
    
        // Insert a projectHeader row
        data.push({ type: 'projectHeader', pName: pId, projectName });
    
        // Insert each task in that project
        byProject[pId].forEach(task => data.push({ type: 'task', ...task }));
    }
    return data;
}