// import { useRef } from 'react';
// import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// TodoCard component shows details about a single to-do list:
const TodoCard = ({ task, projectName, onPress, onLongPress, onDeleteTask, showMoveButton, onMoveTask }) => {
    // Count number of subtasks and attachments
    const subtaskCount = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : 0;

    return (
        <View style={styles.card}>
            {/* Task details */}
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={onPress}
                onLongPress={onLongPress}
            >
                {/* Title */}
                <Text style={styles.title}>{task.title}</Text>
        
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
        padding: 8,
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
    },
    cardTouchable: {
        flex: 1,
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
});