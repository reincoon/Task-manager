import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import TodoCard from "./TodoCard";
import { groupTasksByProject, buildListData, groupTasksByPriority, buildListDataByPriority } from '../helpers/projects';
import { PRIORITIES } from "../helpers/priority";
import { updateTasksPriority, updateTasksProject, reorderTasksWithinProject, reorderTasks, updateProjectName, deleteProject } from "../helpers/firestoreHelpers";

const ListView = ({
    userId,
    tasks,
    projects,
    sortOption,
    setSortOption,
    navigation,
    // updateTasksProject,
    // reorderTasksWithinProject,
    deleteTask,
    setDraggingTask,
    setHoveredTask,
    grouping,
    onEditProject,
    editingProjectIds,
    onCancelEditing,
    onRenameProject
}) => {
    const [data, setData] = useState([]);
    const [editingProjectId, setEditingProjectId] = useState(null);
    // const [newProjectName, setNewProjectName] = useState("");
    const [newProjectNames, setNewProjectNames] = useState({});
    
    // const [originalData, setOriginalData] = useState([]);
    // const [sourceColumnKey, setSourceColumnKey] = useState(null);

    // useEffect(() => {
    //     const { noProject, byProject } = groupTasksByProject(tasks, projects);
    //     const newData = buildListData(noProject, byProject, projects, sortOption);
    //     setData(newData);
    // }, [tasks, projects, sortOption]);
    useEffect(() => {
        let newData = [];
        if (grouping === 'project') {
            const { noProject, byProject } = groupTasksByProject(tasks, projects);
            newData = buildListData(noProject, byProject, projects, sortOption);
        } else if (grouping === 'priority') {
            const byPriority = groupTasksByPriority(tasks, PRIORITIES);
            newData = buildListDataByPriority(byPriority, sortOption);
        }
        setData(newData);
    }, [tasks, projects, sortOption, grouping]);

    const getProjectName = (projectId) => {
        if (!projectId) return 'Unassigned';
        const found = projects.find((p) => p.id === projectId);
        return found ? found.name : 'Unassigned';
    };

    const handleStartEditingProject = (projectId, currentName) => {
        console.log("Starting edit for project:", projectId);
        setEditingProjectId(projectId);
        setNewProjectNames(prev => ({
            ...prev,
            [projectId]: currentName, // Set initial project name
        }));
    };
    
    const handleCancelEditingProject = (projectId) => {
        setEditingProjectId(null);
        setNewProjectNames(prev => {
            // Remove project’s draft name from state
            const updated = { ...prev };
            delete updated[projectId];
            return updated;
        });
    };

    const handleRenameProject = async (projectId, newName) => {
        if (!newName.trim()) {
            Alert.alert("Invalid Name", "Project name cannot be empty.");
            return;
        }

        if (!userId || !projectId || !newName) {
            Alert.alert("Error", "User ID, Project ID, and the new project name are required.");
            return;
        }
    
        console.log("projectId:", projectId); 
        // try {
        //     await updateProjectName(userId, projectId, newName);
        //     Alert.alert("Success", "Project renamed successfully.");
        //     setEditingProjectId(null);
        //     setNewProjectNames(prev => {
        //         const updated = { ...prev };
        //         delete updated[projectId]; // Remove the edited project from the state
        //         return updated;
        //     });
        // } catch (error) {
        //     console.error("Error renaming project:", error);
        //     Alert.alert("Error", "Could not rename project.");
        // } 
        // Update project name in Firestore outside of render cycle
        setNewProjectNames((prevNames) => ({
            ...prevNames,
            [projectId]: newName,
        }));
        // setEditingProjectId(null);
        try {
            await updateProjectName(userId, projectId, newName);
            Alert.alert("Success", "Project renamed successfully.");
            setEditingProjectId(null);
            setNewProjectNames(prev => {
                const updated = { ...prev };
                delete updated[projectId]; // Remove the edited project from the state
                return updated;
            });
        } catch (error) {
            console.error("Error renaming project:", error);
            Alert.alert("Error", "Could not rename project.");
        }
    };

    useEffect(() => {
        if (Object.keys(newProjectNames).length === 0) return;

        const projectIdsToUpdate = Object.keys(newProjectNames);
        const updateProjectNames = async () => {
            try {
                for (let projectId of projectIdsToUpdate) {
                    const newName = newProjectNames[projectId];
                    await updateProjectName(userId, projectId, newName);
                    Alert.alert("Success", "Project renamed successfully.");
                }
            } catch (error) {
                console.error("Error renaming project:", error);
                Alert.alert("Error", "Could not rename project.");
            }
        };

        updateProjectNames();
    }, [newProjectNames, userId]);

    
    const handleDeleteProject = (projectId, projectName) => {
        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete the project "${projectName}" and all its tasks?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteProject(userId, projectId);
                            Alert.alert("Deleted", "Project and its tasks deleted successfully.");
                        } catch (error) {
                            console.error("Error deleting project:", error);
                            Alert.alert("Error", "Could not delete project.");
                        }
                    },
                },
            ]
        );
    };
    

    const renderItem = useCallback(({ item, drag }) => {
        if (item.type === 'projectHeader') {
            const projectId = item.projectId;
            const projectName = item.projectName;

            // Check if this header is in edit mode
            const isEditing = editingProjectIds[projectId];
            const currentProjectName = newProjectNames[projectId] || projectName;

            return (
                // <View style={styles.projectHeader}>
                //     <Text style={[styles.projectHeaderText, { color: '#333' }]}>
                //         {item.projectName}
                //     </Text>
                // </View>
                <View style={styles.projectHeader}>
                    {isEditing ? (
                        <View style={styles.editProjectName}>
                            <TextInput
                                style={styles.projectInput}
                                value={newProjectNames[projectId] || projectName}
                                onChangeText={(text) => {
                                    setNewProjectNames((prev) => ({
                                        ...prev,
                                        [projectId]: text
                                    }));
                                }}
                                placeholder="Enter new project name"
                            />
                            <TouchableOpacity
                                onPress={() => onRenameProject(projectId, newProjectNames[projectId])}
                                style={styles.saveButton}
                            >
                                <Text style={{ color: 'blue', marginRight: 10 }}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => onCancelEditing(projectId)}
                                style={styles.cancelButton}
                            >
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.projectHeaderTextContainer}>
                            <Text style={styles.projectHeaderText}>{projectName}</Text>
                            <TouchableOpacity
                                // onPress={() => handleStartEditingProject(projectId, projectName)}
                                onPress={() => onEditProject(projectId)}
                                style={styles.iconButton}
                            >
                                <Text style={{ color: 'blue' }}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDeleteProject(projectId, projectName)}
                                style={styles.iconButton}
                            >
                                <Text style={{ color: 'red' }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            );
        }
        if (item.type === 'priorityHeader') {
            return (
                <View style={styles.priorityHeader}>
                    <Text style={[styles.priorityHeaderText, { color: '#333' }]}>
                        {item.priority} Priority
                    </Text>
                </View>
            );
        }
        if (item.type === 'noProjectHeader') {
            return (
                <View style={[styles.projectHeader, { backgroundColor: '#ccc' }]}>
                    <Text style={styles.projectHeaderText}>Unassigned To-Do Lists</Text>
                </View>
            );
        }
        if (item.type === 'task') {
            const projectName = getProjectName(item.projectId);
            return (
                <TodoCard
                    task={item}
                    projectName={projectName}
                    onLongPress={() => {
                        setDraggingTask(item);
                        drag();
                    }}
                    onPress={() =>
                        navigation.navigate('TaskDetailsScreen', { taskId: item.id })
                    }
                    onDeleteTask={() => {
                        // Handle a delete confirmation
                        Alert.alert('Confirm', 'Delete this to-do list?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                    try {
                                        await deleteTask(item);
                                        Alert.alert('Deleted', 'Task deleted successfully');
                                    } catch (err) {
                                        console.error('Error deleting task:', err);
                                        Alert.alert('Error', 'Could not delete task');
                                    }
                                },
                            },
                        ]);
                    }}
                    showMoveButton={false}
                />
            );
        }

        return null;
    }, [grouping, projects, navigation, setDraggingTask, deleteTask, editingProjectId, newProjectNames, onEditProject]);

    const keyExtractor = (item, index) => {
        if (item.type === 'projectHeader') {
            return `projectHeader-${item.projectId}-${index}`;
            // return `projectHeader-${item.projectId}`;
        }
        if (item.type === 'priorityHeader') {
            return `priorityHeader-${item.priority}-${index}`;
        }
        if (item.type === 'noProjectHeader') {
            return `noProjectHeader-${index}`;
        }
        return item.id;
    };

    const onDragEnd = async ({ data: newData, from, to }) => {
        if (from === to) return;

        const draggedItem = newData[to];
        
        // setOriginalData(oldData);
        if (draggedItem.type !== 'task') {
            // Reorder tasks
            setData(newData);
            return;
        }
        const oldData = data;            

        // Figure out the new group after reordering
        let finalProjectId = null;
        let finalPriority = null;

        // Scan upward from the `to` index to find the nearest header
        for (let i = to; i >= 0; i--) {
            const checkItem = newData[i];
            if (checkItem.type === 'projectHeader') {
                finalProjectId = checkItem.pName;
                break;
            } else if (checkItem.type === 'priorityHeader') {
                finalPriority = checkItem.priority;
                break;
            } else if (checkItem.type === 'noProjectHeader') {
                finalProjectId = null;
                break;
            }
        }

        // Distinguish whether it's a reorder or a group change
        const originalProjectId = draggedItem.projectId || null;
        const originalPriority = draggedItem.priority || 'Low';

            // Proceed with normal reordering or moving
        try {
            if (grouping === 'project') {
                // If finalProjectId differs from the old project
                if (finalProjectId !== originalProjectId) {
                    // Update local item so it visually moves to the new group
                    draggedItem.projectId = finalProjectId || null;
        
                    // Move to new project or unassigned
                    await updateTasksProject(userId, [draggedItem], finalProjectId);
                    Alert.alert(
                        'Success',
                        finalProjectId ? 'Task moved to the selected project.' : 'Task unassigned.'
                    );
                } else {
                    // Reorder within the same project/unassigned
                    const tasksInSameProject = newData.filter(
                        (it) => it.type === 'task' && (it.projectId || null) === originalProjectId
                    );
                    // This sets new `order` fields
                    await reorderTasks(userId, tasksInSameProject, originalProjectId, undefined);
                    Alert.alert('Success', 'Tasks reordered successfully.');
                }
            } else {
                // Grouping by priority

                if (finalPriority && finalPriority !== originalPriority) {
                    // Change the priority
                    draggedItem.priority = finalPriority;

                    await updateTasksPriority(userId, [draggedItem], finalPriority);
                    Alert.alert('Success', `Task priority set to "${finalPriority}".`);
                } else {
                    // Reordering within the same priority
                    const tasksInSamePriority = newData.filter(
                        (it) => it.type === 'task' && (it.priority || 'Low') === originalPriority
                    );
                    await reorderTasks(userId, tasksInSamePriority, null, originalPriority);
                    Alert.alert('Success', 'Tasks reordered within same priority.');
                }
            }
        
        } catch (error) {
            console.error('Error in onDragEnd:', error);
            Alert.alert('Error', 'Failed to update tasks after drag-and-drop.');
            setData(oldData); // Revert UI on failure
            return;
        }
        // If reorderinhg within the same section with no project change, store new order
        setData(newData);
        setSortOption(null);
    };

    if (data.length === 0) {
        return (
            <Text style={styles.noTasksText}>
                No tasks available. Create a new to-do list!
            </Text>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.instructionsText}>
                {'\n'}- Drag a to-do list to a project header or a task in that project to move it into the project.
                {'\n'}- Drag a task to the 'no project' section to remove it from a project.
            </Text>
            <DraggableFlatList
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                onDragEnd={onDragEnd}
                activationDistance={5}
                containerStyle={{ paddingBottom: 100 }}
                scrollEnabled
            />
            
        </View>
    );
};

const styles = StyleSheet.create({
    projectHeader: {
        padding: 8,
        backgroundColor: '#ddd',
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    projectHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    priorityHeader: {
        padding: 8,
        backgroundColor: '#bbb',
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#28a745',
    },
    priorityHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    noTasksText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#999',
    },
    instructionsText: {
        textAlign: 'center',
        margin: 10,
        fontSize: 14,
        color: '#666',
    },
    editProjectName: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    projectInput: {
        width: 200,
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 5,
        marginRight: 10,
    },
    iconButton: {
        marginLeft: 10,
        padding: 5,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 8,
        marginRight: 10,
    },
    cancelButton: {
        backgroundColor: '#F44336',
        padding: 8,
    },
});

export default ListView;

