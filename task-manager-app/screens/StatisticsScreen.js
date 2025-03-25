import { View, SafeAreaView, ScrollView, ActivityIndicator, Platform, Dimensions, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { collection, getDocs} from "firebase/firestore";
import { computeStatistics, prepareBarChartData, prepareTrendLineDataForMetric, prepareClosedSubtasksByPriority, prepareSubtasksOpenVsClosedData, prepareProjectsOpenVsClosedData } from "../helpers/statisticsHelpers";
import { TREND_OPTIONS } from '../helpers/constants';
import { db, auth } from '../firebaseConfig';
import { PRIORITIES } from '../helpers/priority';
import { useFocusEffect } from '@react-navigation/native';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import SettingsStatsHeader from '../components/SettingsStatsHeader';
import ThemedText from '../components/ThemedText';
import ActionButton from '../components/ActionButton';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import RNDatePicker from '../components/RNDatePicker';

const screenWidth = Dimensions.get("window").width;

export default function StatisticsScreen() {
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
    // const [selectedProject, setSelectedProject] = useState("All");
    // const [selectedPriority, setSelectedPriority] = useState("All");
    // const [selectedTrendMetric, setSelectedTrendMetric] = useState("To-Do lists Completed");
    // const [selectedPieMetric, setSelectedPieMetric] = useState("To-Do Lists");

    // For project dropdown
    const [openProjectDropdown, setOpenProjectDropdown] = useState(false);
    const [selectedProject, setSelectedProject] = useState('All');
    const [projectItems, setProjectItems] = useState([{ label: 'All', value: 'All' }]);

    // Priority filter with segmented control
    const [priorityIndex, setPriorityIndex] = useState(0);
    const prioritySegments = ['All', ...PRIORITIES];

    // Pie metric with segmented control
    const [pieIndex, setPieIndex] = useState(0);
    const pieSegments = ['To-Do Lists', 'Subtasks', 'Projects'];

    // Trend metric with segmented control
    const [trendIndex, setTrendIndex] = useState(0);

    const { isDarkMode, fontScale } = useTheme();

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
        avgProjectCompletionTime: "0m",
        unassignedOpenTasks: 0,
    });

    const selectedPriority = prioritySegments[priorityIndex];
    const selectedPieMetric = pieSegments[pieIndex];
    const selectedTrendMetric = TREND_OPTIONS[trendIndex].value;

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
    
    let pieData;
    if (selectedPieMetric === "To-Do Lists") {
        pieData = [
            {
                name: "Closed",
                population: stats.closedTasks,
                color: theme.colors.mint,
                legendFontColor: theme.colors.textSecondary,
                legendFontSize: theme.fontSize.xs,
            },
            {
                name: "Open",
                population: stats.openTasks,
                color: theme.colors.darkCinnabar,
                legendFontColor: theme.colors.textSecondary,
                legendFontSize: theme.fontSize.xs,
            },
        ];
    } else if (selectedPieMetric === "Subtasks") {
        pieData = prepareSubtasksOpenVsClosedData(tasks, filters);
    } else if (selectedPieMetric === "Projects") {
        pieData = prepareProjectsOpenVsClosedData(projects, tasks, filters);
    }
    const barData = prepareBarChartData(tasks, filters);
    const trendData = prepareTrendLineDataForMetric(selectedTrendMetric, tasks, projects, filters);
    const closedSubtasksByPriority = prepareClosedSubtasksByPriority(tasks, filters);

    // Pie chart config
    const pieChartConfig = {
        backgroundGradientFrom: isDarkMode ? theme.colors.darkBg : theme.colors.sky,
        backgroundGradientTo: isDarkMode ? theme.colors.darkEvergreen : theme.colors.white,
        color: (opacity = 1) => {
            return isDarkMode
                ? `rgba(229,229,229,${opacity})`
                : `rgba(33,37,41,${opacity})`;
        },
        labelColor: (opacity = 1) => {
            return isDarkMode
                ? `rgba(229,229,229,${opacity})`
                : `rgba(33,37,41,${opacity})`;
        },
        style: { borderRadius: 8 },
    };

    // Bar chart config
    const barChartConfig = {
        backgroundGradientFrom: isDarkMode ? theme.colors.darkBg : theme.colors.white,
        backgroundGradientTo: isDarkMode ? theme.colors.darkSky : theme.colors.mint,
        decimalPlaces: 0,
        color: (opacity = 1) => {
            return isDarkMode
                ? `rgba(229,229,229,${opacity})`
                : `rgba(33,37,41,${opacity})`;
        },
        labelColor: (opacity = 1) => {
            return isDarkMode
                ? `rgba(229,229,229,${opacity})`
                : `rgba(33,37,41,${opacity})`;
        },
        fillShadowGradient: isDarkMode ? theme.colors.darkMint : theme.colors.forest,
        fillShadowGradientOpacity: 1,
        style: { borderRadius: 8 },
        propsForVerticalLabels: {
          fontSize: Math.max(theme.fontSize.xs * fontScale, 10),
        },
        propsForHorizontalLabels: {
          fontSize: theme.fontSize.xs * fontScale,
        },
    };

    // Trend line chart config
    const trendChartConfig = {
        backgroundGradientFrom: isDarkMode ? theme.colors.darkMagenta : theme.colors.violet,
        backgroundGradientTo: isDarkMode ? theme.colors.darkBg : theme.colors.light,
        decimalPlaces: 0,
        color: (opacity = 1) => {
            return isDarkMode
                ? `rgba(229,229,229,${opacity})`
                : `rgba(33,37,41,${opacity})`;
        },
        labelColor: (opacity = 1) => {
            return isDarkMode
                ? `rgba(229,229,229,${opacity})`
                : `rgba(33,37,41,${opacity})`;
        },
        style: { borderRadius: 8 },
            propsForVerticalLabels: {
            fontSize: Math.max(theme.fontSize.xs * fontScale, 10),
            rotation: -25,
            yOffset: 5,
            xOffset: 5,
        },
        propsForHorizontalLabels: {
            fontSize: theme.fontSize.xs * fontScale,
        },
    };
    
    if (loading) {
        return (
            <SafeAreaView style={tw`${isDarkMode ? 'bg-darkBg' : 'bg-light'} flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color={theme.colors.sky} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`${isDarkMode ? 'bg-darkBg' : 'bg-light'} flex-1 p-10`}>
            {/* Header */}
            <SettingsStatsHeader title="Statistics" icon="stats-chart-outline" />
            {/* Scroll container */}
            <ScrollView 
                style={tw`flex-1 p-4`}
                indicatorStyle={isDarkMode ? 'white' : 'black'}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >        
                {/* Filter Section */}
                <View style={tw`p-4 rounded-xl shadow mb-4 ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="xl2" style={tw`font-bold mb-3 text-center`}>
                        Filters
                    </ThemedText>
                    {/* Start date */}
                    <View style={tw`flex-row justify-between mb-4`}>
                        {/* Start Date */}
                        <View style={tw`w-[48%]`}>
                            <ThemedText variant="sm" style={tw`mb-1`}>Start Date:</ThemedText>
                            {/* <ActionButton
                                title={startDate ? startDate.toLocaleDateString() : 'Select Start Date'}
                                onPress={() => setShowStartPicker(true)}
                                bgColor={isDarkMode ? theme.colors.darkMint : theme.colors.mint}
                                shadowColor={theme.colors.forest}
                                textColor={theme.colors.textPrimary}
                                iconName="calendar-outline"
                                width="100%"
                            />
                            {showStartPicker && (
                                <DateTimePicker
                                    value={startDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowStartPicker(false);
                                        if (date) setStartDate(date);
                                    }}
                                    style={tw`mt-2 mx-3`}
                                />
                            )} */}
                            <RNDatePicker
                                date={startDate}
                                onConfirm={(selected) => setStartDate(selected)}
                                label="Select Start Date"
                                buttonWidth="100%"
                                mode="date"
                            />
                        </View>
                        {/* End date */}
                        <View style={tw`w-[48%]`}>
                            <ThemedText variant="sm" style={tw`mb-1`}>
                                End Date:
                            </ThemedText>
                            {/* <ActionButton
                                title={endDate ? endDate.toLocaleDateString() : 'Select End Date'}
                                onPress={() => setShowEndPicker(true)}
                                bgColor={isDarkMode ? theme.colors.darkSky : theme.colors.sky}
                                shadowColor={theme.colors.forest}
                                textColor={theme.colors.textPrimary}
                                iconName="calendar-outline"
                                width="100%"
                            />
                            {showEndPicker && (
                                <DateTimePicker
                                    value={endDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowEndPicker(false);
                                        if (date) setEndDate(date);
                                    }}
                                    style={tw`mt-2 mx-3`}
                                />
                            )} */}
                            <RNDatePicker
                                date={endDate}
                                onConfirm={(selected) => setEndDate(selected)}
                                label="Select End Date"
                                buttonWidth="100%"
                                mode="date"
                                bgColor={isDarkMode ? theme.colors.darkSky : theme.colors.sky}
                            />
                        </View>
                    </View>
                    {/* Project dropdown */}
                    <View style={tw`mb-4`}>
                        <ThemedText variant="sm" style={tw`mb-1`}>
                            Select Project:
                        </ThemedText>
                        <DropDownPicker
                            open={openProjectDropdown}
                            value={selectedProject}
                            items={projectItems}
                            setOpen={setOpenProjectDropdown}
                            setValue={setSelectedProject}
                            setItems={setProjectItems}
                            listMode="SCROLLVIEW"
                            nestedScrollEnabled={true}
                            style={tw`${isDarkMode ? theme.colors.textSecondary : theme.colors.white}`}
                            dropDownContainerStyle={tw`${isDarkMode ? theme.colors.textSecondary : theme.colors.white}`}
                            placeholder="Select a Project"
                            textStyle={{
                                fontSize: theme.fontSize.base * fontScale,
                                color: theme.colors.textPrimary,
                            }}
                            listItemLabelStyle={{
                                color: theme.colors.textPrimary,
                            }}
                        />
                    </View>
                    {/* Priority Filter (Segmented Control) */}
                    <ThemedText variant="sm" style={tw`mb-1`}>
                        Priority Filter:
                    </ThemedText>
                    <SegmentedControl
                        values={prioritySegments}
                        selectedIndex={priorityIndex}
                        onChange={event => {
                            setPriorityIndex(event.nativeEvent.selectedSegmentIndex);
                        }}
                        style={tw`mt-2`}
                        backgroundColor={isDarkMode ? '#444444' : '#DDDDDD'}
                        tintColor={theme.colors.forest}
                        fontStyle={{ color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary }}
                        activeFontStyle={{ color: theme.colors.darkTextPrimary, fontWeight: 'bold' }}
                        appearance="light"
                    />
                </View>

                {/* Filter buttons
                <View style={tw`p-4 rounded-xl mb-4 shadow ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="lg" style={tw`font-bold mb-2 text-center`}>
                        Project Filter
                    </ThemedText>
                    <View style={tw`flex-row flex-wrap`}>
                        <ActionButton
                            title="All"
                            onPress={() => setSelectedProject('All')}
                            bgColor={selectedProject === 'All' ? theme.colors.darkMint : theme.colors.mint}
                            shadowColor={theme.colors.forest}
                            textColor={theme.colors.textPrimary}
                            width="30%"
                        />
                        {projects.map(p => (
                            <ActionButton
                                key={p.id}
                                title={p.name}
                                onPress={() => setSelectedProject(p.id)}
                                bgColor={selectedProject === p.id ? theme.colors.darkSky : theme.colors.sky}
                                shadowColor={theme.colors.forest}
                                textColor={theme.colors.textPrimary}
                                width="30%"
                            />
                        ))}
                    </View>

                    <ThemedText variant="lg" style={tw`font-bold mt-4 mb-2 text-center`}>
                        Priority Filter
                    </ThemedText>
                    <View style={tw`flex-row flex-wrap`}>
                        <ActionButton
                            title="All"
                            onPress={() => setSelectedPriority('All')}
                            bgColor={selectedPriority === 'All' ? theme.colors.darkMint : theme.colors.mint}
                            shadowColor={theme.colors.forest}
                            textColor={theme.colors.textPrimary}
                            width="30%"
                        />
                        {PRIORITIES.map(pr => (
                            <ActionButton
                                key={pr}
                                title={pr}
                                onPress={() => setSelectedPriority(pr)}
                                bgColor={selectedPriority === pr ? theme.colors.darkForest : theme.colors.forest}
                                shadowColor={theme.colors.forest}
                                textColor={theme.colors.textPrimary}
                                width="30%"
                            />
                        ))}
                    </View>
                </View> */}

        
{/*             
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
                </View> */}
        
                {/* Statistics Summary */}
                {/* <View style={tw`px-2 rounded-xl mb-4 shadow ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="xl" style={tw`font-bold mb-3 text-center`}>Summary</ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>Total Projects: {stats.totalProjects}</ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>Completed Projects: {stats.completedProjects}</ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>
                        Average Project Completion Time: {stats.avgProjectCompletionTime}
                    </ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>Total To-Do Lists: {stats.totalTasks}</ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>Closed To-Do Lists: {stats.closedTasks}</ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>Opened To-Do Lists: {stats.openTasks}</ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>
                        Opened To-Do Lists unassigned to a project: {stats.unassignedOpenTasks}
                    </ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>
                        Average To-Do List Completion Time: {stats.avgTaskCompletionTime}
                    </ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>Total Subtasks: {stats.totalSubtasks}</ThemedText>
                    <ThemedText variant="lg" style={tw`my-2`}>Closed Subtasks: {stats.closedSubtasks}</ThemedText>
                </View> */}
                <View style={tw`p-4 rounded-xl shadow mb-4 ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="xl" style={tw`font-bold mb-3 text-center`}>
                        Summary
                    </ThemedText>

                    {/* Table */}
                    {[
                        ['Total Projects', stats.totalProjects],
                        ['Completed Projects', stats.completedProjects],
                        ['Average Project Completion Time', stats.avgProjectCompletionTime],
                        ['Total To-Do Lists', stats.totalTasks],
                        ['Closed To-Do Lists', stats.closedTasks],
                        ['Open To-Do Lists', stats.openTasks],
                        ['Opened To-Do Lists unassigned to a project', stats.unassignedOpenTasks],
                        ['Average To-Do List Completion Time', stats.avgTaskCompletionTime],
                        ['Total Subtasks', stats.totalSubtasks],
                        ['Closed Subtasks', stats.closedSubtasks],
                    ].map(([label, value]) => (
                        <View key={label} style={tw`flex-row justify-between my-2 px-2`}>
                            <ThemedText variant="lg" style={tw`flex-1`}>
                                {label}:
                            </ThemedText>
                            <ThemedText variant="lg" style={[tw`font-bold ml-4`, {color: isDarkMode ? theme.colors.darkSky : theme.colors.evergreen}]}>
                                {value}
                            </ThemedText>
                        </View>
                    ))}
                </View>
        
                {/* Charts */}
                {/* Pie chart */}
                <View style={tw`p-4 rounded-xl mb-4 shadow ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="xl" style={tw`font-bold mb-3 text-center`}>
                        Pie Chart Metric:
                    </ThemedText>
                    {/* <Picker
                        selectedValue={selectedPieMetric}
                        style={styles.picker}
                        onValueChange={(itemValue) => setSelectedPieMetric(itemValue)}
                    >
                        <Picker.Item label="To-Do Lists Open vs Closed" value="To-Do Lists" />
                        <Picker.Item label="Subtasks Open vs Closed" value="Subtasks" />
                        <Picker.Item label="Projects Open vs Closed" value="Projects" />
                    </Picker> */}
                    <SegmentedControl
                        values={pieSegments}
                        selectedIndex={pieIndex}
                        onChange={event => setPieIndex(event.nativeEvent.selectedSegmentIndex)}
                        style={tw`mb-2 rounded`}
                        backgroundColor={isDarkMode ? '#444444' : '#DDDDDD'}
                        tintColor={isDarkMode ? theme.colors.darkMint : theme.colors.mint}
                        fontStyle={{ color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary }}
                        activeFontStyle={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}
                    />
                    {/* <View style={tw`flex-row flex-wrap justify-center mb-2`}>
                        {['To-Do Lists', 'Subtasks', 'Projects'].map(metric => (
                            <ActionButton
                                key={metric}
                                title={metric}
                                onPress={() => setSelectedPieMetric(metric)}
                                bgColor={selectedPieMetric === metric ? theme.colors.mint : theme.colors.sky}
                                shadowColor={theme.colors.forest}
                                textColor={theme.colors.textPrimary}
                                width="30%"
                            />
                        ))}
                    </View> */}

                    <ThemedText variant="lg" style={tw`text-center font-bold mt-4`}>
                        {/* {selectedPieMetric}: Open vs Closed */}
                        {pieSegments[pieIndex]}: Open vs Closed
                    </ThemedText>
                    <PieChart
                        data={pieData}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={pieChartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                        style={tw`mt-2 self-center`}
                    />
                </View>

                {/* Closed To-Do Lists by Priority */}
                <View style={tw`p-4 rounded-xl mb-4 shadow ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="lg" style={tw`text-center font-bold mb-2`}>
                        Closed To-Do Lists by Priority
                    </ThemedText>
                    <BarChart
                        data={barData}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={barChartConfig}
                        style={tw`my-2 rounded-lg self-center`}
                        withVerticalLabels
                        fromZero
                        showBarTops={false}
                    />
                </View>

                {/* Closed Subtasks by Priority */}
                <View style={tw`p-4 rounded-xl mb-4 shadow ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="lg" style={tw`text-center font-bold mb-2`}>
                        Closed Subtasks by Priority
                    </ThemedText>
                    <BarChart
                        data={closedSubtasksByPriority}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={barChartConfig}
                        style={tw`my-2 rounded-lg self-center`}
                        withVerticalLabels
                        fromZero
                        showBarTops={false}
                    />
                </View>

                {/* Trend Graph Customisation */}
                <View style={tw`p-4 rounded-xl mb-4 shadow ${isDarkMode ? theme.colors.darkBg : theme.colors.white}`}>
                    <ThemedText variant="xl" style={tw`font-bold mb-3 text-center`}>
                        Trend Metric:
                    </ThemedText>
                    {/* <View style={tw`flex-row flex-wrap justify-center mb-2`}>
                        {TREND_OPTIONS.map(opt => (
                            <ActionButton
                                key={opt.value}
                                title={opt.label}
                                onPress={() => setSelectedTrendMetric(opt.value)}
                                bgColor={selectedTrendMetric === opt.value ? theme.colors.mint : theme.colors.sky}
                                shadowColor={theme.colors.forest}
                                textColor={theme.colors.textPrimary}
                                width="45%"
                            />
                        ))}
                    </View> */}
                    <SegmentedControl
                        values={TREND_OPTIONS.map(opt => opt.label)}
                        selectedIndex={trendIndex}
                        onChange={event => setTrendIndex(event.nativeEvent.selectedSegmentIndex)}
                        style={tw`mb-2 rounded`}
                        backgroundColor={isDarkMode ? '#444444' : '#DDDDDD'}
                        // tintColor={isDarkMode ? theme.colors.darkMint : theme.colors.mint}
                        tintColor={theme.colors.darkMagenta}
                        fontStyle={{ color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary }}
                        activeFontStyle={{ color: theme.colors.darkTextPrimary, fontWeight: 'bold' }}
                    />

                    {/* Trend chart */}
                    <ThemedText variant="lg" style={tw`text-center font-bold mt-4`}>
                        {/* {selectedTrendMetric} (Past 7 Days) */}
                        {TREND_OPTIONS[trendIndex].label} (Past 7 Days)
                    </ThemedText>
                    <LineChart
                        data={trendData}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={trendChartConfig}
                        yAxisSuffix={
                            selectedTrendMetric === 'Average Project Completion Time' ||
                            selectedTrendMetric === 'Average To-Do List Completion Time'
                                ? 'h'
                                : ''
                        }
                        bezier
                        style={tw`mt-2 self-center`}
                    />
                    {/* <Picker
                        selectedValue={selectedTrendMetric}
                        style={styles.picker}
                        onValueChange={(itemValue) => setSelectedTrendMetric(itemValue)}
                    >
                        {TREND_OPTIONS.map((opt) => (
                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                        ))}
                    </Picker> */}
                </View>
                {/* Trend chart
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
                /> */}
            </ScrollView>
        </SafeAreaView>
    );
};

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
//     loading: { flex: 1, justifyContent: "center", alignItems: "center" },
//     header: { fontSize: 24, fontWeight: "bold", marginVertical: 10, textAlign: "center" },
//     filterContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
//     filterLabel: { fontWeight: "bold", marginTop: 10 },
//     picker: { height: 140, width: "100%" },
//     statsContainer: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
//     statItem: { fontSize: 16, marginVertical: 2 },
//     chartTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10, textAlign: "center" },
//     chart: { marginVertical: 8, borderRadius: 8 },
// });