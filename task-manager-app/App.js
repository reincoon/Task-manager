import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { db, auth } from './firebaseConfig';
import AppNavigator from './navigation/AppNavigator';
import { useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';

const App = () => {
  useEffect(() => {
    const initializeAnonymousUser = async () => {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    };
    initializeAnonymousUser();
  }, []);

  return <AppNavigator />;
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
