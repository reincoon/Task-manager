import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuItem } from 'react-native-material-menu';

const HomeScreen = ({ navigation }) => {
    const [visible, setVisible] = useState(false);

    const hideMenu = () => setVisible(false);
    const showMenu = () => setVisible(true);

    const handleMenuOption = (option) => {
        console.log(`Selected: ${option}`);
        hideMenu();
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

            {/* Example Task List */}
            <FlatList
                data={[
                    { id: '1', title: 'Task 1', project: 'Project A', priority: 'High', dueDate: '2022-12-31' },
                    { id: '2', title: 'Task 2', project: 'Project B', priority: 'Medium', dueDate: '2022-12-31' },
                    { id: '3', title: 'Task 3', project: 'Project A', priority: 'Low', dueDate: '2022-12-31' },
                ]}
                keyExtractor={ (item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.taskItem}>
                        <Text>{item.title}</Text>
                    </View>
                )}
            />

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