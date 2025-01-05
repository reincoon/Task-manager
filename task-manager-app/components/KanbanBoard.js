import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, ActivityIndicator, ScrollView, Pressable } from 'react-native';
// import { NestableDraggableFlatList, ScaleDecorator, RenderItemParams, DraggableFlatList } from 'react-native-draggable-flatlist';
import DraggableFlatList, { ScaleDecorator, RenderItemParams  } from 'react-native-draggable-flatlist';
// import { DraxProvider, DraxView } from 'react-native-drax';
// import { Board, Column, } from 'react-native-dnd-board';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PRIORITIES } from '../helpers/priority';
import { Ionicons } from '@expo/vector-icons';
import MoveToModal from '../components/MoveToModal';

const { width } = Dimensions.get('window');

// const KanbanBoard = ({ userId, rawTasks, navigation }) => {
//     const [data, setData] = useState([]);

//     // Initialize data with sections for each priority
//     useEffect(() => {
//         const initializeData = () => {
//             const sections = PRIORITIES.map((priority) => ({
//                 key: priority,
//                 title: `${priority} Priority`,
//                 data: rawTasks.filter((task) => task.priority === priority),
//             }));
//             setData(sections);
//         };

//         initializeData();
//     }, [rawTasks]);

//     // Update task priority in Firestore
//     const updateTaskPriority = async (taskId, newPriority) => {
//         try {
//             const taskRef = doc(db, `tasks/${userId}/taskList`, taskId);
//             await updateDoc(taskRef, { priority: newPriority });
//             console.log(`Updated task ${taskId} to priority ${newPriority}`);
//         } catch (error) {
//             console.error('Error updating task priority:', error);
//             Alert.alert('Error', 'Failed to update task priority.');
//         }
//     };

//     // Render each task item
//     const renderItem = ({ item, drag, isActive }) => (
//         <TouchableOpacity
//             style={[
//                 styles.taskItem,
//                 { backgroundColor: isActive ? '#e0ffe0' : '#fff' },
//             ]}
//             onLongPress={drag}
//             onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: item.id })}
//         >
//             <Text style={styles.taskTitle}>{item.title}</Text>
//             <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
//             <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
//         </TouchableOpacity>
//     );

//     const handleDragEnd = (sectionKey) => ({ data: newData }) => {
//         if (!newData) return; // Prevent setting undefined data
//         setData((prevSections) =>
//             prevSections.map((section) =>
//                 section.key === sectionKey ? { ...section, data: newData } : section
//             )
//         );
//     };

//     return (
//         <ScrollView horizontal style={styles.container}>
//             {data.map((section) => (
//                 <View key={section.key} style={styles.column}>
//                     <Text style={styles.columnTitle}>{section.title}</Text>
//                     <DraggableFlatList
//                         data={section.data}
//                         keyExtractor={(item) => item.id.toString()}
//                         renderItem={renderItem}
//                         onDragEnd={handleDragEnd(section.key)}
//                         activationDistance={20}
//                         scrollEnabled={false} // Disable inner scrolling
//                     />
//                 </View>
//             ))}
//         </ScrollView>
//     );
// };
    
// export default KanbanBoard;

// const styles = StyleSheet.create({
//     container: {
//         flexDirection: 'row',
//         padding: 10,
//     },
//     column: {
//         width: width * 0.8,
//         backgroundColor: '#f0f0f0',
//         marginRight: 10,
//         borderRadius: 8,
//         padding: 10,
//     },
//     columnTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginBottom: 10,
//         textAlign: 'center',
//         color: '#333',
//     },
//     taskItem: {
//         padding: 12,
//         marginBottom: 12,
//         backgroundColor: '#fff',
//         borderRadius: 6,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowOffset: { width: 0, height: 1 },
//         shadowRadius: 2,
//         elevation: 2,
//     },
//     taskTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#333',
//     },
//     taskDetails: {
//         fontSize: 12,
//         color: '#555',
//         marginTop: 4,
//     },
// });

const COLUMN_WIDTH = 250;
const COLUMN_MARGIN = 10;

const KanbanBoard = ({ userId, rawTasks, navigation }) => {
    const [columns, setColumns] = useState(() => {
        return PRIORITIES.map(priority => ({
            key: priority,
            title: `${priority} Priority`,
            data: rawTasks.filter(task => task.priority === priority),
        }));
    });

    const [isLoading, setIsLoading] = useState(true);
    const [draggingItem, setDraggingItem] = useState(null);
    const [sourceColumnKey, setSourceColumnKey] = useState(null);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);

    useEffect(() => {
        // Initialize columns based on PRIORITIES
        const initializeColumns = () => {
            const updatedColumns = PRIORITIES.map(priority => ({
                key: priority,
                title: `${priority} Priority`,
                data: rawTasks.filter(task => task.priority === priority),
            }));
            setColumns(updatedColumns);
            setIsLoading(false);
        };

        initializeColumns();
    }, [rawTasks]);

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
        const newTargetData = [...targetColumn.data, { ...draggingItem, priority: targetColumnKey }];

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
        try {
            const taskRef = doc(db, `tasks/${userId}/taskList`, draggingItem.id);
            await updateDoc(taskRef, { priority: targetColumnKey });
            Alert.alert('Success', `Task moved to ${targetColumnKey} priority.`);
        } catch (error) {
            console.error('Error updating task priority:', error);
            Alert.alert('Error', 'Failed to update task priority.');
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

    const renderTask = useCallback(({ item, drag, isActive }) => (
        <TouchableOpacity
            style={[
                styles.taskItem,
                { backgroundColor: isActive ? '#e0ffe0' : '#fff' },
            ]}
            onLongPress={() => {
                setDraggingItem(item);
                // Find the source column
                const sourceColumn = columns.find(col => col.data.some(task => task.id === item.id));
                setSourceColumnKey(sourceColumn ? sourceColumn.key : null);
                drag();
                setTimeout(() => {
                    handleMovePress();
                }, 200);
            }}
            onPress={() => navigation.navigate('TaskDetailsScreen', { taskId: item.id })}
        >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDetails}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
            <Text style={styles.taskDetails}>Priority: {item.priority}</Text>
        </TouchableOpacity>
    ), [navigation, columns]);

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
            <Text style={styles.columnTitle}>{column.title}</Text>
            <DraggableFlatList
                data={column.data}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
                onDragEnd={({ data }) => handleDragEnd(column.key, data)}
                activationDistance={20}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        // <DraxProvider>
            // <View style={styles.container}>
            <View style={styles.container}>
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
    columnTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    dropZone: {
        minHeight: 300,
        padding: 5,
        borderRadius: 8,
    },
    receiving: {
        borderColor: '#007bff',
        borderWidth: 2,
        backgroundColor: '#d0e8ff',
    },
    draggable: {
        marginBottom: 10,
    },
    dragging: {
        opacity: 0.2,
    },
    hoverDragging: {
        borderColor: 'red',
        borderWidth: 2,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default KanbanBoard;