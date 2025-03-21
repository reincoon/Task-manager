import { useAnimatedStyle } from 'react-native-reanimated';
import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import TodoCard from "./TodoCard";
import { groupTasksByProject, buildListData, groupTasksByPriority, buildListDataByPriority } from '../helpers/projects';
import { PRIORITIES } from "../helpers/priority";
import { updateTasksPriority, updateTasksProject, reorderTasks, updateProjectName, deleteProject } from "../helpers/firestoreHelpers";
import { Ionicons } from '@expo/vector-icons';
import ProjectNameEditModal from "./ProjectNameEditModal";
import useProjectNameEdit from "../hooks/useProjectNameEdit";
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';

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
    const { isDarkMode, fontScale } = useTheme();

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

    const renderItem = useCallback(({ item, drag }) => {
        if (item.type === 'projectHeader') {
            const project = projects.find(p => p.id === item.pName);
            const projectColour = project?.color || '#BBB';
            const animatedStyle = useAnimatedStyle(() => ({
                borderLeftColor: projectColour,
            }));

            return (
                <View 
                    style={[
                        tw`px-3 py-2 mx-4 mt-3 rounded-md`,
                        {
                            backgroundColor: isDarkMode ? theme.colors.textSecondary : '#BBB',
                            borderLeftWidth: 4,
                        },
                        animatedStyle
                    ]}
                >
                    <ThemedText variant="lg" style={tw`font-bold`}>
                        {item.projectName}
                    </ThemedText>
                    {/* Edit button */}
                    {/* <TouchableOpacity
                        onPress={() => {
                            openEditProjectModal(item.pName, item.projectName);
                        }}
                    >
                        <Text>Edit</Text>
                    </TouchableOpacity> */}
                    <Ionicons
                        name="create-outline"
                        size={theme.fontSize.xl}
                        style={tw`absolute right-10 top-2`}
                        color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary}
                        onPress={() => openEditProjectModal(item.pName, item.projectName)}
                    />
                    {/* Delete Button */}
                    <Ionicons
                        name="trash-outline"
                        size={theme.fontSize.xl}
                        style={tw`absolute right-2 top-2`}
                        color={tw`${isDarkMode ? theme.colors.cinnabar : theme.colors.darkCinnabar}`}
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
                    />
                </View>
            );
        }
        if (item.type === 'priorityHeader') {
            const priorityColors = {
                Low: theme.colors.forest,
                Moderate: theme.colors.gold,
                High: theme.colors.cinnabar,
                Critical: theme.colors.violet,
            };
            return (
                <View
                    style={[
                        tw`px-3 py-2 mx-4 mt-3 rounded-md`,
                        {
                            backgroundColor: isDarkMode ? theme.colors.textSecondary : '#BBB',
                            borderLeftWidth: 4,
                            borderLeftColor: priorityColors[item.priority] || theme.colors.forest,
                        },
                    ]}
                >
                    <ThemedText variant="lg" fontFamily="poppins-bold">
                        {item.priority} Priority
                    </ThemedText>
                </View>
            );
        }
        if (item.type === 'noProjectHeader') {
            return (
                <View 
                    style={[
                        tw`px-3 py-2 mx-4 mt-3 rounded-md`,
                        {
                            backgroundColor: isDarkMode ? theme.colors.textSecondary : '#BBB',
                            borderLeftWidth: 4,
                            borderLeftColor: isDarkMode ? theme.colors.darkSky : theme.colors.sky,
                        },
                    ]}
                >
                    <ThemedText variant="lg" style={tw`font-bold`}>
                        Unassigned To-Do Lists
                    </ThemedText>
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
    }, [grouping, projects, navigation, setDraggingTask, deleteTask, openEditProjectModal, isDarkMode]);

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
                        finalProjectId ? 'To-Do list moved to the selected project.' : 'To-Do list was unassigned.'
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
                    Alert.alert('Success', `To-Do list's priority is set to "${finalPriority}".`);
                } else {
                    // Reordering within the same priority
                    const tasksInSamePriority = newData.filter(
                        (item) => item.type === 'task' && (item.priority || 'Low') === originalPriority
                    );
                    await reorderTasks(userId, tasksInSamePriority, null, originalPriority);
                    Alert.alert('Success', 'To-Do lists were reordered within same priority.');
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
            <ThemedText variant="xl2" style={tw`text-center mt-5 text-gray-500`}>
                No tasks available. Create a new to-do list!
            </ThemedText>
        );
    }

    return (
        <View style={tw`flex-1`}>
            <ThemedText variant="sm" style={tw`text-center my-3 mx-2 text-gray-400`}>
                {'\n'}- Drag a to-do list under a project header or on a task in that project to move it into the project.
                {'\n'}- Drag a task to the 'Unassigned to-do lists' section to remove it from a project.
            </ThemedText>
            <DraggableFlatList
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                onDragEnd={onDragEnd}
                activationDistance={5}
                contentContainerStyle={tw`pb-24`}
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

