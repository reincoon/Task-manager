import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { auth } from './firebaseConfig';
import AppNavigator from './navigation/AppNavigator';
import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import tw, { theme } from './twrnc';
import { useFonts } from 'expo-font';
import { ThemeProvider } from './helpers/ThemeContext';
import { CopilotProvider } from 'react-native-copilot';

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontsLoaded] = useFonts({
    'Inter-Var': require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Roboto-Var': require('./assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
  });

  useEffect(() => {
    tw.setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const initializeAnonymousUser = async () => {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    };
    initializeAnonymousUser();
  }, []);


  if (!fontsLoaded) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-light dark:bg-darkBg`}>
        <Text style={tw`text-2xl font-bold text-darkTextPrimary dark:text-textPrimary`}>
          Loading fonts...
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={tw`flex-1`}>
        <CopilotProvider
          overlay="svg"
          tooltipStyle={tw`bg-light dark:bg-darkBg border border-darkTextSecondary rounded-lg shadow-lg p-2`}
          arrowColor={theme.colors.darkEvergreen}
        >
          <View style={tw`flex-1 bg-light dark:bg-darkBg`}>
            <AppNavigator />
          </View>
        </CopilotProvider>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
};

export default App;
