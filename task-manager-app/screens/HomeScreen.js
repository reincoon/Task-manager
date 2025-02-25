import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import ProjectModal from '../components/ProjectModal';
import { createProject } from '../helpers/firestoreHelpers';
import KanbanBoard from '../components/KanbanBoard';
import ListView from '../components/ListView';
import { deleteTask as deleteTaskHelper } from '../helpers/taskActions';
import { PRIORITY_ORDER } from '../helpers/constants';
import HomeHeader from '../components/HomeHeader';
import FloatingActionButton from '../components/FloatingActionButton';
import useTasks from '../hooks/useTasks';
import useProjects from '../hooks/useProjects';
import useSortedTasks from '../hooks/useSortedTasks';
import HomeView from '../components/HomeView';

const HomeScreen = ({ navigation }) => {
    // const [rawTasks, setRawTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [userId, setUserId] = useState(null);
    const [draggingTask, setDraggingTask] = useState(null);
    const [hoveredTask, setHoveredTask] = useState(null);
    const [grouping, setGrouping] = useState('priority');
    const [projects, setProjects] = useState([]);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingProjId, setEditingProjId] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');

    const menuRef = useRef();

    // Custom hooks for tasks and projects
    const { rawTasks, loading } = useTasks(userId);
    const fetchedProjects = useProjects(userId);
    const sortedLists = useSortedTasks(rawTasks, sortOption);

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
        menuRef.current?.hide();
    };

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (!currentUser) {
                setProjects([]);
            } else {
                setUserId(currentUser.uid);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        setProjects(fetchedProjects);
    }, [fetchedProjects]);

    // Sort tasks whenever rawTasks or sortOption changes
    // useEffect(() => {
    //     if (!sortOption) {
    //         setTasks([...rawTasks]);
    //     } else {
    //         // Apply the chosen sort
    //         const sorted = [...rawTasks].sort((a, b) => {
    //             if (sortOption === 'date') {
    //                 const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    //                 const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    //                 return dateA - dateB;
    //             } else if (sortOption === 'alphabetical') {
    //                 return (a.title || '').localeCompare(b.title || '');
    //             } else if (sortOption === 'colour') {
    //                 return (a.colour || '').localeCompare(b.colour || '');
    //             } else if (sortOption === 'priority') {
    //                 return (PRIORITY_ORDER[a.priority] || 999) - (PRIORITY_ORDER[b.priority] || 999);
    //             }
    //             return 0;
    //         });
    //         setTasks(sorted)
    //     }
    // }, [sortOption, rawTasks]);

    const handleCreateProject = async (projectName) => {
        if (!userId) {
            setShowProjectModal(false);
            Alert.alert('Error', 'User not signed in.');
            return;
        }

        try {
            // Create a new project in Firebase
            await createProject(userId, projectName);
            Alert.alert('Project Created', `Project "${projectName}" created. Assign tasks to it manually.`);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.message);
            // Revert data
            setShowProjectModal(false);
            setDraggingTask(null);
            setHoveredTask(null);
        } finally {
            // Reset states
            setShowProjectModal(false);
            setDraggingTask(null);
            setHoveredTask(null);
        }
        
    };

    const openEditProjectModal = (projectId, projectName) => {
        const actualName = projectName.split(' (')[0];
        setEditingProjId(projectId);
        setNewProjectName(actualName.trim());
        setIsEditModalVisible(true);
    };

    // const handleEditProject = async (projectId, newName) => {
    //     if (!newName.trim()) {
    //         Alert.alert('Error', 'Project name cannot be empty.');
    //         return;
    //     }
    //     try {
    //         await updateProjectName(userId, projectId, newName);
    //         Alert.alert('Success', 'Project renamed.');
    //     } catch (err) {
    //         Alert.alert('Error', 'Failed to rename project.');
    //     } finally {
    //         setIsEditModalVisible(false);
    //         setEditingProjId(null);
    //         setNewProjectName('');
    //     }
    // };

    const handleAddProjectFromList = () => {
        setShowProjectModal(true);
    };

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
                openEditProjectModal={openEditProjectModal}
            />
        );
    }

    const renderKanbanView = () => {
        return <KanbanBoard 
                    userId={userId} 
                    rawTasks={tasks} 
                    projects={projects} 
                    navigation={navigation} 
                    grouping={grouping}
                    setDraggingTask={setDraggingTask}
                    setHoveredTask={setHoveredTask}
                    openEditProjectModal={openEditProjectModal}
                />;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }
    
    return (
        <SafeAreaView style={styles.container}>
            {/* {loading ? <ActivityIndicator style={{marginTop:20}}/> : null} */}
            {/* Header section */}
            {/* <HomeHeader
                title="Home"
                menuRef={menuRef}
                showMenu={() => menuRef.current?.show()}
                hideMenu={() => menuRef.current?.hide()}
                onMenuOption={handleMenuOption}
                viewMode={viewMode}
                onAddProjectPress={handleAddProjectFromList}
            /> */}

            {/* {viewMode === 'list' ? renderListView() : renderKanbanView()} */}

            {/* Floating Action button */}
            {/* <FloatingActionButton onPress={() => navigation.navigate('TaskCreationScreen')} /> */}

            {/* Project Creation Modal */}
            {/* <ProjectModal
                visible={showProjectModal}
                onCancel={() => {
                    setShowProjectModal(false); 
                    setDraggingTask(null); 
                    setHoveredTask(null);
                }}
                onCreate={handleCreateProject}
            /> */}

            <HomeView 
                navigation={navigation}
                menuRef={menuRef}
                onMenuOption={handleMenuOption}
                viewMode={viewMode}
                tasks={sortedLists}
                projects={projects}
                grouping={grouping}
                setSortOption={setSortOption}
                onAddProjectPress={() => setShowProjectModal(true)}
                onDeleteTask={handleDeleteTask}
                openEditProjectModal={openEditProjectModal}
                showProjectModal={showProjectModal}
                onCreateProject={handleCreateProject}
                isEditModalVisible={isEditModalVisible}
                editingProjId={editingProjId}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                // onEditProject={handleEditProject}
                onCloseEditModal={() => setIsEditModalVisible(false)}
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