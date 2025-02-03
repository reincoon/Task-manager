import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
// import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { getStatistics } from '../helpers/statisticsHelpers';
// import { doc, getDoc } from 'firebase/firestore';
import { PRIORITIES } from '../helpers/priority';
import { getProjectsByUserId } from '../helpers/firestoreHelpers';

const PERIOD_OPTIONS = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

// const PRIORITY_OPTIONS = [
//     // { label: 'All', value: null },
//     { label: 'Low', value: 'Low' },
//     { label: 'Moderate', value: 'Moderate' },
//     { label: 'High', value: 'High' },
//     { label: 'Critical', value: 'Critical' },
// ];

const StatisticsScreen = () => {
    const [userId, setUserId] = useState(null);
    const [periodType, setPeriodType] = useState('weekly');
    const [priority, setPriority] = useState('Low');
    const [projectId, setProjectId] = useState(null);

    // Stats
    const [totalTasks, setTotalTasks] = useState(0);
    const [completedTasks, setCompletedTasks] = useState(0);
    const [totalSubtasks, setTotalSubtasks] = useState(0);
    const [completedSubtasks, setCompletedSubtasks] = useState(0);
    const [totalTimeSpent, setTotalTimeSpent] = useState(0);

    const [projects, setProjects] = useState([]);
    const [periodTypeOpen, setPeriodTypeOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [projectIdOpen, setProjectIdOpen] = useState(false);
    // const totalTasks = tasks.length;
    // const completedTasks = tasks.filter(task => task.completed).length;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(currentUser => {
            if (currentUser) {
                setUserId(currentUser.uid);
            } else {
                Alert.alert('Error', 'No user logged in.');
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetchProjects();
        fetchStats();
    }, [userId, periodType, priority, projectId]);

    async function fetchProjects() {
        try {
            // Fetch projects related to the user
            const response = await getProjectsByUserId(userId);
            setProjects(response);
        } catch (err) {
            Alert.alert('Error', 'Failed to load projects.');
            console.log(err);
        }
    }
    
    async function fetchStats() {
        try {
            const result = await getStatistics({ 
                userId,
                periodType,
                priority,
                projectId
            });
            setTotalTasks(result.totalTasks);
            setCompletedTasks(result.completedTasks);
            setTotalSubtasks(result.totalSubtasks);
            setCompletedSubtasks(result.completedSubtasks);
            setTotalTimeSpent(result.totalTimeSpent);
        } catch (err) {
            Alert.alert('Error', 'Failed to load statistics.');
            console.log(err);
        }
    }

    const completionRate = totalTasks > 0 
        ? ((completedTasks / totalTasks) * 100).toFixed(2) 
        : 0;

    const subtaskCompletionRate = totalSubtasks > 0
        ? ((completedSubtasks / totalSubtasks) * 100).toFixed(2)
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Task Statistics</Text>

            {/* Period Filter */}
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Period:</Text>
                {/* <Picker
                    selectedValue={periodType}
                    style={styles.picker}
                    onValueChange={(itemValue) => setPeriodType(itemValue)}
                >
                    {PERIOD_OPTIONS.map(opt => (
                        <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </Picker> */}
                <DropDownPicker
                    open={periodTypeOpen}
                    value={periodType}
                    items={PERIOD_OPTIONS}
                    setValue={setPeriodType}
                    setOpen={setPeriodTypeOpen}
                    containerStyle={styles.dropdownContainer}
                    style={styles.dropdown}
                    dropDownStyle={styles.dropdown}
                    labelStyle={styles.dropdownLabel}
                />
            </View>

            {/* Priority Filter */}
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Priority:</Text>
                {/* <Picker
                    selectedValue={priority || 'Low'}
                    style={styles.picker}
                    onValueChange={(val) => setPriority(val)}
                >
                    {PRIORITIES.map(priority => (
                        <Picker.Item key={priority} label={priority} value={priority} />
                    ))}
                </Picker> */}
                <DropDownPicker
                    open={priorityOpen}
                    value={priority}
                    items={PRIORITIES.map(priority => ({ label: priority, value: priority }))}
                    setValue={setPriority}
                    setOpen={setPriorityOpen}
                    containerStyle={styles.dropdownContainer}
                    style={styles.dropdown}
                    dropDownStyle={styles.dropdown}
                    labelStyle={styles.dropdownLabel}
                />
            </View>

            {/* Project Filter */}
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Project:</Text>
                {/* <Picker
                    selectedValue={projectId}
                    style={styles.picker}
                    onValueChange={(val) => setProjectId(val)}
                >
                    <Picker.Item label="Select a project" value={null} />
                    {projects.map(proj => (
                        <Picker.Item key={proj.id} label={proj.name} value={proj.id} />
                    ))}
                </Picker> */}
                <DropDownPicker
                    open={projectIdOpen}
                    value={projectId}
                    items={[
                        { label: 'Select a project', value: null },
                        ...projects.map(proj => ({ label: proj.name, value: proj.id }))
                    ]}
                    setValue={setProjectId}
                    setOpen={setProjectIdOpen}
                    containerStyle={styles.dropdownContainer}
                    style={styles.dropdown}
                    dropDownStyle={styles.dropdown}
                    labelStyle={styles.dropdownLabel}
                />
            </View>

            {/* Stats Section */}
            <Text style={styles.stat}>Total Tasks: {totalTasks}</Text>
            <Text style={styles.stat}>Completed Tasks: {completedTasks}</Text>
            <Text style={styles.stat}>Task Completion Rate: {completionRate}%</Text>

            <Text style={styles.stat}>Total Subtasks: {totalSubtasks}</Text>
            <Text style={styles.stat}>Completed Subtasks: {completedSubtasks}</Text>
            <Text style={styles.stat}>Subtask Completion Rate: {subtaskCompletionRate}%</Text>
            <Text style={styles.stat}>Time Spent: {totalTimeSpent}</Text>

            {/* Placeholder for a chart or graph */}
            <View style={styles.chartPlaceholder}>
                <Text style={{textAlign: 'center', color: '#999'}}>
                    [ Chart / Graph Goes Here ]
                </Text>
            </View>
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
        textAlign: 'center'
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    filterLabel: {
        fontSize: 16,
        marginRight: 8,
    },
    dropdown: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
    },
    dropdownContainer: {
        flex: 1,
        zIndex: 10,
    },
    dropdownLabel: {
        fontSize: 16,
        color: '#333',
    },
    stat: {
        fontSize: 16,
        marginVertical: 5,
    },
    chartPlaceholder: {
        marginTop: 30,
        height: 150,
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 8,
        justifyContent: 'center',
    },
});

export default StatisticsScreen;