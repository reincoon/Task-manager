import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import TaskCreationScreen from '../screens/TaskCreationScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import { useTheme } from '../helpers/ThemeContext';
import tw, { theme } from '../twrnc';
import NavigationIcon from '../components/NavigationICon';

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
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false, gestureDirection: 'horizontal-inverted' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In' }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} option={{ title: 'Change Password' }} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { isDarkMode } = useTheme();
    return (
        <NavigationContainer>
            <Tab.Navigator 
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        return <NavigationIcon routeName={route.name} color={color} size={size} />
                    },
                    tabBarActiveTintColor: isDarkMode ? theme.colors.darkMint : theme.colors.teal,
                    tabBarInactiveTintColor: isDarkMode ? theme.colors.darkTextSecondary : theme.colors.gray,
                    tabBarStyle: tw`border-t border-darkTextSecondary ${isDarkMode ? 'bg-darkBg' : 'bg-white'}`,
                    headerShown: false,
                })}
            >
                <Tab.Screen name="HomeStack" component={HomeStack} options={{ title: 'Home' }} />
                <Tab.Screen name="Statistics" component={StatisticsScreen} />
                <Tab.Screen name="SettingsStack" component={SettingsStack} options={{ title: 'Settings' }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;