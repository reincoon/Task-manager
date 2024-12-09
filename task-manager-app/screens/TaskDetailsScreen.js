import { SafeAreaView, Text, Button, StyleSheet } from 'react-native';

const TaskDetailsScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Task Details</Text>
            <Button title="Go Back" onPress={() => navigation.goBack()} />
            <Button title="Edit Task" onPress={() => console.log('Edit Task')} />
            <Button title="Delete Task" onPress={() => console.log('Delete Task')} />
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
        marginBottom: 20,
    },
});

export default TaskDetailsScreen;