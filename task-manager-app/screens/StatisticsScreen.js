import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Button, Dimensions, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { collection, getDocs } from "firebase/firestore";
import { computeStatistics, prepareBarChartData, prepareTrendLineData } from "../helpers/statisticsHelpers";
const screenWidth = Dimensions.get("window").width;

// import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { getStatistics } from '../helpers/statisticsHelpers';
// import { doc, getDoc } from 'firebase/firestore';
import { PRIORITIES } from '../helpers/priority';
import { getProjectsByUserId } from '../helpers/firestoreHelpers';
import { useFocusEffect } from '@react-navigation/native';

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

// const StatisticsScreen = () => {
//     const [userId, setUserId] = useState(null);
//     const [periodType, setPeriodType] = useState('weekly');
//     const [priority, setPriority] = useState('Low');
//     const [projectId, setProjectId] = useState(null);

//     // Stats
//     const [totalTasks, setTotalTasks] = useState(0);
//     const [completedTasks, setCompletedTasks] = useState(0);
//     const [totalSubtasks, setTotalSubtasks] = useState(0);
//     const [completedSubtasks, setCompletedSubtasks] = useState(0);
//     const [totalTimeSpent, setTotalTimeSpent] = useState(0);

//     const [projects, setProjects] = useState([]);
//     const [periodTypeOpen, setPeriodTypeOpen] = useState(false);
//     const [priorityOpen, setPriorityOpen] = useState(false);
//     const [projectIdOpen, setProjectIdOpen] = useState(false);
//     // const totalTasks = tasks.length;
//     // const completedTasks = tasks.filter(task => task.completed).length;

//     useEffect(() => {
//         const unsubscribe = auth.onAuthStateChanged(currentUser => {
//             if (currentUser) {
//                 setUserId(currentUser.uid);
//             } else {
//                 Alert.alert('Error', 'No user logged in.');
//             }
//         });
//         return () => unsubscribe();
//     }, []);

//     useEffect(() => {
//         if (!userId) return;
//         fetchProjects();
//         fetchStats();
//     }, [userId, periodType, priority, projectId]);

//     async function fetchProjects() {
//         try {
//             // Fetch projects related to the user
//             const response = await getProjectsByUserId(userId);
//             setProjects(response);
//         } catch (err) {
//             Alert.alert('Error', 'Failed to load projects.');
//             console.log(err);
//         }
//     }
    
//     async function fetchStats() {
//         try {
//             const result = await getStatistics({ 
//                 userId,
//                 periodType,
//                 priority,
//                 projectId
//             });
//             setTotalTasks(result.totalTasks);
//             setCompletedTasks(result.completedTasks);
//             setTotalSubtasks(result.totalSubtasks);
//             setCompletedSubtasks(result.completedSubtasks);
//             setTotalTimeSpent(result.totalTimeSpent);
//         } catch (err) {
//             Alert.alert('Error', 'Failed to load statistics.');
//             console.log(err);
//         }
//     }

//     const completionRate = totalTasks > 0 
//         ? ((completedTasks / totalTasks) * 100).toFixed(2) 
//         : 0;

//     const subtaskCompletionRate = totalSubtasks > 0
//         ? ((completedSubtasks / totalSubtasks) * 100).toFixed(2)
//         : 0;

//     return (
//         <SafeAreaView style={styles.container}>
//             <Text style={styles.title}>Task Statistics</Text>

//             {/* Period Filter */}
//             <View style={styles.filterRow}>
//                 <Text style={styles.filterLabel}>Period:</Text>
//                 {/* <Picker
//                     selectedValue={periodType}
//                     style={styles.picker}
//                     onValueChange={(itemValue) => setPeriodType(itemValue)}
//                 >
//                     {PERIOD_OPTIONS.map(opt => (
//                         <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
//                     ))}
//                 </Picker> */}
//                 <DropDownPicker
//                     open={periodTypeOpen}
//                     value={periodType}
//                     items={PERIOD_OPTIONS}
//                     setValue={setPeriodType}
//                     setOpen={setPeriodTypeOpen}
//                     containerStyle={styles.dropdownContainer}
//                     style={styles.dropdown}
//                     dropDownStyle={styles.dropdown}
//                     labelStyle={styles.dropdownLabel}
//                 />
//             </View>

