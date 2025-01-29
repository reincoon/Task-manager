import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDateTime } from '../helpers/date';
import { Ionicons } from '@expo/vector-icons';
import { toggleSubtaskCompletionLocal } from '../helpers/subtaskCompletionHelpers';

const SubtaskList = ({ 
    subtasks, 
    onEditSubtask, 
    onDeleteSubtask, 
    onAddSubtaskToCalendar,
    // userId,
    // taskId,
    setSubtasks,
}) => {
    if (!subtasks || subtasks.length === 0) {
        return null;
    };

    // const handleToggleCompletion = async (index) => {
    const handleToggleCompletion = async (index) => {
        try {
            // const updatedSubtasks = await toggleSubtaskCompletion({
            //     userId,
            //     taskId,
            //     subtasks,
            //     subtaskIndex: index,
            // });
            const updatedSubtasks = await toggleSubtaskCompletionLocal({ subtasks, subtaskIndex: index });
            setSubtasks(updatedSubtasks);
        } catch (error) {
            console.log('Error toggling subtask completion:', error);
        }
    };

    return (
        <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Subtasks</Text>
            {subtasks.map((item, index) => (
                <View key={index} style={styles.subtaskItem}>
                    <View style={styles.subTaskRow}>
                        <TouchableOpacity onPress={() => handleToggleCompletion(index)}>
                            {item.isCompleted ? (
                                <Ionicons name="checkbox" size={24} color={"green"} />
                            ) : (
                                <Ionicons name="checkbox-outline" size={24} color={"gray"} />
                            )}
                        </TouchableOpacity>
                        <View style={{ marginLeft: 8 }}>
                            <Text style={item.isCompleted ? styles.completedText : {}}>
                                    {item.title} (Priority: {item.priority})
                            </Text>
                            <Text
                                    style={
                                        item.isCompleted ? [styles.completedText, styles.subInfo] : styles.subInfo
                                    }
                            >
                                Due: {formatDateTime(item.dueDate)}
                            </Text>
                            <Text
                                style={
                                    item.isCompleted ? [styles.completedText, styles.subInfo] : styles.subInfo
                                }
                            >
                                Reminder: {item.reminder}
                            </Text>
                            {item.isRecurrent && (
                                <Text
                                    style={
                                        item.isCompleted ? [styles.completedText, styles.subInfo] : styles.subInfo
                                    }
                                >
                                    Recurrent: Yes
                                </Text>
                            )}
                            {/* Completion timestamp */}
                            {item.isCompleted && item.completedAt && (
                                <Text style={styles.subInfo}>
                                    Completed at: {new Date(item.completedAt).toLocaleString()}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Action row */}
                    <View style={{ flexDirection: 'row', marginTop: 5 }}>
                        <TouchableOpacity
                            style={{ marginRight: 10 }}
                            onPress={() => onEditSubtask(index)}
                        >
                            <Ionicons name="pencil-outline" size={20} color="blue" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDeleteSubtask(index)}>
                            <Ionicons name="trash-outline" size={20} color="red" />
                        </TouchableOpacity>
                        {onAddSubtaskToCalendar && (
                            <TouchableOpacity
                                style={{ marginLeft: 10 }}
                                onPress={() => onAddSubtaskToCalendar(item, index)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#007bff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                //     {/* <Text>{item.title} (Priority: {item.priority})</Text>
                //     <Text>Due: {formatDateTime(item.dueDate)}</Text>
                //     {item.reminder !== 'None' && <Text>Reminder: {item.reminder}</Text>}
                //     {item.isRecurrent && <Text>Recurrent: Yes</Text>}
                //     <View style={{ flexDirection: 'row', marginTop: 5 }}>
                //         <TouchableOpacity style={{ marginRight: 10 }} onPress={() => onEditSubtask(index)}>
                //             <Ionicons name="pencil-outline" size={20} color="blue" />
                //         </TouchableOpacity>
                //         <TouchableOpacity onPress={() => onDeleteSubtask(index)}>
                //             <Ionicons name="trash-outline" size={20} color="red" />
                //         </TouchableOpacity>
                //         {onAddSubtaskToCalendar && (
                //             <TouchableOpacity onPress={() => onAddSubtaskToCalendar(item, index)}>
                //                 <Ionicons name="calendar-outline" size={20} color="#007bff" />
                //             </TouchableOpacity>
                //         )}
                //     </View>
                // </View> */}
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    subtaskItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: 10,
    },
    subTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subInfo: {
        fontSize: 12,
        color: '#666',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
});

export default SubtaskList;