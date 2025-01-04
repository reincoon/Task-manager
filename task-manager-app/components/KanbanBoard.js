import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
// import { NestableDraggableFlatList, ScaleDecorator, RenderItemParams, DraggableFlatList } from 'react-native-draggable-flatlist';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PRIORITIES } from '../helpers/priority';

const { width } = Dimensions.get('window');

const KanbanBoard = ({ userId, rawTasks, navigation }) => {
    const [data, setData] = useState([]);
    const originalDataRef = useRef([]);

    // Initialise data with headers and tasks
    useEffect(() => {
        if (!userId || !rawTasks) {
            setData([]);
            return;
        }

        // Group tasks by priority
        const tasksByPriority = {};
        PRIORITIES.forEach((p) => {
            tasksByPriority[p] = [];
        });

        rawTasks.forEach((task) => {
            const priority = task.priority || 'Low';
            if (!tasksByPriority[priority]) {
                tasksByPriority[priority] = [];
            }
            tasksByPriority[priority].push(task);
        });

        // Sort tasks within each priority by dueDate
        PRIORITIES.forEach((p) => {
            tasksByPriority[p].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        });

        // Build the flat list with headers and tasks
        const flatListData = [];
        PRIORITIES.forEach((p) => {
            flatListData.push({ type: 'header', id: p, title: `${p} Priority` });
            tasksByPriority[p].forEach((task) => {
                flatListData.push({ type: 'task', ...task });
            });
        });

        setData(flatListData);
    }, [rawTasks, userId]);

    // Update task priority in Firestore
    const updateTaskPriority = async (taskId, newPriority) => {
        try {
            const taskRef = doc(db, `tasks/${userId}/taskList`, taskId);
            await updateDoc(taskRef, { priority: newPriority });
            console.log(`Updated task ${taskId} to priority ${newPriority}`);
        } catch (error) {
            console.error('Error updating task priority:', error);
            Alert.alert('Error', 'Failed to update task priority.');
        }
    };

    // Render each item (header or task)
    const renderItem = ({ item, drag, isActive }) => {
        if (item.type === 'header') {
            return (
                <View
                    style={[
                        styles.headerContainer,
                        { backgroundColor: isActive ? '#d1ffd6' : '#ccc' },
                    ]}
                >
                    <Text style={styles.headerText}>{item.title}</Text>
                </View>
            );
        }

        if (item.type === 'task') {
            return (
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    style={[
                        styles.taskItem,
                        { backgroundColor: isActive ? '#e0ffe0' : '#fff' },
                    ]}
                    onPress={() => {
                        // Navigate to Task Details
                        navigation.navigate('TaskDetailsScreen', { taskId: item.id });
                    }}
                >
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    <Text style={styles.taskDetails}>
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                    <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    // Handle drag end
    const handleDragEnd = async ({ data: newData, from, to }) => {
        // If dragging a header, do nothing
        if (newData[to].type === 'header') {
            // Prevent headers from being reordered or receiving tasks
            setData(newData);
            return;
        }

        const draggedItem = newData[to];

        // Find the header above the 'to' index
        let newPriority = 'Low';
        for (let i = to; i >= 0; i--) {
            if (newData[i].type === 'header') {
                newPriority = newData[i].id;
                break;
            }
        }

        // If the task's priority has changed, update it
        if (draggedItem.priority !== newPriority) {
            // Update the task's priority locally
            draggedItem.priority = newPriority;

            // Update Firestore
            await updateTaskPriority(draggedItem.id, newPriority);
        }

        setData(newData);
    };

    return (
        <View style={styles.container}>
            <DraggableFlatList
                data={data}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={renderItem}
                onDragEnd={handleDragEnd}
                activationDistance={20}
                containerStyle={{ paddingBottom: 100 }}
            />
        </View>
    );
};
    
export default KanbanBoard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef',
        padding: 10,
    },
    headerContainer: {
        padding: 10,
        backgroundColor: '#ccc',
        borderRadius: 8,
        marginBottom: 5,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    taskItem: {
        padding: 12,
        borderRadius: 6,
        marginBottom: 10,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 2,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    taskDetails: {
        fontSize: 12,
        color: '#666',
    },
});
