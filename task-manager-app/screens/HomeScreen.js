import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuItem } from 'react-native-material-menu';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { PRIORITY_ORDER } from '../helpers/constants';
import { PRIORITIES } from '../helpers/priority';
import DraggableFlatList from 'react-native-draggable-flatlist';
import ProjectModal from '../components/ProjectModal';
import { updateTasksProject, createProject, assignTasksToProject, unassignTasksFromProject } from '../helpers/firestoreHelpers';
import { groupTasksByProject, buildListData } from '../helpers/projects';
import KanbanBoard from '../components/KanbanBoard';
import AddProjectButton from '../components/AddProjectButton';
import MoveToModal from '../components/MoveToModal';

const HomeScreen = ({ navigation }) => {
    // const [visible, setVisible] = useState(false);
    const [rawTasks, setRawTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    // const [columnFilters, setColumnFilters] = useState(
    //     PRIORITIES.reduce((acc, p) => {
    //         acc[p] = { dueSoon: false };
    //         return acc;
    //     }, {})
    // );
    const [showProjectModal, setShowProjectModal] = useState(false);
    // const [emptyProjectName, setEmptyProjectName] = useState('');
    const [userId, setUserId] = useState(null);
    const [draggingTask, setDraggingTask] = useState(null);
    const [hoveredTask, setHoveredTask] = useState(null);
    const [data, setData] = useState([]);
    // const originalDataRef = useRef([]);
    const [originalData, setOriginalData] = useState([]);
    const [grouping, setGrouping] = useState('priority');
    const [projects, setProjects] = useState([]);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);

    const menuRef = useRef();

    // const hideMenu = () => setVisible(false);
    // const showMenu = () => setVisible(true);
    const hideMenu = () => {
        if (menuRef.current) {
            menuRef.current.hide();
        }
    };
    const showMenu = () => {
        if (menuRef.current) {
            menuRef.current.show();
        }
    };

    const handleMenuOption = (option) => {
        if (option === 'Sort by Priority') {
            setSortOption('priority');
            setGrouping('priority');
        } else if (option === 'Sort by Project') {
            setGrouping('project');
        } else if (option === 'Sort by Date') {
            setSortOption('date');
        } else if (option === 'Sort Alphabetically') {
            setSortOption('alphabetical');
        } else if (option === 'Kanban View') {
            // Switch to Kanban view
            setViewMode('kanban');
        } else if (option === 'List View') {
            // Switch to List view
            setViewMode('list');
        } else {
            setSortOption(null);
        }
        hideMenu();
    };

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (!currentUser) {
                console.log('No user is signed in.');
                setRawTasks([]);
                setProjects([]);
                setLoading(false);
            } else {
                setUserId(currentUser.uid);
                console.log('User signed in:', currentUser.uid);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!userId) return;
        const tasksRef = collection(db, `tasks/${userId}/taskList`);
        const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
            const fetchedTasks = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                priority: doc.data().priority || 'Low',
            }));
            console.log('Fetched tasks:', fetchedTasks);
            setRawTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Snapshot listener error:", error);
        });
        return () => {
            if (unsubscribeTasks) {
                unsubscribeTasks();
            }
        };
    }, [userId]);

    // Fetch projects
    useEffect(() => {
        if (!userId) return;
        const projectsRef = collection(db, `projects/${userId}/userProjects`);
        const unsubscribeProjects = onSnapshot(projectsRef, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            console.log('Fetched projects:', fetchedProjects);
            setProjects(fetchedProjects);
        }, (error) => {
            console.error("Snapshot listener error:", error);
        });
        return () => {
            if (unsubscribeProjects) {
                unsubscribeProjects();
            }
        };
    }, [userId]);

    // Sort tasks whenever rawTasks or sortOption changes
    useEffect(() => {
        let sortedTasks = [...rawTasks];
        if (sortOption === 'priority') {
            // Sort by priority
            sortedTasks.sort((a, b) => {
                return (PRIORITY_ORDER[a.priority] || 999) - (PRIORITY_ORDER[b.priority] || 999);
            });
        } else if (sortOption === 'date') {
            // Sort by date
            sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        } else if (sortOption === 'alphabetical') {
            // Sort alphabetically
            sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
        }
        setTasks(sortedTasks);
    }, [rawTasks, sortOption]);

    // const renderTaskItem = ({ item }) => (
    //     // <TouchableOpacity 
    //     //     style={styles.taskItem}
    //     //     onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: item.id })}
    //     // >
    //     //     <Text style={styles.taskTitle}>{item.title}</Text>
    //     //     <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
    //     //     <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
    //     // </TouchableOpacity>

    //     <TouchableOpacity 
    //         style={[styles.taskItem, isActive && {opacity:0.7}]}
    //         onLongPress={drag}
    //         onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: item.id })}
    //     >
    //         <Text style={styles.taskTitle}>{item.title}</Text>
    //         <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
    //         <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
    //     </TouchableOpacity>
    // );

    useEffect(() => {
        if (viewMode === 'list') {
            const { noProject, byProject } = groupTasksByProject(tasks, projects);
            const newData = buildListData(noProject, byProject, projects);
            setData(newData);
        }
    }, [tasks, viewMode, projects]);

    // const renderListView = () => {
    //     return loading ? (
    //         <Text style={styles.loadingText}>Loading to-do lists...</Text>
    //     ) : tasks.length > 0 ? (
    //         <FlatList
    //             data={tasks}
    //             keyExtractor={(item) => item.id}
    //             renderItem={renderTaskItem}
    //         />
    //     ) : (
    //         <Text style={styles.noTasksText}>No tasks available. Create a new to-do list!</Text>
    //     );
    // };

    // const filterTasksForColumn = (priorityLevel) => {
    //     let columnTasks = tasks.filter(t => t.priority === priorityLevel);
    //     const { dueSoon } = columnFilters[priorityLevel];
    //     if (dueSoon) {
    //         const now = Date.now();
    //         columnTasks = columnTasks.filter(t => {
    //             const dueTime = new Date(t.dueDate).getTime();
    //             return dueTime > now && dueTime - now <= dueSoonThreshold;
    //         });
    //     }
    //     return columnTasks;
    // };

    const renderKanbanView = () => {
        // Group tasks by priority
        // const tasksByPriority = PRIORITIES.map(priorityLevel => ({
        //     priority: priorityLevel,
        //     tasks: tasks.filter(t => t.priority === priorityLevel)
        // }));
        // const tasksByPriority = PRIORITIES.map(priorityLevel => {
        //     return {
        //         priority: priorityLevel,
        //         tasks: filterTasksForColumn(priorityLevel)
        //     };
        // });
        // if (loading) {
        //     return <ActivityIndicator style={{ marginTop: 20 }} />;
        // }
        // if (!tasks.length) {
        //     return <Text style={styles.noTasksText}>No tasks found</Text>;
        // }
        return <KanbanBoard userId={userId} rawTasks={tasks} projects={projects} navigation={navigation} grouping={grouping} />;
        

    //     return (
    //         <ScrollView horizontal style={{ flex: 1 }}>
    //             {tasksByPriority.map((column, index) => (
    //                 <View key={index} style={styles.kanbanColumn}>
    //                     <Text style={styles.kanbanColumnTitle}>{column.priority}</Text>
    //                     {column.tasks.length > 0 ? (
    //                         column.tasks.map(task => (
    //                             <TouchableOpacity 
    //                                 key={task.id} 
    //                                 style={styles.kanbanTaskItem}
    //                                 onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: task.id })}
    //                             >
    //                                 <Text style={styles.taskTitle}>{task.title}</Text>
    //                                 <Text style={styles.taskDetails}>Due: {new Date(task.dueDate).toLocaleString()}</Text>
    //                             </TouchableOpacity>
    //                         ))
    //                     ) : (
    //                         <Text style={styles.noTasksText}>No tasks</Text>
    //                     )}
    //                 </View>
    //             ))}
    //         </ScrollView>
    //     );
    // };

        // return (
        //     <ScrollView horizontal style={{ flex: 1 }}>
        //         {tasksByPriority.map((column, index) => (
        //             <View key={index} style={styles.kanbanColumn}>
        //                 <View style={styles.kanbanColumnHeader}>
        //                     <Text style={styles.kanbanColumnTitle}>
        //                         {column.priority} ({column.tasks.length})
        //                     </Text>
        //                     <TouchableOpacity 
        //                         style={styles.filterButton}
        //                         onPress={() => toggleDueSoonFilter(column.priority)}
        //                     >
        //                         <Text style={styles.filterButtonText}>
        //                             {columnFilters[column.priority].dueSoon ? "All" : "Due Soon"}
        //                         </Text>
        //                     </TouchableOpacity>
        //                 </View>
        //                 {column.tasks.length > 0 ? (
        //                     column.tasks.map(task => (
        //                         <TouchableOpacity 
        //                             key={task.id} 
        //                             style={styles.kanbanTaskItem}
        //                             onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: task.id })}
        //                         >
        //                             <Text style={styles.taskTitle}>{task.title}</Text>
        //                             <Text style={styles.taskDetails}>Due: {new Date(task.dueDate).toLocaleString()}</Text>
        //                         </TouchableOpacity>
        //                     ))
        //                 ) : (
        //                     <Text style={styles.noTasksText}>No tasks</Text>
        //                 )}
        //             </View>
        //         ))}
        //     </ScrollView>
        // );
    };

    const handleCreateProject = async (projectName, selectedTasks) => {
        // if (!userId || !draggingTask || !hoveredTask) {
        //     setShowProjectModal(false);
        //     // restore original data since user canceled or something went wrong
        //     // setData(originalDataRef.current);
        //     setData(originalData);
        //     setOriginalData([]);
        //     setDraggingTask(null);
        //     setHoveredTask(null);
        //     return;
        // }
        // // Update both to-do lists in Firestore
        // try {
        //     await updateTasksProject(userId, [draggingTask, hoveredTask], projectName);
        //     setShowProjectModal(false);
        //     setDraggingTask(null);
        //     setHoveredTask(null);
        //     Alert.alert('Project Created', `Project "${projectName}" created successfully!`);
        // } catch (err) {
        //     console.error(err);
        //     Alert.alert('Error', err.message);
        //     // revert data
        //     setShowProjectModal(false);
        //     // setData(originalDataRef.current);
        //     setData(originalData);
        //     setOriginalData([]);
        //     setDraggingTask(null);
        //     setHoveredTask(null);
        // }
        if (!userId) {
            setShowProjectModal(false);
            Alert.alert('Error', 'User not signed in.');
            return;
        }

        // if (selectedTasks && selectedTasks.length === 2) {
        //     // Create project by associating two tasks
        //     try {
        //         await updateTasksProject(userId, selectedTasks, projectName);
        //         setShowProjectModal(false);
        //         setDraggingTask(null);
        //         setHoveredTask(null);
        //         Alert.alert('Project Created', `Project "${projectName}" created successfully!`);
        //     } catch (err) {
        //         console.error(err);
        //         Alert.alert('Error', err.message);
        //         // Revert data
        //         setShowProjectModal(false);
        //         setData(originalData);
        //         setOriginalData([]);
        //         setDraggingTask(null);
        //         setHoveredTask(null);
        //     }
        // } else {
        //     // Creating a project without assigning tasks
        //     setShowProjectModal(false);
        //     Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);
        // }
        try {
            // Create a new project in Firebase
            const projectId = await createProject(userId, projectName);

            if (selectedTasks && selectedTasks.length === 2) {
                // Assign selected tasks to the new project
                await assignTasksToProject(userId, selectedTasks, projectId);
                Alert.alert('Project Created', `Project "${projectName}" created with two tasks.`);
            } else {
                // Create an empty project
                Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);
            }

            // Reset states
            setShowProjectModal(false);
            setDraggingTask(null);
            setHoveredTask(null);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.message);
            // Revert data if needed
            setShowProjectModal(false);
            setData(originalData);
            setOriginalData([]);
            setDraggingTask(null);
            setHoveredTask(null);
        }
        
    };

    const handleAddProjectFromList = () => {
        setShowProjectModal(true);
    };

    // Open Project Modal via Add Project button in Kanban View
    const handleAddProjectFromKanban = () => {
        setShowProjectModal(true);
    };

    // Render Task Item
    const renderTask = useCallback(({ item, drag, isActive }) => {
        return (
            <TouchableOpacity 
                style={[styles.taskItem, isActive && { opacity: 0.7 }]}
                onLongPress={() => {
                    setDraggingTask(item);
                    const sourceColumn = grouping === 'priority' 
                        ? PRIORITIES.find(col => col === item.priority)
                        : projects.find(p => p.id === item.projectId);
                    setSourceColumnKey(sourceColumn ? sourceColumn.key : null);
                    drag();
                }}
                onPress={() => {
                    navigation.navigate('TaskDetailsScreen', { taskId: item.id });
                }}
            >
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
                <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
            </TouchableOpacity>
        );
    }, [grouping, projects, navigation]);


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }
    const renderListView = () => {
        // if (loading) {
        //     return <ActivityIndicator style={{marginTop:20}} />;
        // }
        if (data.length === 0) {
            return <Text style={styles.noTasksText}>No tasks available. Create a new to-do list!</Text>;
        }

        const renderItem = ({ item, drag, isActive }) => {
            if (item.type === 'projectHeader') {
                return (
                    <View style={styles.projectHeader}>
                        <Text style={[styles.projectHeaderText, {color: '#333'}]}>{item.projectName}</Text>
                    </View>
                );
            }
            if (item.type === 'noProjectHeader') {
                return (
                    <View style={[styles.projectHeader, {backgroundColor:'#ccc'}]}>
                        <Text style={styles.projectHeaderText}>To-do lists without a Project</Text>
                    </View>
                );
            }
            // It's a task
            return (
                <TouchableOpacity 
                    style={[styles.taskItem, isActive && {opacity:0.7}]}
                    onLongPress={drag}
                    onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: item.id })}
                >
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
                    <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
                </TouchableOpacity>
            );
        };

        const keyExtractor = (item, index) => {
            if (item.type === 'projectHeader') return `projectHeader-${item.projectName}-${index}`;
            if (item.type === 'noProjectHeader') return `noProjectHeader-${index}`;
            return item.id;
        };

        const onDragEnd = async ({ data: newData, from, to }) => {
            if (from === to) return;

            const draggedItem = newData[from];
            const droppedItem = newData[to];

            // Save original data in case it's needed to revert
            const oldData = data;
            // originalDataRef.current = oldData;
            setOriginalData(oldData);

            // Find the project/noProject section above the dropped position
            let finalProject = null;
            for (let i = to; i >= 0; i--) {
                if (newData[i].type === 'projectHeader') {
                    finalProject = newData[i].projectName;
                    break;
                }
                if (newData[i].type === 'noProjectHeader') {
                    finalProject = null; 
                    break;
                }
            }

            // If draggedItem is a task
            if (draggedItem.type === 'task') {
                const originalProject = draggedItem.project || null;

                // I1) Creating a new project with 2 unassigned tasks (create a project)
                if (droppedItem.type === 'task' && !droppedItem.project && !originalProject && draggedItem.id !== droppedItem.id) {
                    setDraggingTask(draggedItem);
                    setHoveredTask(droppedItem);
                    setShowProjectModal(true);
                    setData(oldData);
                    return;
                }

                if (finalProject !== originalProject) {
                    // Find the project ID
                    const project = projects.find(p => p.id === finalProject);
                    const projectId = project ? project.id : null;

                    // Update project field for draggedItem
                    if (!userId) {
                        // revert 
                        setData(oldData);
                        return;
                    }
                    // await updateTasksProject(userId, [draggedItem], finalProject || null);
                    try {
                        await assignTasksToProject(userId, [draggedItem], projectId || null);
                        Alert.alert('Success', `Task moved to ${finalProject ? project.name : 'Unassigned Projects list'}.`);
                    } catch (error) {
                        console.error('Error updating task:', error);
                        Alert.alert('Error', 'Failed to update task.');
                        setData(oldData); // Revert on error
                        return;
                    }
                }
            }
            // If just reordering within the same section with no project change, the new order is stored locally
            setData(newData);
        };

        return (
            <View style={{flex:1}}>
                <Text style={{textAlign:'center', margin:10, fontSize:14, color:'#666'}}>
                -    Long press and drag one unassigned to-do list over another unassigned to create a project.
                    {"\n"}- Drag a to-do list to a project header or a task in that project to move it into the project.
                    {"\n"}- Drag a task to the 'no project' section to remove it from a project.
                </Text>
                <DraggableFlatList
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    onDragEnd={onDragEnd}
                    activationDistance={20}
                    containerStyle={{paddingBottom:100}}
                />
            </View>
        );
    };

    // Handle moving a task via modal
    const handleMove = async (targetProjectId) => {
        setIsMoveModalVisible(false);
        if (!draggingTask || !sourceColumnKey) return;

        const targetProject = targetProjectId ? projects.find(p => p.id === targetProjectId) : { name: 'No Project' };

        try {
            if (targetProjectId) {
                await assignTasksToProject(userId, [draggingTask], targetProjectId);
                Alert.alert('Success', `Task moved to ${targetProject.name}.`);
            } else {
                // Unassign the task from any project
                await unassignTasksFromProject(userId, [draggingTask]);
                Alert.alert('Success', `Task unassigned from project.`);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task.');
        }

        // Reset dragging state
        setDraggingTask(null);
        setSourceColumnKey(null);
    };

    // Cancel the move modal
    const handleCancelMove = () => {
        setIsMoveModalVisible(false);
        setDraggingTask(null);
        setSourceColumnKey(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* {loading ? <ActivityIndicator style={{marginTop:20}}/> : null} */}
            {/* Header section */}
            <View style={styles.header}>
                <Text style={styles.title}>Home</Text>
                {viewMode === 'list' && (
                    <AddProjectButton
                        onPress={handleAddProjectFromList}
                        label="Add Project"
                    />
                )}
                <Menu 
                    // visible={visible}
                    ref={menuRef} 
                    anchor={
                        <TouchableOpacity onPress={showMenu}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
                        </TouchableOpacity>
                    }
                    onRequestClose={hideMenu}
                >
                    <MenuItem onPress={() => handleMenuOption('List View')}>List View</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Kanban View')}>Kanban View</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort by Project')}>Sort by Project</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort by Date')}>Sort by Date</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort by Priority')}>Sort by Priority</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort Alphabetically')}>Sort Alphabetically</MenuItem>
                </Menu>
            </View>

            {viewMode === 'list' ? renderListView() : renderKanbanView()}

            {/* Example Task List
            {loading ? (
                <Text style={styles.loadingText}>Loading to-do lists...</Text>
            ) : tasks.length > 0 ? (
                <FlatList
                    data={tasks}
                    keyExtractor={ (item) => item.id}
                    renderItem={renderTaskItem}
                />
            ) : (
                <Text style={styles.noTasksText}>No tasks available. Create a new to-do list!</Text>
            )} */}

            {/* Floating Action button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => navigation.navigate('TaskCreationScreen')}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            {/* Move To Modal */}
            <MoveToModal
                visible={isMoveModalVisible}
                onClose={handleCancelMove}
                onMove={handleMove}
                columns={grouping === 'project' ? projects : PRIORITIES.map(p => ({ id: p, name: p }))}
                currentColumnKey={grouping === 'project' ? draggingTask?.projectId : draggingTask?.priority}
            />

            {/* Project Creation Modal */}
            <ProjectModal
                visible={showProjectModal}
                onCancel={() => {
                    setShowProjectModal(false); 
                    // setData(originalDataRef.current);
                    setData(originalData);
                    setOriginalData([]);
                    setDraggingTask(null); 
                    setHoveredTask(null);
                }}
                onCreate={handleCreateProject}
                // onCreate={(projectName) => handleCreateProject(projectName, [])}
                selectedTasks={draggingTask && hoveredTask ? [draggingTask, hoveredTask] : []}
            />
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    taskItem: {
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    taskDetails: {
        fontSize: 14,
        color: '#666',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    noTasksText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#999',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'blue',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kanbanColumn: {
        width: 220,
        padding: 10,
        marginVertical: 10,
        marginLeft: 10,
        backgroundColor: '#eee',
        borderRadius: 10,
    },
    kanbanColumnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    kanbanColumnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    kanbanTaskItem: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    filterButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    filterButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    projectHeader: {
        padding: 8,
        backgroundColor: '#ddd',
        marginHorizontal:16,
        marginTop:10,
        borderRadius:5,
        borderLeftWidth:4,
        borderLeftColor:'#007bff'
    },
    projectHeaderText: {
        fontSize:16,
        fontWeight:'bold'
    },
    instructionsText: {
        textAlign: 'center',
        margin: 10,
        fontSize: 14,
        color: '#666',
    },
});

export default HomeScreen;