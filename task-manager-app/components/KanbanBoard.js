import { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { PRIORITIES } from '../helpers/constants';
import MoveToModal from '../components/MoveToModal';
import { groupTasksByProject } from '../helpers/projects';
import { updateTasksProject, updateTasksPriority, deleteProject } from '../helpers/firestoreHelpers';
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

export default function KanbanBoard({ 
    userId, 
    rawTasks, 
    projects, 
    navigation, 
    grouping, 
    setDraggingTask, 
    setHoveredTask 
}) {
    const [columns, setColumns] = useState([]);
    // States for dragging functionality
    const [draggingItem, setDraggingItem] = useState(null);
    const [sourceColumnKey, setSourceColumnKey] = useState(null);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
    // State to manage 'Due Soon' filters per column
    const [dueSoonFilters, setDueSoonFilters] = useState({});

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
            }
        } catch (error) {
            console.error('Error reordering on Kanban Board:', error);
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
            } else if (grouping === 'priority') {
                // Assign to new priority
                await updateTasksPriority(userId, [draggingItem], targetKey);
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

        const headerBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.darkTextSecondary;

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
                        tw`p-3 bg-${isDarkMode ? theme.colors.darkCardBg : theme.colors.darkTextSecondary} rounded-md`, 
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
                                            name="create"
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