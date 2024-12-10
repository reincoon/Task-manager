import { View, Text, StyleSheet } from 'react-native';
import { formatDateTime } from '../helpers/date';

const SubtaskList = ({ subtasks }) => {
    if (subtasks.length === 0) return null;

    return (
        <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Subtasks</Text>
            {subtasks.map((item, index) => (
                <View key={index} style={styles.subtaskItem}>
                    <Text>{item.title} (Priority: {item.priority})</Text>
                    <Text>Due: {formatDateTime(item.dueDate)}</Text>
                    {item.reminder !== 'None' && <Text>Reminder: {item.reminder}</Text>}
                    {item.isRecurrent && <Text>Recurrent: Yes</Text>}
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