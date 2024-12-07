import { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, StyleSheet } from 'react-native';

const TaskCreationScreen = ({ navigation }) => {
    const [taskTitle, setTaskTitle] = useState('');

    const handleSaveTask = () => {
        console.log('Task saved:', taskTitle);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Create Task</Text>
            <TextInput
                style={styles.input}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Task Title"
            />
            <Button title="Save Task" onPress={handleSaveTask} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
    },
});

export default TaskCreationScreen;