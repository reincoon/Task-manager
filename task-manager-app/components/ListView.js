import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import TodoCard from "./TodoCard";
import { groupTasksByProject, buildListData } from '../helpers/projects';
import { PRIORITIES } from "../helpers/priority";

const ListView = ({
    userId,
    tasks,
    projects,
    sortOption,
    setSortOption,
    navigation,
    updateTasksProject,
    reorderTasksWithinProject,
    deleteTask,
}) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const { noProject, byProject } = groupTasksByProject(tasks, projects);
        const newData = buildListData(noProject, byProject, projects, sortOption);
        setData(newData);
    }, [tasks, projects, sortOption]);

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
                    onLongPress={drag}
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
            // Determine the project based on the new position
            let finalProjectId = null;
            for (let i = to; i >= 0; i--) {
                if (newData[i].type === 'projectHeader') {
                    finalProjectId = newData[i].pName;
                    break;
                }
                if (newData[i].type === 'noProjectHeader') {
                    finalProjectId = null;
                    break;
                }
            }

            if (draggedItem.type === 'task') {
                const originalProjectId = draggedItem.projectId || null;

                if (finalProjectId !== originalProjectId) {
                    // Moving to a different project or unassigned
                    await updateTasksProject([draggedItem], finalProjectId);
                    Alert.alert(
                        'Success',
                        `Task moved to ${
                            finalProjectId ? 'the selected project' : 'Unassigned Projects list'
                        }.`
                    );
                } else {
                    // Reordering within the same project or unassigned
                    const tasksInSameProject = newData.filter(
                        (item) => item.type === 'task' && item.projectId === originalProjectId
                    );
                    // await reorderTasksWithinProject(tasksInSameProject, originalProjectId);
                    await reorderTasksWithinProject(originalProjectId, tasksInSameProject);
                    Alert.alert('Success', 'Tasks reordered successfully.');
                }

                // After manual reordering, reset sortOption to respect custom order
                setSortOption(null);
            }
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
                activationDistance={20}
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

