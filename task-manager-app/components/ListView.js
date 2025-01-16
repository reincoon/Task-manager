import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import TodoCard from "./TodoCard";
import { groupTasksByProject, buildListData, groupTasksByPriority, buildListDataByPriority } from '../helpers/projects';
import { PRIORITIES } from "../helpers/priority";
import { updateTasksPriority, updateTasksProject, reorderTasksWithinProject } from "../helpers/firestoreHelpers";

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
}) => {
    const [data, setData] = useState([]);

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

    const renderItem = ({ item, drag, isActive }) => {
        if (item.type === 'projectHeader') {
            return (
                <View style={styles.projectHeader}>
                    <Text style={[styles.projectHeaderText, { color: '#333' }]}>
                        {item.projectName}
                    </Text>
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
                        drag();
                        setDraggingTask(item);
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
    };

    const keyExtractor = (item, index) => {
        if (item.type === 'projectHeader') {
            return `projectHeader-${item.projectName}-${index}`;
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
        const oldData = data;
        // setOriginalData(oldData);

        try {
            if (draggedItem.type === 'task') {
                const originalProjectId = draggedItem.projectId || null;
                const originalPriority = draggedItem.priority || 'Low';

                // Determine the project based on the new position
                let finalProjectId = null;
                let finalPriority = null;
                for (let i = to; i >= 0; i--) {
                    if (newData[i].type === 'projectHeader') {
                        // finalProjectId = newData[i].projectId ||newData[i].pName;
                        finalProjectId = newData[i].pName; 
                        break;
                    }
                    if (newData[i].type === 'priorityHeader') {
                        finalPriority = newData[i].priority;
                        break;
                    }
                    if (newData[i].type === 'noProjectHeader') {
                        finalProjectId = null;
                        break;
                    }
                }

                // if (finalProjectId !== originalProjectId) {
                //     // Moving to a different project or unassigned
                //     await updateTasksProject([draggedItem], finalProjectId);
                //     Alert.alert(
                //         'Success',
                //         `Task moved to ${
                //             finalProjectId ? 'the selected project' : 'Unassigned Projects list'
                //         }.`
                //     );
                // } else {
                //     // Reordering within the same project or unassigned
                //     const tasksInSameProject = newData.filter(
                //         (item) => item.type === 'task' && item.projectId === originalProjectId
                //     );
                //     // await reorderTasksWithinProject(tasksInSameProject, originalProjectId);
                //     await reorderTasksWithinProject(originalProjectId, tasksInSameProject);
                //     Alert.alert('Success', 'Tasks reordered successfully.');
                // }

                console.log('Grouping:', grouping);
                console.log('Final Project ID:', finalProjectId);
                console.log('Final Priority:', finalPriority);
                console.log('Original Project ID:', originalProjectId);


                // // Check if the dragged task is adjacent to another unassigned task
                // const draggedIndex = newData.findIndex(item => item.id === draggedItem.id);
                // let adjacentTask = null;

                // // Check above
                // for (let i = draggedIndex -1; i >=0; i--) {
                //     if (newData[i].type === 'task') {
                //         adjacentTask = newData[i];
                //         break;
                //     }
                // }

                // // Check below if no adjacentTask above
                // if (!adjacentTask) {
                //     for (let i = draggedIndex +1; i < newData.length; i++) {
                //         if (newData[i].type === 'task') {
                //             adjacentTask = newData[i];
                //             break;
                //         }
                //     }
                // }

                // // // Determine if the move is a reorder within the same project
                // // const isReorder = finalProjectId === originalProjectId;
                // // Determine if the move is a reorder within the same project or priority
                // let isReorder = false;
                // if (grouping === 'project') {
                //     isReorder = finalProjectId === originalProjectId;
                // } else if (grouping === 'priority') {
                //     isReorder = finalPriority === originalPriority;
                // }

                // // If both todo lists are unassigned and overlap, trigger a modal
                // if (grouping === 'project') {
                //     const bothUnassigned = !originalProjectId && !finalProjectId;
                //     if (bothUnassigned && adjacentTask && !adjacentTask.projectId) {
                //         // Do not reorder and trigger project creation
                //         isReorder = false;
                //         console.log('Detected drag over another unassigned task. Triggering project creation...');
                        
                //         // Set the todo lists that will be assigned to a new project
                //         setDraggingTask(draggedItem);
                //         setHoveredTask(adjacentTask);
                //         return;
                //     }
                // }

                // // Only trigger ProjectModal if both tasks are unassigned and it's not a reorder
                // if (!isReorder && finalProjectId === null && !originalProjectId) {
                //     if (adjacentTask && !adjacentTask.projectId && !draggedItem.projectId) {
                //         // Both tasks are unassigned, trigger project creation
                //         setDraggingTask(draggedItem);
                //         setHoveredTask(adjacentTask);
                //         return;
                //     }
                // }

                // Check adjacency for unassigned overlap
                if (grouping === 'project') {
                    const bothUnassigned = !originalProjectId && !finalProjectId;
                    // Check if a todo list was hovered over another unassigned
                    const draggedIndex = newData.findIndex((it) => it.id === draggedItem.id);
                    let adjacentTask = null;

                    // Check above
                    for (let i = draggedIndex - 1; i >= 0; i--) {
                        if (newData[i].type === 'task') {
                            adjacentTask = newData[i];
                            break;
                        }
                    }
                    // Check below if no adjacency above
                    if (!adjacentTask) {
                        for (let i = draggedIndex + 1; i < newData.length; i++) {
                            if (newData[i].type === 'task') {
                                adjacentTask = newData[i];
                                break;
                            }
                        }
                    }

                    if (bothUnassigned && adjacentTask && !adjacentTask.projectId) {
                        // If overlapped two unassigned tasks, create project modal
                        console.log('Detected unassigned overlap, trigger project creation');
                        setDraggingTask(draggedItem);
                        setHoveredTask(adjacentTask);
                        return;
                    }
                }

                // Perform normal drag-and-drop behaviour
                // if (finalProjectId !== originalProjectId) {
                //     // Moving to a different project or unassigned
                //     await updateTasksProject(userId, [draggedItem], finalProjectId);
                //     Alert.alert(
                //         'Success',
                //         `Task moved to ${
                //             finalProjectId ? 'the selected project' : 'Unassigned Projects list'
                //         }.`
                //     );
                // } else {
                //     // Reordering within the same project or unassigned
                //     const tasksInSameProject = newData.filter(
                //         (item) => item.type === 'task' && item.projectId === originalProjectId
                //     );
                //     await reorderTasksWithinProject(userId, tasksInSameProject, originalProjectId);
                //     Alert.alert('Success', 'Tasks reordered successfully.');
                // }

                // Perform normal drag-and-drop behaviour
                // Now do normal handling
                if (grouping === 'project') {
                    // Move or reorder by project
                    if (finalProjectId !== originalProjectId) {
                        // Different project
                        await updateTasksProject(userId, [draggedItem], finalProjectId);
                        Alert.alert(
                            'Success',
                            finalProjectId
                                ? 'Task moved to that project.'
                                : 'Task is now unassigned.'
                        );
                    } else {
                        // Reorder within same project/unassigned
                        const tasksInSameProject = newData.filter(
                            (it) => it.type === 'task' && it.projectId === originalProjectId
                        );
                        await reorderTasksWithinProject(userId, tasksInSameProject, originalProjectId);
                        Alert.alert('Success', 'Tasks reordered successfully.');
                    }
                } else if (grouping === 'priority') {
                    // Move or reorder by priority
                    if (finalPriority && finalPriority !== originalPriority) {
                        // Updating to a new priority
                        await updateTasksPriority(userId, [draggedItem], finalPriority);
                        Alert.alert('Success', `Task priority set to ${finalPriority}.`);
                    } else {
                        // reorder within same priority
                        const tasksInSamePriority = newData.filter(
                            (it) => it.type === 'task' && it.priority === originalPriority
                        );
                        // Reorder in Firestore
                        await reorderTasksWithinProject(userId, tasksInSamePriority, null);
                        Alert.alert('Success', 'Tasks reordered successfully (same priority).');
                    }
                }

                // After success, revert to custom order
                setSortOption(null);
            }
            //     if (grouping === 'project' && finalProjectId !== originalProjectId) {
            //         // Moving to a different project or unassigned
            //         await updateTasksProject(userId, [draggedItem], finalProjectId);
            //         Alert.alert(
            //             'Success',
            //             `Task moved to ${
            //                 finalProjectId ? 'the selected project' : 'Unassigned Projects list'
            //             }.`
            //         );
            //     } else if (grouping === 'priority' && finalPriority !== originalPriority) {
            //         // Move to a different priority
            //         // await updateTasksWithinPriority(userId, [draggedItem], finalPriority);
            //         await reorderTasksWithinProject(userId, [draggedItem], originalPriority);
            //         Alert.alert('Success', `Task priority set to ${finalPriority}.`);
            //     } else {
            //         // Reordering within the same project or priority or unassigned
            //         if (grouping === 'project') {
            //             const tasksInSameProject = newData.filter(
            //                 (item) => item.type === 'task' && item.projectId === originalProjectId
            //             );
            //             // await reorderTasksWithinProject(tasksInSameProject, originalProjectId);
            //             await reorderTasksWithinProject(userId, tasksInSameProject, originalProjectId);
            //             Alert.alert('Success', 'Tasks reordered successfully.');
            //         } else if (grouping === 'priority') {
            //             const tasksInSamePriority = newData.filter(
            //                 (item) => item.type === 'task' && item.priority === originalPriority
            //             );
            //             // await reorderTasksWithinProject(userId, tasksInSamePriority, null);
            //             await reorderTasksWithinProject(userId, tasksInSamePriority, null);
            //             Alert.alert('Success', 'Tasks reordered successfully.');
            //         }
            //     }


            //     // After manual reordering, reset sortOption to respect custom order
            //     setSortOption(null);
                
            // }


            //     // After manual reordering, reset sortOption to respect custom order
            //     setSortOption(null);
            // }
        } catch (error) {
            console.error('Error in onDragEnd:', error);
            Alert.alert('Error', 'Failed to update tasks after drag-and-drop.');
            setData(oldData); // Revert UI on failure
            return;
        }
        // If reorderinhg within the same section with no project change, store new order
        setData(newData);
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
                - Long press and drag one unassigned to-do list over another unassigned to create a project.
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
});

export default ListView;