//             {/* Priority Filter */}
//             <View style={styles.filterRow}>
//                 <Text style={styles.filterLabel}>Priority:</Text>
//                 {/* <Picker
//                     selectedValue={priority || 'Low'}
//                     style={styles.picker}
//                     onValueChange={(val) => setPriority(val)}
//                 >
//                     {PRIORITIES.map(priority => (
//                         <Picker.Item key={priority} label={priority} value={priority} />
//                     ))}
//                 </Picker> */}
//                 <DropDownPicker
//                     open={priorityOpen}
//                     value={priority}
//                     items={PRIORITIES.map(priority => ({ label: priority, value: priority }))}
//                     setValue={setPriority}
//                     setOpen={setPriorityOpen}
//                     containerStyle={styles.dropdownContainer}
//                     style={styles.dropdown}
//                     dropDownStyle={styles.dropdown}
//                     labelStyle={styles.dropdownLabel}
//                 />
//             </View>

//             {/* Project Filter */}
//             <View style={styles.filterRow}>
//                 <Text style={styles.filterLabel}>Project:</Text>
//                 {/* <Picker
//                     selectedValue={projectId}
//                     style={styles.picker}
//                     onValueChange={(val) => setProjectId(val)}
//                 >
//                     <Picker.Item label="Select a project" value={null} />
//                     {projects.map(proj => (
//                         <Picker.Item key={proj.id} label={proj.name} value={proj.id} />
//                     ))}
//                 </Picker> */}
//                 <DropDownPicker
//                     open={projectIdOpen}
//                     value={projectId}
//                     items={[
//                         { label: 'Select a project', value: null },
//                         ...projects.map(proj => ({ label: proj.name, value: proj.id }))
//                     ]}
//                     setValue={setProjectId}
//                     setOpen={setProjectIdOpen}
//                     containerStyle={styles.dropdownContainer}
//                     style={styles.dropdown}
//                     dropDownStyle={styles.dropdown}
//                     labelStyle={styles.dropdownLabel}
//                 />
//             </View>

//             {/* Stats Section */}
//             <Text style={styles.stat}>Total Tasks: {totalTasks}</Text>
//             <Text style={styles.stat}>Completed Tasks: {completedTasks}</Text>
//             <Text style={styles.stat}>Task Completion Rate: {completionRate}%</Text>

//             <Text style={styles.stat}>Total Subtasks: {totalSubtasks}</Text>
//             <Text style={styles.stat}>Completed Subtasks: {completedSubtasks}</Text>
//             <Text style={styles.stat}>Subtask Completion Rate: {subtaskCompletionRate}%</Text>
//             <Text style={styles.stat}>Time Spent: {totalTimeSpent}</Text>

//             {/* Placeholder for a chart or graph */}
//             <View style={styles.chartPlaceholder}>
//                 <Text style={{textAlign: 'center', color: '#999'}}>
//                     [ Chart / Graph Goes Here ]
//                 </Text>
//             </View>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: 20,
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//         textAlign: 'center'
//     },
//     filterRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 10,
//         marginTop: 10,
//     },
//     filterLabel: {
//         fontSize: 16,
//         marginRight: 8,
//     },
//     dropdown: {
//         flex: 1,
//         height: 40,
//         borderColor: '#ccc',
//         borderWidth: 1,
//         borderRadius: 4,
//         padding: 10,
//     },
//     dropdownContainer: {
//         flex: 1,
//         zIndex: 10,
//     },
//     dropdownLabel: {
//         fontSize: 16,
//         color: '#333',
//     },
//     stat: {
//         fontSize: 16,
//         marginVertical: 5,
//     },
//     chartPlaceholder: {
//         marginTop: 30,
//         height: 150,
//         borderWidth: 1,
//         borderColor: '#aaa',
//         borderRadius: 8,
//         justifyContent: 'center',
//     },
// });

