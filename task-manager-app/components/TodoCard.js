// import { useRef } from 'react';
// import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateTaskStatus, toggleTaskCompletion, updateTaskStatusInFirestore } from '../helpers/subtaskCompletionHelpers';
import { useMemo } from 'react';

// TodoCard component shows details about a single to-do list:
const TodoCard = ({ 
    task, 
    projectName, 
    onPress, 
    onLongPress, 
    onDeleteTask, 
    showMoveButton, 
    onMoveTask,
    isActive = false,
    userId,
    setDraggingTask,
}) => {
    // Count number of subtasks and attachments
    const subtaskCount = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : 0;

    // Compute to-do list status
    // const status = useMemo(() => {
    //     return calculateTaskStatus(task);
    // }, [task]);
    const status = task.manuallyFinished ? 'Finished' : calculateTaskStatus(task);

    // Compute subtask progress
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
    const completedCount = task.subtasks ? task.subtasks.filter((s) => s.isCompleted).length : 0;
    const progressPercentage = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : 0;

    // Mark entire to-do list as finished
    const handleCompleteTask = async () => {
        if (!userId || !task?.id) {
            return;
        }

        try {
            await toggleTaskCompletion({
                userId,
                taskId: task.id,
                subtasks: task.subtasks || [],
                markAsComplete: true,
            });
            await updateTaskStatusInFirestore(true, userId, task.id);
            Alert.alert('Success', 'To-Do list marked as finished.');
        } catch (error) {
            console.error('Error marking task complete:', error);
            Alert.alert('Error', 'Failed to mark this list as finished.');
        }
    }

    // Undo finishing the task
    const handleUnfinishTask = async () => {
        if (!userId || !task?.id) {
            return;
        }
        try {
            await toggleTaskCompletion({
                userId,
                taskId: task.id,
                subtasks: task.subtasks || [],
                markAsComplete: false,
            });
            await updateTaskStatusInFirestore(false, userId, task.id);
            Alert.alert('Success', 'To-Do list reverted to incomplete.');
        } catch (error) {
            Alert.alert('Error', 'Failed to revert the list.');
        }
    };

    return (
        <View style={styles.card}>
            {/* Colour indicator */}
            <View style={[styles.colourIndicator, { backgroundColor: task.colour || '#95A5A6' }]} />

            {/* Task details */}
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={onPress}
                onLongPress={onLongPress}
            >
                {/* Title */}
                <Text style={styles.title}>{task.title}</Text>
        
                {/* Status */}
                <Text style={styles.details}>Status: {status}</Text>

                {/* Show completed timestamp */}
                {task.taskCompletedAt && (
                    <Text style={styles.details}>
                        Completed At: {new Date(task.taskCompletedAt).toLocaleString()}
                    </Text>
                )}
                {/* Progress bar for subtasks */}
                {subtaskCount > 0 && (
                    <>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${progressPercentage}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.details}>
                            {completedCount}/{subtaskCount} subtasks
                        </Text>
                    </>
                )}

                {/* Project name */}
                <Text style={styles.details}>Project: {projectName || 'Unassigned'}</Text>

                {/* Priority */}
                <Text style={styles.details}>Priority: {task.priority || 'Low'}</Text>
        
                {/* Due Date */}
                <Text style={styles.details}>
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A'}
                </Text>

                {/* Subtask and attachment counts */}
                <Text style={styles.details}>Subtasks: {subtaskCount}</Text>
                <Text style={styles.details}>Attachments: {attachmentCount}</Text>
            </TouchableOpacity>

            {/* Icon to mark entire list as complete, if not already finished, and revert */}
            {status !== 'Finished' ? (
                <TouchableOpacity style={styles.completeIcon} onPress={handleCompleteTask}>
                    <Ionicons name="checkmark-done-circle" size={24} color="green" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.completeIcon} onPress={handleUnfinishTask}>
                    <Ionicons name="arrow-undo-circle" size={24} color="orange" />
                </TouchableOpacity>
            )}
    
            {/* Move Button (Visible Only in Kanban View) for MoveToModal */}
            {showMoveButton && (
                <TouchableOpacity style={styles.moveButton} onPress={onMoveTask}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
            )}
            {/* Delete icon */}
            {onDeleteTask && (
                <View style={styles.footerRow}>
                    <TouchableOpacity onPress={onDeleteTask}>
                        <Ionicons name="trash-outline" size={18} color="#ff0000" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default TodoCard;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
        position: 'relative',
    },
    colourIndicator: {
        margin: 5,
        width: 10,
        height: '100%',
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
    },
    cardTouchable: {
        flex: 1,
        paddingRight: 34,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    details: {
        marginTop: 4,
        fontSize: 12,
        color: '#555',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    moveButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
    },
    completeIcon: {
        position: 'absolute',
        top: 48,
        right: 8,
        padding: 4,
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        marginTop: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#28a745',
    },
});