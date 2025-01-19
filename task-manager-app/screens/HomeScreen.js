import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuItem } from 'react-native-material-menu';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { PRIORITIES } from '../helpers/priority';
import ProjectModal from '../components/ProjectModal';
import { updateTasksProject, createProject } from '../helpers/firestoreHelpers';
import KanbanBoard from '../components/KanbanBoard';
import ListView from '../components/ListView';
import AddProjectButton from '../components/AddProjectButton';
import MoveToModal from '../components/MoveToModal';
import { deleteTask as deleteTaskHelper } from '../helpers/taskActions';
import { COLOURS, PRIORITY_ORDER } from '../helpers/constants';

const HomeScreen = ({ navigation }) => {
    const [rawTasks, setRawTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [userId, setUserId] = useState(null);
    const [draggingTask, setDraggingTask] = useState(null);
    const [hoveredTask, setHoveredTask] = useState(null);
    const [grouping, setGrouping] = useState('priority');
    const [projects, setProjects] = useState([]);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
    const [sourceColumnKey, setSourceColumnKey] = useState(null);
    const [editingProjectIds, setEditingProjectIds] = useState({});

    const menuRef = useRef();

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
            setSortOption(null);
        } else if (option === 'Sort by Date') {
            setSortOption('date');
        } else if (option === 'Sort Alphabetically') {
            setSortOption('alphabetical');
        } else if (option === 'Sort by Colour') {
            setSortOption('colour');
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

            // Sort tasks by the order field
            const sortedTasks = [...fetchedTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
            setRawTasks(sortedTasks);
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
        if (!sortOption) {
            setTasks([...rawTasks]);
        } else {
            // Apply the chosen sort
            const temp = [...rawTasks];
            if (sortOption === 'date') {
                temp.sort((a, b) => {
                    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    return dateA - dateB;
                });
            } else if (sortOption === 'alphabetical') {
                temp.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            } else if (sortOption === 'colour') {
                temp.sort((a, b) => ((a.colour || '').localeCompare(b.colour || '')));
            } else if (sortOption === 'priority') {
                temp.sort((a, b) => (PRIORITY_ORDER[a.priority] || 999) - (PRIORITY_ORDER[b.priority] || 999))
            }
            setTasks(temp)
        }
    }, [sortOption, rawTasks]);

    const renderKanbanView = () => {
        return <KanbanBoard 
                    userId={userId} 
                    rawTasks={tasks} 
                    projects={projects} 
                    navigation={navigation} 
                    grouping={grouping}
                    setDraggingTask={setDraggingTask}
                    setHoveredTask={setHoveredTask}
                />;
    };

    const handleCreateProject = async (projectName) => {
        if (!userId) {
            setShowProjectModal(false);
            Alert.alert('Error', 'User not signed in.');
            return;
        }

        try {
            // Create a new project in Firebase
            const projectId = await createProject(userId, projectName);
            Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);

            // Reset states
            setShowProjectModal(false);
            setDraggingTask(null);
            setHoveredTask(null);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.message);
            // Revert data
            setShowProjectModal(false);
            setDraggingTask(null);
            setHoveredTask(null);
        }
        
    };

    const handleEditProject = (projectId) => {
        setEditingProjectIds((prev) => ({
            ...prev,
            [projectId]: true
        }));
    };

    const handleCancelEditing = (projectId) => {
        setEditingProjectIds((prev) => {
            const updated = { ...prev };
            delete updated[projectId];
            return updated;
        });
    };

    const handleAddProjectFromList = () => {
        setShowProjectModal(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // Helper function to delete a todo list passed as a prop
    const handleDeleteTask = async (item) => {
        try {
            await deleteTaskHelper(userId, item, navigation, false);
            Alert.alert('Deleted', 'Task deleted successfully');
        } catch (err) {
            console.error('Error deleting task:', err);
            Alert.alert('Error', 'Could not delete task');
        }
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
        setNewProjectNames((prevNames) => ({
                    ...prevNames,
                    [projectId]: newName,
                }));
                // setEditingProjectId(null);
                try {
                    await updateProjectName(userId, projectId, newName);
                    Alert.alert("Success", "Project renamed successfully.");
                    setNewProjectNames(prev => {
                        const updated = { ...prev };
                        delete updated[projectId]; // Remove the edited project from the state
                        return updated;
                    });
                } catch (error) {
                    console.error("Error renaming project:", error);
                    Alert.alert("Error", "Could not rename project.");
                }
    }

    const renderListView = () => {
        return (
            <ListView
                userId={userId}
                tasks={tasks}
                projects={projects}
                sortOption={sortOption}
                setSortOption={setSortOption}
                navigation={navigation}
                deleteTask={handleDeleteTask}
                setDraggingTask={setDraggingTask}
                setHoveredTask={setHoveredTask}
                grouping={grouping}
                onEditProject={handleEditProject}
                editingProjectIds={editingProjectIds}
                onCancelEditing={handleCancelEditing}
                onRenameProject={handleRenameProject}
            />
        );
    }

    // Handle moving a task via modal
    const handleMove = async (targetProjectId) => {
        setIsMoveModalVisible(false);
        if (!draggingTask || !sourceColumnKey) return;

        const targetProject = targetProjectId ? projects.find(p => p.id === targetProjectId) : { name: 'Unassigned' };

        try {
            await updateTasksProject(userId, [draggingTask], targetProjectId || null);
            Alert.alert(
                'Success',
                targetProjectId
                    ? `Task moved to ${targetProject.name}.`
                    : 'Task unassigned from project.'
            );
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
            {loading ? <ActivityIndicator style={{marginTop:20}}/> : null}
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
                    <MenuItem onPress={() => handleMenuOption('Sort by Project')}>Group by Project</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort by Priority')}>Group by Priority</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort by Date')}>Sort by Date</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort Alphabetically')}>Sort Alphabetically</MenuItem>
                    <MenuItem onPress={() => handleMenuOption('Sort by Colour')}>Sort by Colour</MenuItem>
                </Menu>
            </View>

            {viewMode === 'list' ? renderListView() : renderKanbanView()}

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
                    // setData(originalData);
                    // setOriginalData([]);
                    setDraggingTask(null); 
                    setHoveredTask(null);
                }}
                onCreate={handleCreateProject}
                // onCreate={(projectName) => handleCreateProject(projectName, [])}
                // selectedTasks={draggingTask && hoveredTask ? [draggingTask, hoveredTask] : []}
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