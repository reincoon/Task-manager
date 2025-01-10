import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import { PRIORITIES } from '../helpers/priority';
import { Ionicons } from '@expo/vector-icons';
import MoveToModal from '../components/MoveToModal';
import ProjectModal from '../components/ProjectModal';
import { groupTasksByProject } from '../helpers/projects';
import { updateTasksProject, assignTasksToProject, unassignTasksFromProject, createProject  } from '../helpers/firestoreHelpers';
import AddProjectButton from './AddProjectButton';
import { deleteTask } from '../helpers/taskActions';

const { width } = Dimensions.get('window');

// Helper function to check if a task is due within the next 48 hours
const isDueSoon = (dueDate) => {
    const now = Date.now();
    const dueTime = new Date(dueDate).getTime();
    return dueTime > now && dueTime - now <= 48 * 60 * 60 * 1000;
};

const COLUMN_WIDTH = 250;
const COLUMN_MARGIN = 10;

const KanbanBoard = ({ userId, rawTasks, projects, navigation, grouping }) => {
    const [columns, setColumns] = useState([]);
    // State to manage loading indicator
    const [isLoading, setIsLoading] = useState(true);
    // States for dragging functionality
    const [draggingItem, setDraggingItem] = useState(null);
    const [sourceColumnKey, setSourceColumnKey] = useState(null);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
    // State to manage 'Due Soon' filters per column
    const [dueSoonFilters, setDueSoonFilters] = useState({});
    // Project creation modal
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [projectModalTasks, setProjectModalTasks] = useState([]);
    

    // Initialize columns based on grouping
    useEffect(() => {
        const initializeColumns = () => {
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
                // if (noProject.length > 0) {
                    updatedColumns.push({
                        key: 'No Project',
                        title: `Unassigned (${noProject.length})`,
                        data: noProject,
                    });
                // }
                for (let pName in byProject) {
                    let tasksForProject = byProject[pName];

                    if (dueSoonFilters[pName]) {
                        tasksForProject = tasksForProject.filter(task => isDueSoon(task.dueDate));
                    }

                    // Find project name
                    const theProject = projects.find(p => p.id === pName);
                    const titleName = theProject ? theProject.name : `Project ${pName}`;

                    updatedColumns.push({
                        key: pName,
                        title: `${titleName} (${tasksForProject.length})`,
                        data: tasksForProject,
                    });
                }
            }
            setColumns(updatedColumns);
            setIsLoading(false);
        };

        initializeColumns();
    }, [rawTasks, grouping, projects, dueSoonFilters]);

    // Initialize 'dueSoonFilters' based on grouping and columns
    useEffect(() => {
        const initializeDueSoonFilters = () => {
            let initialFilters = {};
            if (grouping === 'priority') {
                PRIORITIES.forEach(priority => {
                    initialFilters[priority] = false;
                });
            } else if (grouping === 'project') {
                // Collect all project names
                const { noProject, byProject } = groupTasksByProject(rawTasks, projects);
                if (noProject.length > 0) {
                    initialFilters['No Project'] = false;
                }
                for (let pName in byProject) {
                    initialFilters[pName] = false;
                }
            }
            setDueSoonFilters(initialFilters);
        };

        initializeDueSoonFilters();
    }, [grouping, rawTasks, projects]);


    // Handle 'add' project action from Kanban view
    const handleAddProject = () => {
        setIsProjectModalVisible(true);
    };

    const handleDragEnd = useCallback((columnKey, newData) => {
        setColumns(prevColumns => {
            return prevColumns.map(column => {
                if (column.key === columnKey) {
                    return { ...column, data: newData };
                }
                return column;
            });
        });
    }, []);

    const handleMovePress = () => {
        if (draggingItem && sourceColumnKey) {
            setIsMoveModalVisible(true);
        }
    };

    // Handle moving a task via modal
    const handleMove = useCallback((targetProjectId) => {
        setIsMoveModalVisible(false);
        if (!draggingItem || !sourceColumnKey) return;
        try {
            if (grouping === 'priority') {
                // Update the task's priority in Firestore
                const taskRef = doc(db, `tasks/${userId}/taskList`, draggingItem.id);
                updateDoc(taskRef, { priority: targetProjectId });

                Alert.alert('Success', `Task moved to ${targetProjectId} priority.`);
            } else {
                if (targetProjectId) {
                    const targetProject = projects.find(p => p.id === targetProjectId);
                    assignTasksToProject(userId, [draggingItem], targetProjectId);
                    Alert.alert('Success', `Task moved to ${targetProject ? targetProject.name : '??'}.`);
                } else {
                    unassignTasksFromProject(userId, [draggingItem]);
                    Alert.alert('Success', `Task unassigned from project.`);
                }
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task.');
        }
    
        // Clear
        setDraggingItem(null);
        setSourceColumnKey(null);
    }, [draggingItem, sourceColumnKey, grouping, projects, userId]);

    const handleCancelMove = () => {
        setIsMoveModalVisible(false);
        setDraggingItem(null);
        setSourceColumnKey(null);
    };


    // Toggle 'Due Soon' filter for a specific column
    const toggleDueSoonFilter = (columnKey) => {
        setDueSoonFilters((prev) => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    // Function to handle adding a new project from Kanban view
    const handleCreateProject = async (projectName) => {
        if (!userId) {
            Alert.alert('Error', 'User not signed in.');
            setIsProjectModalVisible(false);
            return;
        }

        try {
            // Create a new project in Firebase
            const projectId = await createProject(userId, projectName);

            if (projectModalTasks && projectModalTasks.length === 2) {
                // Assign selected tasks to the new project
                await assignTasksToProject(userId, projectModalTasks, projectId);
                Alert.alert('Project Created', `Project "${projectName}" created with two tasks.`);
            } else {
                // Create an empty project
                Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);
            }

            // Reset states
            // setIsProjectModalVisible(false);
            // setDraggingItem(null);
            // setSourceColumnKey(null);
            // setProjectModalTasks([]);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.message);
            // Revert data
            // setIsProjectModalVisible(false);
        }
        setIsProjectModalVisible(false);
        setDraggingItem(null);
        setSourceColumnKey(null);
        setProjectModalTasks([]);
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

    const renderTask = useCallback(({ item, drag, isActive }) => {
        return (
            <View style={[styles.taskItem, isActive && { opacity: 0.7 }]}>
                <View style={styles.cardHeaderRow}>
                    {/* <Text style={styles.taskTitle} numberOfLines={1}>
                        {item.title}
                    </Text> */}
                    <TouchableOpacity
                        onLongPress={() => {
                            setDraggingItem(item);
                            // Find the source column
                            // const sourceColumn = columns.find(col => col.data.some(task => task.id === item.id));
                            const sourceColumn = grouping === 'priority' 
                                ? PRIORITIES.find(col => col === item.priority)
                                : projects.find(p => p.id === item.projectId);
                            setSourceColumnKey(sourceColumn ? sourceColumn.key : null);
                            drag();
                            setTimeout(() => {
                                // handleMovePress();
                            }, 200);
                        }}
                        onPress={() => {navigation.navigate('TaskDetailsScreen', { taskId: item.id });}}
                    >
                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
                        <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
                    </TouchableOpacity>
                    {/* Icon that opens MoveToModal */}
                    <TouchableOpacity
                        style={styles.moveIconContainer}
                        onPress={() => {
                            // open move modal
                            setDraggingItem(item);
                            if (grouping === 'priority') {
                            setSourceColumnKey(item.priority);
                            } else {
                            setSourceColumnKey(item.projectId || 'No Project');
                            }
                            setIsMoveModalVisible(true);
                        }}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
                <View style={styles.cardBodyRow}>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert('Delete Task', 'Are you sure?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            await deleteTask(userId, item, navigation);
                                            Alert.alert('Deleted', 'Task deleted successfully');
                                        } catch (err) {
                                            console.error('Error deleting task:', err);
                                            Alert.alert('Error', 'Could not delete task');
                                        }
                                    },
                                },
                            ]);
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color="#ff0000" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [grouping, projects, navigation]);


    const renderColumn = (column) => (
        <View key={column.key} style={styles.column}>
            <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>{column.title}</Text>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: dueSoonFilters[column.key] ? '#28a745' : '#007bff' },
                    ]}
                    onPress={() => toggleDueSoonFilter(column.key)}
                >
                    <Text style={styles.filterButtonText}>
                        {dueSoonFilters[column.key] ? 'Show All' : 'Due Soon'}
                    </Text>
                </TouchableOpacity>
            </View>
            <DraggableFlatList
                data={column.data}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
                onDragEnd={({ data }) => handleDragEnd(column.key, data)}
                activationDistance={20}
                contentContainerStyle={styles.tasksContainer}
            />
        </View>
    );

    return (
        // <DraxProvider>
            // <View style={styles.container}>
            <View style={styles.container}>
                {/* Kanban Header */}
                <View style={styles.kanbanHeader}>
                    <Text style={styles.kanbanTitle}>Kanban Board</Text>
                    <AddProjectButton
                        onPress={handleAddProject}
                        label="Add Project"
                    />
                    {/* <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={styles.toggleButton} onPress={() => setGrouping(prev => prev === 'priority' ? 'project' : 'priority')}>
                            <Text style={styles.toggleButtonText}>
                                {grouping === 'priority' ? 'Group by Project' : 'Group by Priority'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addProjectButton} onPress={handleAddProject}>
                            <Ionicons name="add-circle" size={30} color="#007bff" />
                        </TouchableOpacity>
                    </View> */}
                </View>
                <ScrollView horizontal contentContainerStyle={styles.columnsContainer}>
                    {columns.map(column => renderColumn(column))}
                </ScrollView>
                <MoveToModal
                    visible={isMoveModalVisible}
                    onClose={handleCancelMove}
                    onMove={handleMove}
                    // columns={columns}
                    // currentColumnKey={sourceColumnKey}
                    // columns={grouping === 'project' ? projects : PRIORITIES.map(p => ({ id: p, name: p }))}
                    columns={
                        grouping === 'project'
                            ? projects.map(p => ({key: p.id, title: p.name}))
                            : PRIORITIES.map(pr => ({key: pr, title: pr}))
                    }
                    currentColumnKey={grouping === 'project' ? draggingItem?.projectId || 'No Project' : draggingItem?.priority}
                />
                <ProjectModal
                visible={isProjectModalVisible}
                onCancel={() => {
                    setIsProjectModalVisible(false); 
                    setProjectModalTasks([]);
                }}
                onCreate={handleCreateProject}
                selectedTasks={projectModalTasks}
            />
            </View>
        // </DraxProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: COLUMN_MARGIN,
        backgroundColor: '#f5f5f5',
    },
    columnsContainer: {
        // flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    column: {
        width: COLUMN_WIDTH,
        marginRight: COLUMN_MARGIN,
        backgroundColor: '#eee',
        borderRadius: 10,
        padding: 10,
    },
    columnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    columnTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    filterButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    filterButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    moveIconContainer: {
        marginLeft: 10,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    tasksContainer: {
        paddingBottom: 100,
    },
    taskItem: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardBodyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'flex-end',
        marginTop: 6,
    },
    detailsLeftSide: {
        flex: 1,
        paddingRight: 8,
    },
    deleteIconContainer: {
        paddingHorizontal: 8,
        alignSelf: 'flex-end',
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flexShrink: 1,
    },
    taskDetails: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
    },
    menuIconContainer: {
        padding: 5,
    },
    kanbanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    kanbanTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    addProjectButton: {
        padding: 5,
    },
    toggleButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginRight: 10,
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default KanbanBoard;