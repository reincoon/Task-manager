import { Text, StyleSheet, SafeAreaView } from 'react-native';

const StatisticsScreen = () => {
    const tasks = [
        { id: 1, title: 'Task 1', completed: true },
        { id: 2, title: 'Task 2', completed: false },
        { id: 3, title: 'Task 3', completed: true },
    ];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Task Statistics</Text>
            <Text style={styles.stat}>Total Tasks: {totalTasks}</Text>
            <Text style={styles.stat}>Completed Tasks: {completedTasks}</Text>
            <Text style={styles.stat}>
                Completion Rate: {((completedTasks / totalTasks) * 100).toFixed(2)}%
            </Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    stat: {
        fontSize: 18,
        marginBottom: 10,
    },
});

export default StatisticsScreen;