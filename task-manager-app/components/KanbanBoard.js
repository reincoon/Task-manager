import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
// import { NestableDraggableFlatList, ScaleDecorator, RenderItemParams, DraggableFlatList } from 'react-native-draggable-flatlist';
import DraggableFlatList from 'react-native-draggable-flatlist';
// import { DraxProvider, DraxView } from 'react-native-drax';
// import { Board, Column, } from 'react-native-dnd-board';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PRIORITIES } from '../helpers/priority';
import { Ionicons } from '@expo/vector-icons';
import MoveToModal from '../components/MoveToModal';
import ProjectModal from '../components/ProjectModal';
import { groupTasksByProject } from '../helpers/projects';
import { updateTasksProject } from '../helpers/firestoreHelpers';

const { width } = Dimensions.get('window');

// Helper function to check if a task is due within the next 48 hours
const isDueSoon = (dueDate) => {
    const now = Date.now();
    const dueTime = new Date(dueDate).getTime();
    return dueTime > now && dueTime - now <= 48 * 60 * 60 * 1000;
};

const COLUMN_WIDTH = 250;
const COLUMN_MARGIN = 10;

const KanbanBoard = ({ userId, rawTasks, navigation, grouping }) => {
    // const [columns, setColumns] = useState(() => {
    //     return PRIORITIES.map(priority => ({
    //         key: priority,
    //         title: `${priority} Priority`,
    //         data: rawTasks.filter(task => task.priority === priority),
    //     }));
    // });
    // State to manage columns based on grouping style
    // const [grouping, setGrouping] = useState('priority');
    const [columns, setColumns] = useState([]);
    // State to manage loading indicator
    const [isLoading, setIsLoading] = useState(true);
    // States for dragging functionality
    const [draggingItem, setDraggingItem] = useState(null);
    const [sourceColumnKey, setSourceColumnKey] = useState(null);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
     // State to manage 'Due Soon' filters per column
    // const [dueSoonFilters, setDueSoonFilters] = useState(() =>
    //     PRIORITIES.reduce((acc, p) => {
    //         acc[p] = false;
    //         return acc;
    //     }, {})
    // );
    const [dueSoonFilters, setDueSoonFilters] = useState({});
    // State to manage selected tasks for project creation
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [projectModalTasks, setProjectModalTasks] = useState([]);

    // useEffect(() => {
    //     // Initialize columns based on PRIORITIES
    //     const initializeColumns = () => {
    //         // const updatedColumns = PRIORITIES.map(priority => ({
    //         //     key: priority,
    //         //     title: `${priority} Priority`,
    //         //     data: rawTasks.filter(task => task.priority === priority),
    //         // }));
    //         const updatedColumns = PRIORITIES.map((priority) => {
    //             let tasksForColumn = rawTasks.filter((task) => task.priority === priority);

    //             // Apply 'Due Soon' filter if active
    //             if (dueSoonFilters[priority]) {
    //                 tasksForColumn = tasksForColumn.filter((task) => isDueSoon(task.dueDate));
    //             }

    //             return {
    //                 key: priority,
    //                 title: `${priority} Priority (${tasksForColumn.length})`, // Include task count
    //                 data: tasksForColumn,
    //             };
    //         });
    //         setColumns(updatedColumns);
    //         setIsLoading(false);
    //     };

    //     initializeColumns();
    // }, [rawTasks, dueSoonFilters]);
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
                const { noProject, byProject } = groupTasksByProject(rawTasks);
                if (noProject.length > 0) {
                    updatedColumns.push({
                        key: 'No Project',
                        title: `No Project (${noProject.length})`,
                        data: noProject,
                    });
                }
                for (let pName in byProject) {
                    let tasksForProject = byProject[pName];

                    if (dueSoonFilters[pName]) {
                        tasksForColumn = tasksForColumn.filter((task) => isDueSoon(task.dueDate));
                    }

                    updatedColumns.push({
                        key: pName,
                        title: `${pName} (${tasksForProject.length})`,
                        data: tasksForProject,
                    });
                }
            }
            setColumns(updatedColumns);
            setIsLoading(false);
        };

        initializeColumns();
    }, [rawTasks, grouping, dueSoonFilters]);

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
                const { noProject, byProject } = groupTasksByProject(rawTasks);
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
    }, [grouping, rawTasks]);


    // Handle 'add' project action from Kanban view
    const handleAddProject = () => {
        if (grouping === 'project') {
            if (selectedTasks.length === 2) {
                setProjectModalTasks(selectedTasks);
                setShowProjectModal(true);
            } else {
                Alert.alert('Select Tasks', 'Please select exactly two tasks to create a project.');
            }
        } else {
            // If grouped by priority, switch to project grouping
            Alert.alert('Switch Grouping', 'Please switch to Project grouping to create a project.');
        }
    };



    // const handleReceiveDragDrop = async (event, targetPriority) => {
    //     console.log('Drag Drop Event:', event);
    //     const draggedTask = event.dragged.payload;
    //     console.log('Dragged Task:', draggedTask);
    //     console.log('Target Priority:', targetPriority);
    //     if (draggedTask.priority === targetPriority) return; // No change

    //     try {
    //         // Update task priority in Firebase
    //         const taskRef = doc(db, `tasks/${userId}/taskList`, draggedTask.id);
    //         await updateDoc(taskRef, { priority: targetPriority });

    //         Alert.alert('Success', `Task "${draggedTask.title}" moved to ${targetPriority} priority.`);
    //     } catch (error) {
    //         console.error('Error updating task priority:', error);
    //         Alert.alert('Error', 'Failed to update task priority.');
    //     }
    // };

    // const handleTaskPress = (taskId) => {
    //     navigation.navigate('TaskDetailsScreen', { taskId });
    // };

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

    const handleMove = async (targetColumnKey) => {
        setIsMoveModalVisible(false);
        if (!draggingItem || !sourceColumnKey) return;

        // Remove task from source column
        const sourceColumn = columns.find(col => col.key === sourceColumnKey);
        const newSourceData = sourceColumn.data.filter(task => task.id !== draggingItem.id);

        // Add task to target column
        const targetColumn = columns.find(col => col.key === targetColumnKey);
        let updatedTask = { ...draggingItem };

        // const newTargetData = [...targetColumn.data, { ...draggingItem, priority: targetColumnKey }];


        if (grouping === 'priority') {
            updatedTask.priority = targetColumnKey;
        } else if (grouping === 'project') {
            updatedTask.project = targetColumnKey === 'No Project' ? null : targetColumnKey;
        }

        const newTargetData = [...targetColumn.data, updatedTask];

        setColumns(prevColumns => {
            return prevColumns.map(col => {
                if (col.key === sourceColumnKey) {
                    return { ...col, data: newSourceData };
                }
                if (col.key === targetColumnKey) {
                    return { ...col, data: newTargetData };
                }
                return col;
            });
        });

        // Update Firebase
        // try {
        //     const taskRef = doc(db, `tasks/${userId}/taskList`, draggingItem.id);
        //     await updateDoc(taskRef, { priority: targetColumnKey });
        //     Alert.alert('Success', `Task moved to ${targetColumnKey} priority.`);
        // } catch (error) {
        //     console.error('Error updating task priority:', error);
        //     Alert.alert('Error', 'Failed to update task priority.');
        // }

        try {
            const taskRef = doc(db, `tasks/${userId}/taskList`, draggingItem.id);
            const updateData = grouping === 'priority' ? { priority: targetColumnKey } : { project: targetColumnKey === 'No Project' ? null : targetColumnKey };
            await updateDoc(taskRef, updateData);
            Alert.alert('Success', `Task moved to ${targetColumnKey} ${grouping === 'priority' ? 'priority' : 'project'}.`);
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task.');
        }

        // Reset dragging state
        setDraggingItem(null);
        setSourceColumnKey(null);
    };

    const handleCancelMove = () => {
        setIsMoveModalVisible(false);
        setDraggingItem(null);
        setSourceColumnKey(null);
    };

    // const renderTask = useCallback((task) => (
    //     // <TouchableOpacity 
    //     //     style={styles.taskItem}
    //     //     onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: task.id })}
    //     // >
    //     //     <Text style={styles.taskTitle}>{task.title}</Text>
    //     //     <Text style={styles.taskDetails}>Due: {new Date(task.dueDate).toLocaleString()}</Text>
    //     //     <Text style={styles.taskDetails}>Priority: {task.priority}</Text>
    //     // </TouchableOpacity>
    //     <View>
    //         <Text style={styles.taskTitle}>{task.title}</Text>
    //         <Text style={styles.taskDetails}>Due: {new Date(task.dueDate).toLocaleString()}</Text>
    //         <Text style={styles.taskDetails}>Priority: {task.priority}</Text>
    //     </View>
    // ), [navigation]);

    // Toggle 'Due Soon' filter for a specific column
    // const toggleDueSoonFilter = (priority) => {
    //     setDueSoonFilters((prev) => ({
    //         ...prev,
    //         [priority]: !prev[priority],
    //     }));
    // };
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

        // if (selectedTasks && selectedTasks.length === 2) {
        //     // Associate selected tasks with the new project
        //     try {
        //         await updateTasksProject(userId, selectedTasks, projectName);
        //         Alert.alert('Project Created', `Project "${projectName}" created successfully!`);
        //     } catch (err) {
        //         console.error(err);
        //         Alert.alert('Error', err.message);
        //     }
        // } else {
        //     // Creating a project without assigning tasks
        //     Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);
        // }

        // // Reset selection
        // setSelectedTasks([]);
        if (projectModalTasks && projectModalTasks.length === 2) {
            // Associate selected tasks with the new project
            try {
                await updateTasksProject(userId, projectModalTasks, projectName);
                Alert.alert('Project Created', `Project "${projectName}" created successfully!`);
                setIsProjectModalVisible(false);
                setSelectedTasks([]);
            } catch (err) {
                console.error(err);
                Alert.alert('Error', err.message);
                setIsProjectModalVisible(false);
            }
        } else {
            // Creating a project without assigning tasks
            Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);
            setIsProjectModalVisible(false);
        }
    };

    const renderTask = useCallback(({ item, drag, isActive }) => {
        const isSelected = selectedTasks.some(task => task.id === item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.taskItem,
                    { 
                        backgroundColor: isActive ? '#e0ffe0' : isSelected ? '#d0f0d0' : '#fff',
                        borderColor: isActive ? '#ff0000' : isSelected ? '#00aa00' : '#ddd',
                        borderWidth: isActive || isSelected ? 2 : 1,
                    },
                ]}
                onLongPress={() => {
                    setDraggingItem(item);
                    // Find the source column
                    const sourceColumn = columns.find(col => col.data.some(task => task.id === item.id));
                    setSourceColumnKey(sourceColumn ? sourceColumn.key : null);
                    drag();
                    setTimeout(() => {
                        // handleMovePress();
                    }, 200);
                }}
                onPress={() => {
                    if (grouping === 'project') {
                        // In project grouping, allow selecting tasks for project creation
                        // if (selectedTasks.length < 2) {
                        //     setSelectedTasks(prev => [...prev, item]);
                        // } else {
                        //     setSelectedTasks(prev => prev.filter(task => task.id !== item.id));
                        // }
                        if (isSelected) {
                            setSelectedTasks(prev => prev.filter(task => task.id !== item.id));
                        } else {
                            if (selectedTasks.length < 2) {
                                setSelectedTasks(prev => [...prev, item]);
                            } else {
                                Alert.alert('Limit Reached', 'You can only select up to two tasks to create a project.');
                            }
                        }
                    } else {
                        // In priority grouping, navigate to task details
                        navigation.navigate('TaskDetailsScreen', { taskId: item.id });
                    }
                }}
            >
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
                <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
            </TouchableOpacity>
        );
    }, [columns, selectedTasks, grouping, navigation]);

    // const renderColumn = (priority) => (
    //     <View key={priority} style={styles.column}>
    //         <Text style={styles.columnTitle}>{priority} Priority</Text>
    //         <DraxView
    //             style={styles.dropZone}
    //             receivingStyle={styles.receiving}
    //             onReceiveDragDrop={(event) => handleReceiveDragDrop(event, priority)}
    //             // payload={{ priority }}
    //             type='task'
    //         >
    //             {columns[priority].map(task => (
    //                 <DraxView
    //                     key={task.id}
    //                     style={styles.draggable}
    //                     draggingStyle={styles.dragging}
    //                     dragReleasedStyle={styles.dragging}
    //                     hoverDraggingStyle={styles.hoverDragging}
    //                     dragPayload={task}
    //                     longPressDelay={150}
    //                     type='task'
    //                     onDragStart={() => console.log(`Drag started for task ${task.id}`)}
    //                     onDragEnd={() => console.log(`Drag ended for task ${task.id}`)}
    //                 >
    //                     {/* {renderTask(task)} */}
    //                     <Pressable
    //                         onPress={() => handleTaskPress(task.id)}
    //                         style={styles.taskItemPressable}
    //                     >
    //                         {renderTask(task)}
    //                     </Pressable>
    //                 </DraxView>
    //             ))}
    //         </DraxView>
    //     </View>
    // );

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

    // if (isLoading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color="#0000ff" />
    //         </View>
    //     );
    // }

    return (
        // <DraxProvider>
            // <View style={styles.container}>
            <View style={styles.container}>
                {/* Kanban Header */}
                <View style={styles.kanbanHeader}>
                    <Text style={styles.kanbanTitle}>Kanban Board</Text>
                    <TouchableOpacity style={styles.addProjectButton} onPress={handleAddProject}>
                        <Ionicons name="add-circle" size={30} color="#007bff" />
                    </TouchableOpacity>
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
                    columns={columns}
                    currentColumnKey={sourceColumnKey}
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
    // dropZone: {
    //     minHeight: 300,
    //     padding: 5,
    //     borderRadius: 8,
    // },
    // receiving: {
    //     borderColor: '#007bff',
    //     borderWidth: 2,
    //     backgroundColor: '#d0e8ff',
    // },
    // draggable: {
    //     marginBottom: 10,
    // },
    // dragging: {
    //     opacity: 0.2,
    // },
    // hoverDragging: {
    //     borderColor: 'red',
    //     borderWidth: 2,
    // },
    tasksContainer: {
        paddingBottom: 100,
    },
    taskItem: {
        padding: 12,
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
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    taskDetails: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
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