// export default StatisticsScreen;

// State for loading and data
// const [loading, setLoading] = useState(true);
// const [projects, setProjects] = useState([]);
// const [tasks, setTasks] = useState([]);

// // Filter states
// const [startDate, setStartDate] = useState(null);
// const [endDate, setEndDate] = useState(null);
// const [showStartPicker, setShowStartPicker] = useState(false);
// const [showEndPicker, setShowEndPicker] = useState(false);
// const [selectedProject, setSelectedProject] = useState("All");
// const [selectedPriority, setSelectedPriority] = useState("All");

// // Computed statistics
// const [stats, setStats] = useState({
//     totalProjects: 0,
//     totalTasks: 0,
//     closedTasks: 0,
//     openTasks: 0,
//     avgCompletionTime: 0,
//     totalSubtasks: 0,
//     closedSubtasks: 0,
// });

// // Load projects and tasks from Firestore
// useEffect(() => {
//   const fetchData = async () => {
//     try {
//         const user = auth.currentUser;
//         if (!user) return;
//         const userId = user.uid;
//         // Fetch projects (assumes projects are stored under: projects/{userId}/userProjects)
//         const projectsSnapshot = await getDocs(collection(db, `projects/${userId}/userProjects`));
//         const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setProjects(projectsData);

//         // Fetch tasks (assumes tasks are stored under: tasks/{userId}/taskList)
//         const tasksSnapshot = await getDocs(collection(db, `tasks/${userId}/taskList`));
//         const tasksData = tasksSnapshot.docs.map(doc => {
//           const data = doc.data();
//           return {
//             id: doc.id,
//             ...data,
//             // Convert date strings to Date objects.
//             createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//             taskCompletedAt: data.taskCompletedAt ? new Date(data.taskCompletedAt) : null,
//             subtasks: data.subtasks
//               ? data.subtasks.map(sub => ({
//                   ...sub,
//                   completedAt: sub.completedAt ? new Date(sub.completedAt) : null,
//                 }))
//               : [],
//           };
//         });
//         setTasks(tasksData);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

// // Recompute statistics when tasks or filters change
// useEffect(() => {
//     const filters = { startDate, endDate, selectedProject, selectedPriority };
//     const computedStats = computeStatistics(tasks, projects, filters);
//     setStats(computedStats);
//   }, [tasks, projects, startDate, endDate, selectedProject, selectedPriority]);
// // Prepare chart data
// const filters = { startDate, endDate, selectedProject, selectedPriority };
// // Pie chart data: closed vs. open tasks
// const pieData = [
//   {
//     name: "Closed",
//     population: stats.closedTasks,
//     color: "#2ecc71",
//     legendFontColor: "#7F7F7F",
//     legendFontSize: 12,
//   },
//   {
//     name: "Open",
//     population: stats.openTasks,
//     color: "#e74c3c",
//     legendFontColor: "#7F7F7F",
//     legendFontSize: 12,
//   },
// ];

// // Bar chart data: number of completed tasks per priority
// // const priorities = ["Low", "Medium", "High"];
// const barData = prepareBarChartData(tasks, filters);
// // const barData = {
// //   labels: priorities,
// //   datasets: [
// //     {
// //       data: priorities.map((p) =>
// //         tasks.filter((task) => {
// //           // apply the same filters as above
// //           if (startDate && task.createdAt < startDate) return false;
// //           if (endDate && task.createdAt > endDate) return false;
// //           if (selectedProject !== "All" && task.projectId !== selectedProject)
// //             return false;
// //           if (selectedPriority !== "All" && task.priority !== selectedPriority)
// //             return false;
// //           return task.priority === p && task.taskCompletedAt != null;
// //         }).length
// //       ),
// //     },
// //   ],
// // };

// if (loading) {
//   return <ActivityIndicator style={styles.loading} />;
// }

