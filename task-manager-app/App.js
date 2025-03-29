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
import tw from './twrnc';
import { useFonts } from 'expo-font';
import { ThemeProvider } from './helpers/ThemeContext';

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
    'Inter-Italic': require('./assets/fonts/Inter-Italic-VariableFont_opsz,wght.ttf'),
    'Inter-Var': require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
    'Poppins-Black': require('./assets/fonts/Poppins-Black.ttf'),
    'Poppins-BlackItalic': require('./assets/fonts/Poppins-BlackItalic.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-BoldItalic': require('./assets/fonts/Poppins-BoldItalic.ttf'),
    'Poppins-ExtraBold': require('./assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-ExtraBoldItalic': require('./assets/fonts/Poppins-ExtraBoldItalic.ttf'),
    'Poppins-ExtraLight': require('./assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-ExtraLightItalic': require('./assets/fonts/Poppins-ExtraLightItalic.ttf'),
    'Poppins-Italic': require('./assets/fonts/Poppins-Italic.ttf'),
    'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
    'Poppins-LightItalic': require('./assets/fonts/Poppins-LightItalic.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-MediumItalic': require('./assets/fonts/Poppins-MediumItalic.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-SemiBoldItalic': require('./assets/fonts/Poppins-SemiBoldItalic.ttf'),
    'Poppins-Thin': require('./assets/fonts/Poppins-Thin.ttf'),
    'Poppins-ThinItalic': require('./assets/fonts/Poppins-ThinItalic.ttf'),
    'Roboto-Italic': require('./assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf'),
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
        <Text style={tw`text-xl2 font-bold text-darkTextPrimary dark:text-textPrimary`}>
          Loading fonts...
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={tw`flex-1`}>
        <View style={tw`flex-1 bg-light dark:bg-darkBg`}>
          <AppNavigator />
        </View>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
};

export default App;
