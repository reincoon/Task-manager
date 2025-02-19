import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Button, Dimensions, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { collection, getDocs} from "firebase/firestore";
import { computeStatistics, prepareBarChartData, prepareTrendLineDataForMetric, prepareClosedSubtasksByPriority, prepareSubtasksOpenVsClosedData, prepareProjectsOpenVsClosedData } from "../helpers/statisticsHelpers";
const screenWidth = Dimensions.get("window").width;

// import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
// import { doc, getDoc } from 'firebase/firestore';
import { PRIORITIES } from '../helpers/priority';
import { getProjectsByUserId } from '../helpers/firestoreHelpers';
import { useFocusEffect } from '@react-navigation/native';
// import { SafeAreaView } from 'react-native-safe-area-context';

const TREND_OPTIONS = [
    { label: "To-Do lists Completed", value: "To-Do lists Completed" },
    { label: "Projects Completed", value: "Projects Completed" },
    { label: "Avg Project Completion Time", value: "Avg Project Completion Time" },
    { label: "Avg To-Do List Completion Time", value: "Avg To-Do List Completion Time" },
];

const StatisticsScreen = () => {
    // Loading and data states
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Filter states
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [selectedProject, setSelectedProject] = useState("All");
    const [selectedPriority, setSelectedPriority] = useState("All");
    const [selectedTrendMetric, setSelectedTrendMetric] = useState("To-Do lists Completed");
    const [selectedPieMetric, setSelectedPieMetric] = useState("To-Do Lists");

    // Statistics state
    const [stats, setStats] = useState({
        totalProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        closedTasks: 0,
        openTasks: 0,
        avgTaskCompletionTime: "0m",
        totalSubtasks: 0,
        closedSubtasks: 0,
        // avgSubtaskCompletionTime: 0,
        avgProjectCompletionTime: "0m",
    });

    // Fetch projects and tasks from Firestore on mount
    const fetchData = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const userId = user.uid;
            // Fetch projects
            const projectsSnapshot = await getDocs(collection(db, `projects/${userId}/userProjects`));
            const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);
    
            // Fetch tasks
            const tasksSnapshot = await getDocs(collection(db, `tasks/${userId}/taskList`));
            const tasksData = tasksSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Convert date strings to Date objects.
                        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                        taskCompletedAt: data.taskCompletedAt ? new Date(data.taskCompletedAt) : null,
                        subtasks: data.subtasks
                            ? data.subtasks.map(sub => ({
                                    ...sub,
                                    createdAt: sub.createdAt ? new Date(sub.createdAt) : null,
                                    completedAt: sub.completedAt ? new Date(sub.completedAt) : null,
                                }))
                            : [],
                    };
            });
            setTasks(tasksData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    // fetchData();
    // Initial fetch and refetch on focus
    useEffect(() => {
        fetchData();
    }, []);

    // Refetch data when the screen is in focus
    useFocusEffect( useCallback(() => {
        fetchData();
    }, []));

    // Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    // Recompute statistics when tasks, projects or any filter change
    useEffect(() => {
        const filters = { startDate, endDate, selectedProject, selectedPriority };
        const computedStats = computeStatistics(tasks, projects, filters);
        setStats(computedStats);
    }, [tasks, projects, startDate, endDate, selectedProject, selectedPriority]);

    // Prepare chart data
    const filters = { startDate, endDate, selectedProject, selectedPriority };
    // const pieData = [
    //     {
    //         name: "Closed",
    //         population: stats.closedTasks,
    //         color: "#2ecc71",
    //         legendFontColor: "#7F7F7F",
    //         legendFontSize: 12,
    //     },
    //     {
    //         name: "Open",
    //         population: stats.openTasks,
    //         color: "#e74c3c",
    //         legendFontColor: "#7F7F7F",
    //         legendFontSize: 12,
    //     }
    // ];
    let pieData;
    if (selectedPieMetric === "To-Do Lists") {
        pieData = [
            {
                name: "Closed",
                population: stats.closedTasks,
                color: "#2ecc71",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
            },
            {
                name: "Open",
                population: stats.openTasks,
                color: "#e74c3c",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
            },
        ];
    } else if (selectedPieMetric === "Subtasks") {
        pieData = prepareSubtasksOpenVsClosedData(tasks, filters);
    } else if (selectedPieMetric === "Projects") {
        pieData = prepareProjectsOpenVsClosedData(projects, tasks, filters);
    }
    const barData = prepareBarChartData(tasks, filters);
    // const trendData = prepareTrendLineData(tasks, filters);
    const trendData = prepareTrendLineDataForMetric(selectedTrendMetric, tasks, projects, filters);

    if (loading) {
        return <ActivityIndicator style={styles.loading} />;
    }

    return (
        // <SafeAreaView>
            <ScrollView 
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.header}>Statistics</Text>
        
                {/* Filter Section */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Start Date:</Text>
                    <Button
                        title={startDate ? startDate.toLocaleDateString() : "Select Start Date"}
                        onPress={() => setShowStartPicker(true)}
                    />
                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowStartPicker(Platform.OS === "ios");
                                if (date) setStartDate(date);
                            }}
                        />
                    )}
            
                    <Text style={styles.filterLabel}>End Date:</Text>
                    <Button
                        title={endDate ? endDate.toLocaleDateString() : "Select End Date"}
                        onPress={() => setShowEndPicker(true)}
                    />
                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowEndPicker(Platform.OS === "ios");
                                if (date) setEndDate(date);
                            }}
                        />
                    )}
            
                    <Text style={styles.filterLabel}>Project:</Text>
                    <Picker
                        selectedValue={selectedProject}
                        style={styles.picker}
                        onValueChange={(itemValue) => setSelectedProject(itemValue)}
                    >
                        <Picker.Item label="All" value="All" />
                        {projects.map(p => (
                            <Picker.Item key={p.id} label={p.name} value={p.id} />
                        ))}
                    </Picker>
            
                    <Text style={styles.filterLabel}>Priority:</Text>
                    <Picker
                        selectedValue={selectedPriority}
                        style={styles.picker}
                        onValueChange={(itemValue) => setSelectedPriority(itemValue)}
                    >
                        <Picker.Item label="All" value="All" />
                        {PRIORITIES.map(p => (
                            <Picker.Item key={p} label={p} value={p} />
                        ))}
                    </Picker>
                </View>
        
                {/* Statistics Summary */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statItem}>Total Projects: {stats.totalProjects}</Text>
                    <Text style={styles.statItem}>Completed Projects: {stats.completedProjects}</Text>
                    <Text style={styles.statItem}>
                        Average Project Completion Time: {stats.avgProjectCompletionTime}
                    </Text>
                    <Text style={styles.statItem}>Total To-Do Lists: {stats.totalTasks}</Text>
                    <Text style={styles.statItem}>Closed To-Do Lists: {stats.closedTasks}</Text>
                    <Text style={styles.statItem}>Opened To-Do Lists: {stats.openTasks}</Text>
                    <Text style={styles.statItem}>
                        Opened To-Do Lists unassigned to a project: {stats.unassignedOpenTasks}
                    </Text>
                    <Text style={styles.statItem}>
                        Average To-Do List Completion Time: {stats.avgTaskCompletionTime}
                    </Text>
                    <Text style={styles.statItem}>Total Subtasks: {stats.totalSubtasks}</Text>
                    <Text style={styles.statItem}>Closed Subtasks: {stats.closedSubtasks}</Text>
                </View>
        
                {/* Charts */}
                <Text style={styles.filterLabel}>Pie Chart Metric:</Text>
                <Picker
                    selectedValue={selectedPieMetric}
                    style={styles.picker}
                    onValueChange={(itemValue) => setSelectedPieMetric(itemValue)}
                >
                    <Picker.Item label="To-Do Lists Open vs Closed" value="To-Do Lists" />
                    <Picker.Item label="Subtasks Open vs Closed" value="Subtasks" />
                    <Picker.Item label="Projects Open vs Closed" value="Projects" />
                </Picker>

                <Text style={styles.chartTitle}>To-Do Lists: Open vs Closed</Text>
                <PieChart
                    data={pieData}
                    width={screenWidth - 20}
                    height={220}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />
{/* 
                <Text style={styles.chartTitle}>Subtasks: Open vs Closed</Text>
                <PieChart
                    data={prepareSubtasksOpenVsClosedData(tasks, filters)}
                    width={screenWidth - 20}
                    height={220}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />

                <Text style={styles.chartTitle}>Projects: Open vs Closed</Text>
                <PieChart
                    data={prepareProjectsOpenVsClosedData(projects, tasks, filters)}
                    width={screenWidth - 20}
                    height={220}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                /> */}
        
                <Text style={styles.chartTitle}>Closed To-Do Lists by Priority</Text>
                <BarChart
                    data={barData}
                    width={screenWidth - 20}
                    height={220}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    }}
                    style={styles.chart}
                />

                <Text style={styles.chartTitle}>Closed Subtasks by Priority</Text>
                <BarChart
                    data={prepareClosedSubtasksByPriority(tasks, filters)}
                    width={screenWidth - 20}
                    height={220}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    }}
                    style={styles.chart}
                />

                {/* Trend Graph Customisation */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Trend Metric:</Text>
                    <Picker
                        selectedValue={selectedTrendMetric}
                        style={styles.picker}
                        onValueChange={(itemValue) => setSelectedTrendMetric(itemValue)}
                    >
                        {TREND_OPTIONS.map((opt) => (
                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                        ))}
                    </Picker>
                </View>
                {/* Trend chart */}
                <Text style={styles.chartTitle}>Trend: {selectedTrendMetric} (Past 7 Days)</Text>
                <LineChart
                    data={trendData}
                    width={screenWidth - 20}
                    height={220}
                    yAxisSuffix={
                        selectedTrendMetric === "Avg Project Completion Time" || "Avg To-Do List Completion Time" ? "h" : ""
                    }
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0,0,255,${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                        propsForVerticalLabels: { fontSize: 10, rotation: 347 },
                    }}
                    bezier
                    style={styles.chart}
                />
            </ScrollView>
        // </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { fontSize: 24, fontWeight: "bold", marginVertical: 10, textAlign: "center" },
    filterContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
    filterLabel: { fontWeight: "bold", marginTop: 10 },
    picker: { height: 140, width: "100%" },
    statsContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
    statItem: { fontSize: 16, marginVertical: 2 },
    chartTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10, textAlign: "center" },
    chart: { marginVertical: 8, borderRadius: 8 },
});

export default StatisticsScreen;
