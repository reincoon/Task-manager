import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuItem } from 'react-native-material-menu';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const HomeScreen = ({ navigation }) => {
    const [visible, setVisible] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const hideMenu = () => setVisible(false);
    const showMenu = () => setVisible(true);

    const handleMenuOption = (option) => {
        console.log(`Selected: ${option}`);
        hideMenu();
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (!currentUser) {
                // Clear tasks if user is not logged in
                setTasks([]);
                return;
            }
        
            const userId = currentUser.uid;
            const tasksRef = collection(db, `tasks/${userId}/taskList`);
            const q = query(tasksRef, where('userId', '==', userId));
            
            const unsubscribeTasks = onSnapshot(q, (snapshot) => {
                const fetchedTasks = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTasks(fetchedTasks);
                setLoading(false);
            });
    
            return () => unsubscribeTasks();
        })
        return () => unsubscribe();
    }, []);

    const renderTaskItem = ({ item }) => (
        <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
            <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
        </View>
    )

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

            {/* Example Task List */}
            {loading ? (
                <Text style={styles.loadingText}>Loading to-do lists...</Text>
            ) : tasks.length > 0 ? (
                <FlatList
                    data={tasks}
                    keyExtractor={ (item) => item.id}
                    // renderItem={({ item }) => (
                    //     <View style={styles.taskItem}>
                    //         <Text>{item.title}</Text>
                    //     </View>
                    // )}
                    renderItem={renderTaskItem}
                />
            ) : (
                <Text style={styles.noTasksText}>No tasks available. Create a new to-do list!</Text>
            )}

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
});

export default HomeScreen;