import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { auth } from './firebaseConfig';
import AppNavigator from './navigation/AppNavigator';
import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { TailwindProvider } from 'nativewind';
import tw from './twrnc';

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

  return (
    <GestureHandlerRootView style={tw`flex-1`}>
      {/* <TailwindProvider> */}
        <View style={tw`flex-1 bg-mint dark:bg-darkBg`}>
          <AppNavigator isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </View>
      {/* </TailwindProvider> */}
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
