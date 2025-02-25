import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import TodoCard from "./TodoCard";
import { groupTasksByProject, buildListData, groupTasksByPriority, buildListDataByPriority } from '../helpers/projects';
import { PRIORITIES } from "../helpers/priority";
import { updateTasksPriority, updateTasksProject, reorderTasksWithinProject, reorderTasks, updateProjectName, deleteProject } from "../helpers/firestoreHelpers";
import { Ionicons } from '@expo/vector-icons';
import ProjectNameEditModal from "./ProjectNameEditModal";
import useProjectNameEdit from "../hooks/useProjectNameEdit";

const ListView = ({
    userId,
    tasks,
    projects,
    sortOption,
    setSortOption,
    navigation,
    deleteTask,
    setDraggingTask,
    setHoveredTask,
    grouping,
}) => {
    const [data, setData] = useState([]);

    // Hook for handling project name updates
    const {
        isEditModalVisible,
        editingProjId,
        newProjectName,
        setNewProjectName,
        openEditProjectModal,
        handleEditProject,
        setIsEditModalVisible,
        setEditingProjId,
    } = useProjectNameEdit(userId);

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

    const renderItem = useCallback(({ item, drag, isActive }) => {
        if (item.type === 'projectHeader') {
            return (
                <View style={styles.projectHeader}>
                    <Text style={[styles.projectHeaderText, { color: '#333' }]}>
                        {item.projectName}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            openEditProjectModal(item.pName, item.projectName);
                        }}
                    >
                        <Text>Edit</Text>
                    </TouchableOpacity>
                    {/* Delete Button */}
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert('Confirm', 'Are you sure you want to delete this project?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            await deleteProject(userId, item.pName); // Delete the project and its tasks
                                            Alert.alert('Deleted', 'Project and associated tasks deleted.');
                                        } catch (error) {
                                            console.error('Error deleting project:', error);
                                            Alert.alert('Error', 'Could not delete project.');
                                        }
                                    }
                                }
                            ]);
                        }}
                    >
                        <Ionicons name="trash-outline" size={24} color="red" />
                    </TouchableOpacity>
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
                                        // Alert.alert('Deleted', 'Task deleted successfully');
                                    } catch (err) {
                                        console.error('Error deleting task:', err);
                                        Alert.alert('Error', 'Could not delete task');
                                    }
                                },
                            },
                        ]);
                    }}
                    showMoveButton={false}
                    userId={userId}
                />
            );
        }

        return null;
    }, [grouping, projects, navigation, setDraggingTask, deleteTask, openEditProjectModal]);

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
            finalProjectId = checkItem.pName; // stored in .pName by buildListData
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
                        (item) => item.type === 'task' && (item.priority || 'Low') === originalPriority
                    );
                    await reorderTasks(userId, tasksInSamePriority, null, originalPriority);
                    Alert.alert('Success', 'Tasks reordered within same priority.');
                }
            }
        
        } catch (error) {
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
                {'\n'}- Drag a to-do list under a project header or on a task in that project to move it into the project.
                {'\n'}- Drag a task to the 'Unassigned to-do lists' section to remove it from a project.
            </Text>
            <DraggableFlatList
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                onDragEnd={onDragEnd}
                activationDistance={5}
                containerStyle={{ paddingBottom: 100 }}
            />
            <ProjectNameEditModal
                visible={isEditModalVisible}
                onClose={() => {
                    setIsEditModalVisible(false);
                    setEditingProjId(null);
                    setNewProjectName('');
                }}
                onSave={handleEditProject}
                projectName={newProjectName}
                projectId={editingProjId}
                onChangeProjectName={setNewProjectName}
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

