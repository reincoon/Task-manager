import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuItem } from 'react-native-material-menu';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { PRIORITY_ORDER } from '../helpers/constants';
import { PRIORITIES } from '../helpers/priority'

const HomeScreen = ({ navigation }) => {
    const [visible, setVisible] = useState(false);
    const [rawTasks, setRawTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [columnFilters, setColumnFilters] = useState(
        PRIORITIES.reduce((acc, p) => {
            acc[p] = { dueSoon: false };
            return acc;
        }, {})
    );

    const hideMenu = () => setVisible(false);
    const showMenu = () => setVisible(true);

    const handleMenuOption = (option) => {
        if (option === 'Sort by Priority') {
            setSortOption('priority');
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
        let unsubscribeTasks;
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (!currentUser) {
                // Clear tasks if user is not logged in
                setRawTasks([]);
                setLoading(false);
                return;
            }
        
            const userId = currentUser.uid;
            const tasksRef = collection(db, `tasks/${userId}/taskList`);
            
            unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
                const fetchedTasks = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setRawTasks(fetchedTasks);
                setLoading(false);
            });
        });
        return () => {
            if (unsubscribeTasks) {
                unsubscribeTasks();
            };
            unsubscribeAuth();
        };
    }, []);

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

    const renderTaskItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.taskItem}
            onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: item.id })}
        >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
            <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
        </TouchableOpacity>
    );

    const renderListView = () => {
        return loading ? (
            <Text style={styles.loadingText}>Loading to-do lists...</Text>
        ) : tasks.length > 0 ? (
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTaskItem}
            />
        ) : (
            <Text style={styles.noTasksText}>No tasks available. Create a new to-do list!</Text>
        );
    };

    // Due soon criteria: tasks due within next 48 hours
    const dueSoonThreshold = 48 * 60 * 60 * 1000;

    const filterTasksForColumn = (priorityLevel) => {
        let columnTasks = tasks.filter(t => t.priority === priorityLevel);
        const { dueSoon } = columnFilters[priorityLevel];
        if (dueSoon) {
            const now = Date.now();
            columnTasks = columnTasks.filter(t => {
                const dueTime = new Date(t.dueDate).getTime();
                return dueTime > now && dueTime - now <= dueSoonThreshold;
            });
        }
        return columnTasks;
    };

    const toggleDueSoonFilter = (priorityLevel) => {
        setColumnFilters(prev => ({
            ...prev,
            [priorityLevel]: { dueSoon: !prev[priorityLevel].dueSoon }
        }));
    };

    const renderKanbanView = () => {
        // Group tasks by priority
        // const tasksByPriority = PRIORITIES.map(priorityLevel => ({
        //     priority: priorityLevel,
        //     tasks: tasks.filter(t => t.priority === priorityLevel)
        // }));
        const tasksByPriority = PRIORITIES.map(priorityLevel => {
            return {
                priority: priorityLevel,
                tasks: filterTasksForColumn(priorityLevel)
            };
        });

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

        return (
            <ScrollView horizontal style={{ flex: 1 }}>
                {tasksByPriority.map((column, index) => (
                    <View key={index} style={styles.kanbanColumn}>
                        <View style={styles.kanbanColumnHeader}>
                            <Text style={styles.kanbanColumnTitle}>
                                {column.priority} ({column.tasks.length})
                            </Text>
                            <TouchableOpacity 
                                style={styles.filterButton}
                                onPress={() => toggleDueSoonFilter(column.priority)}
                            >
                                <Text style={styles.filterButtonText}>
                                    {columnFilters[column.priority].dueSoon ? "All" : "Due Soon"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {column.tasks.length > 0 ? (
                            column.tasks.map(task => (
                                <TouchableOpacity 
                                    key={task.id} 
                                    style={styles.kanbanTaskItem}
                                    onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: task.id })}
                                >
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <Text style={styles.taskDetails}>Due: {new Date(task.dueDate).toLocaleString()}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noTasksText}>No tasks</Text>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header section */}
            <View style={styles.header}>
                <Text style={styles.title}>Home</Text>
                <Menu 
                    visible={visible}
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
            {/* <Text style={styles.title}>Home Screen</Text>
            <Button title="Create Task" onPress={() => navigation.navigate('Create Task')} />
            <Button title="See Task Details" onPress={() => navigation.navigate('Task Details')} />
            <Button title="View Statistics" onPress={() => navigation.navigate('Statistics')} />
            <Button title="Go to Settings" onPress={() => navigation.navigate('Settings')} /> */}
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
});

export default HomeScreen;