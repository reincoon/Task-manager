import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, TextInput, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { PRIORITIES } from '../helpers/priority';
import MoveToModal from '../components/MoveToModal';
// import ProjectModal from '../components/ProjectModal';
import { groupTasksByProject } from '../helpers/projects';
import { updateTasksProject, createProject, updateTasksPriority, deleteProject, updateProjectName, reorderTasks  } from '../helpers/firestoreHelpers';
// import AddProjectButton from './AddProjectButton';
import { deleteTask } from '../helpers/taskActions';
import TodoCard from '../components/TodoCard';
import ProjectNameEditModal from './ProjectNameEditModal';
import useProjectNameEdit from '../hooks/useProjectNameEdit';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from '../components/ThemedText';
import tw, { theme } from '../twrnc';
import { PRIORITY_COLOURS } from '../helpers/constants';

// Helper function to check if a task is due within the next 48 hours
const isDueSoon = (dueDate) => {
    const now = Date.now();
    const dueTime = new Date(dueDate).getTime();
    return dueTime > now && dueTime - now <= 48 * 60 * 60 * 1000;
};

const COLUMN_WIDTH = 270;
const COLUMN_MARGIN = 12;

const KanbanBoard = ({ userId, rawTasks, projects, navigation, grouping, setDraggingTask, setHoveredTask }) => {
    const [columns, setColumns] = useState([]);
    // States for dragging functionality
    const [draggingItem, setDraggingItem] = useState(null);
    const [sourceColumnKey, setSourceColumnKey] = useState(null);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
    // State to manage 'Due Soon' filters per column
    const [dueSoonFilters, setDueSoonFilters] = useState({});
    // Project creation modal
    // const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    // const [projectModalTasks, setProjectModalTasks] = useState([]);

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

    // Initialise columns based on grouping
    useEffect(() => {
        const initialiseColumns = () => {
            let updatedColumns = [];
            if (grouping === 'priority') {
                updatedColumns = PRIORITIES.map((priority) => {
                    let tasksForColumn = rawTasks.filter((task) => task.priority === priority);

                    // Apply 'Due Soon' filter if active
                    if (dueSoonFilters[priority]) {
                        tasksForColumn = tasksForColumn.filter((task) => isDueSoon(task.dueDate));
                    }

                    return {
                        key: priority,
                        title: `${priority} Priority (${tasksForColumn.length})`, // Include task count
                        data: tasksForColumn,
                    };
                });
            } else if (grouping === 'project') {
                // Group tasks by project
                const { noProject, byProject } = groupTasksByProject(rawTasks, projects);

                const filteredNoProject = dueSoonFilters['No Project']
                    ? noProject.filter((task) => isDueSoon(task.dueDate))
                    : noProject;

                updatedColumns.push({
                    key: 'No Project',
                    title: `Unassigned (${filteredNoProject.length})`,
                    data: filteredNoProject,
                });

                for (let pId in byProject) {
                    let tasksForProject = byProject[pId];

                    if (dueSoonFilters[pId]) {
                        tasksForProject = tasksForProject.filter(task => isDueSoon(task.dueDate));
                    }

                    // Find project name
                    const theProject = projects.find(p => p.id === pId);
                    const titleName = theProject ? theProject.name : `Project ${pId}`;

                    updatedColumns.push({
                        key: pId,
                        title: `${titleName} (${tasksForProject.length})`,
                        data: tasksForProject,
                    });
                }
            }
            setColumns(updatedColumns);
        };

        initialiseColumns();
    }, [rawTasks, grouping, projects, dueSoonFilters]);

    // Initialise 'dueSoonFilters' based on grouping and columns
    useEffect(() => {
        const initialiseDueSoonFilters = () => {
            let initialFilters = {};
            if (grouping === 'priority') {
                PRIORITIES.forEach(priority => {
                    initialFilters[priority] = false;
                });
            } else if (grouping === 'project') {
                // Collect all project names
                const { noProject, byProject } = groupTasksByProject(rawTasks, projects);
                initialFilters['No Project'] = false;
                for (let pId in byProject) {
                    initialFilters[pId] = false;
                }
            }
            setDueSoonFilters(initialFilters);
        };

        initialiseDueSoonFilters();
    }, [grouping, rawTasks, projects]);

    // Handle 'add' project action from Kanban view
    // const handleAddProject = () => {
    //     setIsProjectModalVisible(true);
    // };

    const handleDragEnd = useCallback(async (columnKey, newData) => {
        setColumns(prevColumns => {
            return prevColumns.map(column => {
                if (column.key === columnKey) {
                    return { ...column, data: newData };
                }
                return column;
            });
        });

        let tasksInColumn = [];
        if (grouping === 'project') {
            tasksInColumn = newData.filter(
                (t) => t.projectId === columnKey || (columnKey === 'No Project' && !t.projectId)
            );
        } else {
            tasksInColumn = newData.filter((t) => t.priority === columnKey);
        }

        try {
            if (grouping === 'project') {
                await updateTasksProject(userId, tasksInColumn, columnKey === 'No Project' ? null : columnKey);
                Alert.alert('Success', `Tasks reordered in project ${getProjectName(columnKey)}.`);
            } else if (grouping === 'priority') {
                await updateTasksPriority(userId, tasksInColumn, columnKey);
                Alert.alert('Success', `Tasks reordered in ${columnKey} priority.`);
            }
        } catch (error) {
            console.error('Error reordering on Kanban Board:', error);
            Alert.alert('Error', 'Failed to reorder tasks.');
        } finally {
            // Reset dragging state
            setDraggingItem(null);
            setSourceColumnKey(null);
        }
    }, [grouping, userId]);

    // Handle moving a task via modal
    const handleMove = useCallback(async (targetKey) => {
        setIsMoveModalVisible(false);
        if (!draggingItem || !sourceColumnKey) return;
        try {
            if (grouping === 'project') {
                await updateTasksProject(
                    userId,
                    [draggingItem],
                    targetKey === 'No Project' ? null : targetKey
                );
                Alert.alert('Success', 'Task updated in project view.');
            } else if (grouping === 'priority') {
                // Assign to new priority
                await updateTasksPriority(userId, [draggingItem], targetKey);
                Alert.alert('Success', `Task priority set to "${targetKey}".`);
            
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task.');
        } finally {
            // Reset states
            setDraggingTask(null);
            setHoveredTask(null);
            setSourceColumnKey(null);
        }
    }, [draggingItem, sourceColumnKey, grouping, userId]);

    const handleCancelMove = () => {
        setIsMoveModalVisible(false);
        setDraggingItem(null);
        setHoveredTask(null);
        setSourceColumnKey(null);
    };

    // Toggle 'Due Soon' filter for a specific column
    const toggleDueSoonFilter = (columnKey) => {
        setDueSoonFilters((prev) => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    // // Function to handle adding a new project from Kanban view
    // const handleCreateProject = async (projectName) => {
    //     if (!userId) {
    //         Alert.alert('Error', 'User not signed in.');
    //         setIsProjectModalVisible(false);
    //         return;
    //     }

    //     try {
    //         // Create a new project in Firebase
    //         await createProject(userId, projectName);
    //         Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);
    //     } catch (err) {
    //         console.error(err);
    //         Alert.alert('Error', err.message);
    //     } finally {
    //         // Revert data
    //         setIsProjectModalVisible(false);
    //     }
    // };

    // A helper to find the project name
    const getProjectName = (projectId) => {
        if (!projectId) return 'Unassigned';
        const found = projects.find((p) => p.id === projectId);
        return found ? found.name : 'Unassigned';
    };

    const handleOpenMoveModal = useCallback((task) => {
        setDraggingItem(task);
        if (grouping === 'priority') {
            setSourceColumnKey(task.priority);
        } else {
            setSourceColumnKey(task.projectId || 'No Project');
        }
        setIsMoveModalVisible(true);
    }, [grouping]);

    const handleDeleteProject = async (projectId) => {
        Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    await deleteProject(userId, projectId, navigation);
                    Alert.alert('Success', 'Project and its tasks deleted');
                } catch (err) {
                    console.error('Error deleting project:', err);
                    Alert.alert('Error', 'Failed to delete project');
                }
            }},
        ]);
    };

    const renderTask = useCallback(({ item, drag, isActive }) => {
        const projectName = getProjectName(item.projectId);

        return (
            <TodoCard
                task={item}
                projectName={projectName}
                onLongPress={() => {
                    // setDraggingItem(item);
                    // setSourceColumnKey(
                    //     grouping === 'project'
                    //         ? item.projectId || 'No Project'
                    //         : item.priority
                    // );
                    requestAnimationFrame(() => {
                        setDraggingItem(item);
                        setSourceColumnKey(
                            grouping === 'project'
                                ? item.projectId || 'No Project'
                                : item.priority
                        );
                    });
                    drag();
                }}
                onPress={() => {
                    // Navigate to details
                    navigation.navigate('TaskDetailsScreen', { taskId: item.id });
                }}
                onDeleteTask={() => {
                    Alert.alert('Delete Task', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                                try {
                                    await deleteTask(userId, item, navigation, false);
                                } catch (err) {
                                    Alert.alert('Error', 'Could not delete task');
                                }
                            },
                        },
                    ]);
                }}
                showMoveButton={true}
                onMoveTask={() => {
                    handleOpenMoveModal(item);
                    setDraggingTask(item);
                    setHoveredTask(item);
                    setIsMoveModalVisible(true);
                }}
                isActive={isActive}
                userId={userId}
            />
        );
    }, [grouping, userId, navigation, setHoveredTask]);

    const renderColumn = (column) => {
        const isProjectView = grouping === 'project';
        const project = projects.find(p => p.id === column.key);
        const projectColour = isProjectView 
            ? project?.color || theme.colors.sky 
            : PRIORITY_COLOURS[column.key] || theme.colors.sky;

        const headerBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.grayHd;

        return (
            <View 
                key={column.key} 
                style={[
                    tw`rounded-2xl p-3 mr-4`, 
                    { 
                        width: COLUMN_WIDTH, 
                        backgroundColor: isDarkMode ? theme.colors.textPrimary : theme.colors.columnBg,
                        flexGrow: 1,
                        minHeight: '100%',
                    }
                ]}
            >
                {/* Column Header */}
                <View 
                    style={[
                        tw`p-3 bg-${isDarkMode ? theme.colors.darkCardBg : theme.colors.grayHd} rounded-md`, 
                        { 
                            borderLeftWidth: 5, 
                            borderLeftColor: projectColour,
                            borderBottomColor: isDarkMode ? '#555' : '#DDD', 
                            backgroundColor: headerBg,
                        }
                    ]}
                >
                    <ThemedText variant="xl" fontFamily="poppins-bold">{column.title}</ThemedText>
                    
                    <View style={tw`mt-2 flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center`}>
                            {isProjectView && column.key !== 'No Project' && (
                                <>
                                    <TouchableOpacity
                                        onPress={() => openEditProjectModal(column.key, column.title)} // Open edit modal when clicked
                                        style={tw`mr-3`}
                                    >
                                        <Ionicons
                                            name="create-outline"
                                            size={theme.fontSize.xl3 * fontScale}
                                            color={isDarkMode ? theme.colors.darkForest : theme.colors.forest}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteProject(column.key)} // Delete project when clicked
                                        style={tw`mr-3`}
                                    >
                                        <Ionicons
                                            name="trash-sharp"
                                            size={theme.fontSize.xl3 * fontScale}
                                            color={isDarkMode ? theme.colors.darkCinnabar : theme.colors.cinnabar}
                                        />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[
                                tw`rounded px-3 py-1`,
                                { backgroundColor: dueSoonFilters[column.key] ? theme.colors.greenCyan : theme.colors.neon },
                            ]}
                            onPress={() => toggleDueSoonFilter(column.key)}
                        >
                            <ThemedText variant="sm" color={theme.colors.white}>
                                {dueSoonFilters[column.key] ? 'Show All' : 'Due Soon'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
                <DraggableFlatList
                    data={column.data}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTask}
                    onDragEnd={({ data }) => handleDragEnd(column.key, data)}
                    activationDistance={5}
                    contentContainerStyle={tw`py-3 pb-24`}
                    canDrag={({ item }) => !!item.id}
                />
            </View>
        )
    };

    return (
        <View style={tw`flex-1 bg-${isDarkMode ? theme.colors.darkBg : theme.colors.light}`}>
            {/* Kanban Header */}
            {/* <View style={styles.kanbanHeader}>
                <Text style={styles.kanbanTitle}>Kanban Board</Text> */}
                {/* <AddProjectButton
                    onPress={handleAddProject}
                    label="Add Project"
                /> */}
            {/* </View> */}
            <ScrollView 
                horizontal 
                contentContainerStyle={tw`py-2 px-3`}
                showsHorizontalScrollIndicator
                indicatorStyle={isDarkMode ? 'white' : 'black'}
            >
                {columns.map(column => renderColumn(column))}
            </ScrollView>
            <MoveToModal
                visible={isMoveModalVisible}
                onClose={handleCancelMove}
                onMove={handleMove}
                columns={
                    grouping === 'project'
                        ? [
                            { key: 'No Project', title: 'Unassigned' },
                            ...projects.map(p => ({ key: p.id, title: p.name }))
                        ]
                        : PRIORITIES.map(pr => ({ key: pr, title: pr }))
                }
                currentColumnKey={grouping === 'project' ? draggingItem?.projectId || 'No Project' : draggingItem?.priority}
                grouping={grouping}
                projects={projects}
            />
            {/* <ProjectModal
                visible={isProjectModalVisible}
                onCancel={() => {
                    setIsProjectModalVisible(false); 
                    setProjectModalTasks([]);
                }}
                onCreate={handleCreateProject}
            /> */}

            {isEditModalVisible && (
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
            )}
        </View>
    );
};

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: COLUMN_MARGIN,
//         backgroundColor: '#f5f5f5',
//     },
//     columnsContainer: {
//         flexGrow: 1,
//         alignItems: 'flex-start',
//         justifyContent: 'flex-start',
//     },
//     column: {
//         width: COLUMN_WIDTH,
//         marginRight: COLUMN_MARGIN,
//         backgroundColor: '#eee',
//         borderRadius: 10,
//         padding: 10,
//     },
//     columnHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 10,
//     },
//     columnTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginBottom: 10,
//         textAlign: 'center',
//         color: '#333',
//     },
//     filterButton: {
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 5,
//     },
//     filterButtonText: {
//         color: '#fff',
//         fontSize: 12,
//     },
//     moveIconContainer: {
//         marginLeft: 10,
//         paddingHorizontal: 5,
//         paddingVertical: 2,
//     },
//     tasksContainer: {
//         paddingBottom: 100,
//     },
//     taskItem: {
//         padding: 8,
//         backgroundColor: '#fff',
//         borderRadius: 8,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowOffset: { width: 0, height: 2 },
//         shadowRadius: 4,
//         elevation: 2,
//         marginBottom: 10,
//         borderWidth: 1,
//         borderColor: '#ddd',
//     },
//     cardHeaderRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     cardBodyRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignSelf: 'flex-end',
//         marginTop: 6,
//     },
//     detailsLeftSide: {
//         flex: 1,
//         paddingRight: 8,
//     },
//     deleteIconContainer: {
//         paddingHorizontal: 8,
//         alignSelf: 'flex-end',
//     },
//     taskTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#333',
//         flexShrink: 1,
//     },
//     taskDetails: {
//         fontSize: 12,
//         color: '#555',
//         marginTop: 4,
//     },
//     menuIconContainer: {
//         padding: 5,
//     },
//     kanbanHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 10,
//         paddingTop: 10,
//         marginBottom: 10,
//     },
//     kanbanTitle: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         color: '#333',
//     },
//     addProjectButton: {
//         padding: 5,
//     },
//     toggleButton: {
//         backgroundColor: '#28a745',
//         paddingHorizontal: 10,
//         paddingVertical: 5,
//         borderRadius: 5,
//         marginRight: 10,
//     },
//     toggleButtonText: {
//         color: '#fff',
//         fontSize: 12,
//         fontWeight: 'bold',
//     },
//     columnActions: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginTop: 10,
//     },
//     editButton: {
//         backgroundColor: '#4CAF50',
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 5,
//         marginRight: 10,
//     },
//     deleteButton: {
//         backgroundColor: '#f44336',
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 5,
//         marginRight: 10,
//     },
//     editButtonText: {
//         color: 'white',
//         fontSize: 14,
//     },
//     deleteButtonText: {
//         color: 'white',
//         fontSize: 14,
//     },
//     modalContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: 'rgba(0,0,0,0.5)',
//     },
//     modalContent: {
//         width: '80%',
//         backgroundColor: 'white',
//         padding: 20,
//         borderRadius: 10,
//     },
//     input: {
//         height: 40,
//         borderColor: 'gray',
//         borderWidth: 1,
//         marginBottom: 10,
//         paddingHorizontal: 10,
//         paddingVertical: 5,
//         borderRadius: 4,
//     },
// });

export default KanbanBoard;