import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import TaskCreationScreen from '../screens/TaskCreationScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TaskCreationScreen" component={TaskCreationScreen} />
        <Stack.Screen name="TaskDetailsScreen" component={TaskDetailsScreen} />
    </Stack.Navigator>
);

const SettingsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In' }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} option={{ title: 'Change Password' }} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator 
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        let iconName;
                        if (route.name === 'HomeStack') iconName = 'home-outline';
                        // if (route.name === 'Calendar') iconName = 'calendar-outline';
                        if (route.name === 'SettingsStack') iconName = 'settings-outline';
                        if (route.name === 'Statistics') iconName = 'stats-chart-outline';
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: 'blue',
                    tabBarInactiveTintColor: 'gray',
                    headerShown: false,
                })}
            >
                <Tab.Screen name="HomeStack" component={HomeStack} options={{ title: 'Home' }} />
                {/* <Tab.Screen name="Create Task" component={TaskCreationScreen} />
                <Tab.Screen name="Task Details" component={TaskDetailsScreen} /> */}
                <Tab.Screen name="Statistics" component={StatisticsScreen} />
                <Tab.Screen name="SettingsStack" component={SettingsStack} options={{ title: 'Settings' }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;