// return (
//   <ScrollView style={styles.container}>
//     <Text style={styles.header}>Statistics</Text>

//     {/* Filters */}
//     <View style={styles.filterContainer}>
//       <Text style={styles.filterLabel}>Start Date:</Text>
//       <Button
//         title={startDate ? startDate.toLocaleDateString() : "Select Start Date"}
//         onPress={() => setShowStartPicker(true)}
//       />
//       {showStartPicker && (
//         <DateTimePicker
//           value={startDate || new Date()}
//           mode="date"
//           display="default"
//           onChange={(event, date) => {
//             setShowStartPicker(Platform.OS === "ios");
//             if (date) {
//               setStartDate(date);
//             }
//           }}
//         />
//       )}

//       <Text style={styles.filterLabel}>End Date:</Text>
//       <Button
//         title={endDate ? endDate.toLocaleDateString() : "Select End Date"}
//         onPress={() => setShowEndPicker(true)}
//       />
//       {showEndPicker && (
//         <DateTimePicker
//           value={endDate || new Date()}
//           mode="date"
//           display="default"
//           onChange={(event, date) => {
//             setShowEndPicker(Platform.OS === "ios");
//             if (date) {
//               setEndDate(date);
//             }
//           }}
//         />
//       )}

//       <Text style={styles.filterLabel}>Project:</Text>
//       <Picker
//         selectedValue={selectedProject}
//         style={styles.picker}
//         onValueChange={(itemValue) => setSelectedProject(itemValue)}
//       >
//         <Picker.Item label="All" value="All" />
//         {projects.map((p) => (
//           <Picker.Item key={p.id} label={p.name} value={p.id} />
//         ))}
//       </Picker>

//       <Text style={styles.filterLabel}>Priority:</Text>
//       <Picker
//         selectedValue={selectedPriority}
//         style={styles.picker}
//         onValueChange={(itemValue) => setSelectedPriority(itemValue)}
//       >
//         <Picker.Item label="All" value="All" />
//         {priorities.map((p) => (
//           <Picker.Item key={p} label={p} value={p} />
//         ))}
//       </Picker>
//     </View>

//     {/* Statistics Summary */}
//     <View style={styles.statsContainer}>
//       <Text style={styles.statItem}>Total Projects: {stats.totalProjects}</Text>
//       <Text style={styles.statItem}>Total To-Do Lists: {stats.totalTasks}</Text>
//       <Text style={styles.statItem}>Closed To-Do Lists: {stats.closedTasks}</Text>
//       <Text style={styles.statItem}>Open To-Do Lists: {stats.openTasks}</Text>
//       <Text style={styles.statItem}>
//         Avg Completion Time (hrs): {stats.avgCompletionTime}
//       </Text>
//       <Text style={styles.statItem}>
//         Total Subtasks: {stats.totalSubtasks}
//       </Text>
//       <Text style={styles.statItem}>
//         Closed Subtasks: {stats.closedSubtasks}
//       </Text>
//     </View>

//     {/* Pie Chart: Open vs Closed To-Do Lists */}
//     <Text style={styles.chartTitle}>To-Do Lists: Open vs Closed</Text>
//     <PieChart
//       data={pieData}
//       width={screenWidth - 20}
//       height={220}
//       chartConfig={{
//         backgroundColor: "#fff",
//         backgroundGradientFrom: "#fff",
//         backgroundGradientTo: "#fff",
//         decimalPlaces: 0,
//         color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//       }}
//       accessor="population"
//       backgroundColor="transparent"
//       paddingLeft="15"
//       absolute
//     />

//     {/* Bar Chart: Closed To-Do Lists by Priority */}
//     <Text style={styles.chartTitle}>Closed To-Do Lists by Priority</Text>
//     <BarChart
//       data={barData}
//       width={screenWidth - 20}
//       height={220}
//       chartConfig={{
//         backgroundColor: "#fff",
//         backgroundGradientFrom: "#fff",
//         backgroundGradientTo: "#fff",
//         decimalPlaces: 0,
//         color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//         labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//       }}
//       style={styles.chart}
//     />
//   </ScrollView>
// );
// };

