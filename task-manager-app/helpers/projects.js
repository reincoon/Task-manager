// Group to-do lists by projects
export function groupTasksByProject(tasks) {
    const noProject = tasks.filter(t => !t.project);
    const byProject = {};
    tasks.forEach(t => {
        if (t.project) {
            if (!byProject[t.project]) {
                byProject[t.project] = [];
            }
            byProject[t.project].push(t);
        }
    });
    return { noProject, byProject };
}

// Create a flat data structure for DraggableFlatList
export function buildListData(noProject, byProject) {
    let data = [];
    if (noProject.length > 0) {
        data.push({ type: 'noProjectHeader' });
        noProject.forEach(task => data.push({ type: 'task', ...task }));
    }

    for (let pName in byProject) {
        data.push({type:'projectHeader', projectName:pName});
        byProject[pName].forEach(task => data.push({ type:'task', ...task }));
    }
    return data;
}