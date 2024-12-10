import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDateTime } from '../helpers/date';
import { Ionicons } from '@expo/vector-icons';

const SubtaskList = ({ subtasks, onEditSubtask, onDeleteSubtask }) => {
    if (subtasks.length === 0) {
        return null;
    };

    return (
        <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Subtasks</Text>
            {subtasks.map((item, index) => (
                <View key={index} style={styles.subtaskItem}>
                    <Text>{item.title} (Priority: {item.priority})</Text>
                    <Text>Due: {formatDateTime(item.dueDate)}</Text>
                    {item.reminder !== 'None' && <Text>Reminder: {item.reminder}</Text>}
                    {item.isRecurrent && <Text>Recurrent: Yes</Text>}
                    <View style={{ flexDirection: 'row', marginTop: 5 }}>
                        <TouchableOpacity style={{ marginRight: 10 }} onPress={() => onEditSubtask(index)}>
                            <Ionicons name="pencil-outline" size={20} color="blue" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDeleteSubtask(index)}>
                            <Ionicons name="trash-outline" size={20} color="red" />
                        </TouchableOpacity>
                    </View>
                </View>
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
});

export default SubtaskList;