// const styles = StyleSheet.create({
// container: {
//   flex: 1,
//   padding: 10,
//   backgroundColor: "#f5f5f5",
// },
// loading: {
//   flex: 1,
//   justifyContent: "center",
//   alignItems: "center",
// },
// header: {
//   fontSize: 24,
//   fontWeight: "bold",
//   marginVertical: 10,
//   textAlign: "center",
// },
// filterContainer: {
//   backgroundColor: "#fff",
//   padding: 10,
//   borderRadius: 8,
//   marginBottom: 10,
// },
// filterLabel: {
//   fontWeight: "bold",
//   marginTop: 10,
// },
// picker: {
//   height: 40,
//   width: "100%",
// },
// statsContainer: {
//   backgroundColor: "#fff",
//   padding: 10,
//   borderRadius: 8,
//   marginBottom: 10,
// },
// statItem: {
//   fontSize: 16,
//   marginVertical: 2,
// },
// chartTitle: {
//   fontSize: 18,
//   fontWeight: "bold",
//   marginVertical: 10,
//   textAlign: "center",
// },
// chart: {
//   marginVertical: 8,
//   borderRadius: 8,
// },
// });

// export default StatisticsScreen;

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

    // Statistics state
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        closedTasks: 0,
        openTasks: 0,
        avgTaskCompletionTime: 0,
        avgSubtaskCompletionTime: 0,
        totalSubtasks: 0,
        closedSubtasks: 0,
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
    
            // Fetch tasks (assumes tasks are stored under: tasks/{userId}/taskList)
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
    fetchData();

    // Refetch data when the screen is in focus
    useFocusEffect( useCallback(() => {
        fetchData();
    }, []));

    // Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    // Recompute statistics when tasks or any filter changes
    useEffect(() => {
        const filters = { startDate, endDate, selectedProject, selectedPriority };
        const computedStats = computeStatistics(tasks, projects, filters);
        setStats(computedStats);
    }, [tasks, projects, startDate, endDate, selectedProject, selectedPriority]);

    // Prepare chart data
    const filters = { startDate, endDate, selectedProject, selectedPriority };
    const pieData = [
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
        }
    ];
    const barData = prepareBarChartData(tasks, filters);
    const trendData = prepareTrendLineData(tasks, filters);

    if (loading) {
        return <ActivityIndicator style={styles.loading} />;
    }

    return (
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
                <Text style={styles.statItem}>Total To-Do Lists: {stats.totalTasks}</Text>
                <Text style={styles.statItem}>Closed To-Do Lists: {stats.closedTasks}</Text>
                <Text style={styles.statItem}>Open To-Do Lists: {stats.openTasks}</Text>
                <Text style={styles.statItem}>
                    Avg Completion Time (hrs): {stats.avgTaskCompletionTime}
                </Text>
                <Text style={styles.statItem}>
                    Avg Subtask Completion Time (hrs): {stats.avgSubtaskCompletionTime}
                </Text>
                <Text style={styles.statItem}>Total Subtasks: {stats.totalSubtasks}</Text>
                <Text style={styles.statItem}>Closed Subtasks: {stats.closedSubtasks}</Text>
            </View>
    
            {/* Charts */}
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

            <Text style={styles.chartTitle}>Trend: Tasks Completed (Past 7 Days)</Text>
            <LineChart
                data={trendData}
                width={screenWidth - 20}
                height={220}
                chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0,0,255,${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                }}
                bezier
                style={styles.chart}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { fontSize: 24, fontWeight: "bold", marginVertical: 10, textAlign: "center" },
    filterContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
    filterLabel: { fontWeight: "bold", marginTop: 10 },
    picker: { height: 40, width: "100%" },
    statsContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
    statItem: { fontSize: 16, marginVertical: 2 },
    chartTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10, textAlign: "center" },
    chart: { marginVertical: 8, borderRadius: 8 },
});

export default StatisticsScreen;
