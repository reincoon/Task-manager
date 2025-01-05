import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { db, auth } from './firebaseConfig';
import AppNavigator from './navigation/AppNavigator';
import { useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DraxProvider } from 'react-native-drax';

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  useEffect(() => {
    const initializeAnonymousUser = async () => {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    };
    initializeAnonymousUser();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DraxProvider>
        <AppNavigator />
      </DraxProvider>
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
