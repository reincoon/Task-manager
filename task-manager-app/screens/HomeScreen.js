import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import { deleteTask as deleteTaskHelper } from '../helpers/taskActions';
import useTasks from '../hooks/useTasks';
import useProjects from '../hooks/useProjects';
import useSortedTasks from '../hooks/useSortedTasks';
import HomeView from '../components/HomeView';
import useProjectActions from '../hooks/useProjectActions';
import { useCopilot } from 'react-native-copilot';
import tw, { theme } from '../twrnc';

export default function HomeScreen({ navigation }) {
    const { start } = useCopilot();

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
        // hideMenu();
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

    // Custom hooks for tasks, projects and sorting
    const { rawTasks, loading } = useTasks(userId);
    const fetchedProjects = useProjects(userId);
    const sortedTasks = useSortedTasks(rawTasks, sortOption);

    useEffect(() => {
        setProjects(fetchedProjects);
    }, [fetchedProjects]);

    const { createNewProject, openEditProjectModal } = useProjectActions(userId, {
        setShowProjectModal,
        setDraggingTask,
        setHoveredTask,
        setEditingProjId,
        setNewProjectName,
        setIsEditModalVisible,
    });

    const openProjectModal = () => {
        setShowProjectModal(true);
    };
    
    const closeProjectModal = () => {
        setShowProjectModal(false);
    };
    
    const handleTutorialPress = () => {
        setTimeout(() => {
            start();
        }, 300);
    };

    // Helper function to delete a todo list passed as a prop
    const handleDeleteTask = async (item) => {
        try {
            await deleteTaskHelper(userId, item, navigation, false);
            Alert.alert('Deleted', 'Task deleted successfully');
        } catch (err) {
            Alert.alert('Error', 'Could not delete task');
        }
    };
    
    return (
        <SafeAreaView style={tw`flex-1 bg-light`}>
            {loading ? 
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color={theme.colors.teal} />
                </View>
            : null}
            <HomeView
                userId={userId}
                navigation={navigation}
                menuRef={menuRef}
                onMenuOption={handleMenuOption}
                viewMode={viewMode}
                tasks={sortedTasks}
                projects={projects}
                grouping={grouping}
                setSortOption={setSortOption}
                sortOption={sortOption}
                onAddProjectPress={openProjectModal}
                onDeleteTask={handleDeleteTask}
                openEditProjectModal={openEditProjectModal}
                showProjectModal={showProjectModal}
                onCloseProjectModal={closeProjectModal}
                onCreateProject={createNewProject}
                setDraggingTask={setDraggingTask}
                setHoveredTask={setHoveredTask}
                onTutorialPress={handleTutorialPress}
            />
        </SafeAreaView>
    )
};