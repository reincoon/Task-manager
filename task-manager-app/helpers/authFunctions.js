import { signOut, deleteUser, updateProfile, signInAnonymously, reauthenticateWithCredential, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { CommonActions } from '@react-navigation/native';

export const handleLogOut = async (auth, setLoading, setUser, setName, setIsAnonymous, navigation, setTasks = () => {}) => {
    setLoading(true);
    try {
        await signOut(auth);
        const anonymousUser = await signInAnonymously(auth);
        if (typeof setTasks === 'function') {
            setTasks([]);
        }
        setUser(anonymousUser);
        setName('');
        setIsAnonymous(true);
        Alert.alert('Success', 'Logged out successfully!');
        navigation.navigate('HomeStack');
    } catch (error) {
        Alert.alert('Error', error.message);
    } finally {
        setLoading(false);
    }
};

export const handleUpgradeAnonymousAccount = async (auth, email, password, name, setLoading, setTasks, navigation) => {
    setLoading(true);
    try {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.isAnonymous) {
            Alert.alert('Error', 'You must be logged in as a guest to upgrade.');
            return;
        }
        const credential = EmailAuthProvider.credential(email, password);
        // Link anonymous account to the new credential
        const userCredential = await linkWithCredential(currentUser, credential);
        const upgradedUser = userCredential.user;

        // Update the user's display name
        await updateProfile(upgradedUser, { displayName: name });

        // Transfer tasks from anonymous user to the upgraded user
        if (typeof setTasks === 'function') {
            await transferTasks(currentUser.uid, upgradedUser.uid, setTasks);
        }

        Alert.alert('Success', 'Account upgraded successfully!');
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'HomeStack' }],
            })
        );
    } catch (error) {
        Alert.alert('Error', error.message);
    } finally {
        setLoading(false);
    }
};

const transferTasks = async (anonymousUid, newUid, setTasks) => {
    const anonymousTasksRef = collection(db, `tasks/${anonymousUid}/taskList`);
    const newTasksRef = collection(db, `tasks/${newUid}/taskList`);
    const tasksSnapshot = await getDocs(anonymousTasksRef);
    if (!tasksSnapshot.empty) {
        const taskPromises = tasksSnapshot.docs.map(async (taskDoc) => {
            const taskData = taskDoc.data();
            await setDoc(doc(newTasksRef, taskDoc.id), taskData);
            await deleteDoc(doc(anonymousTasksRef, taskDoc.id));
        });
        await Promise.all(taskPromises);
    }

    // Fetch updated tasks for the permanent account
    const updatedTasksSnapshot = await getDocs(newTasksRef);
    const updatedTasks = updatedTasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    setTasks(updatedTasks);
};

export const handleDeleteAccount = async (auth, setLoading, setUser, setName, setIsAnonymous, setTasks, navigation) => {
    Alert.prompt(
        "Delete Account",
        "Please enter your password to delete the account",
        async (password) => {
            if (!password) {
                Alert.alert('Error', 'Password cannot be empty');
                return;
            }
            await deleteAccount(auth, password, setLoading, setUser, setName, setIsAnonymous, setTasks, navigation);
        },
        'secure-text'
    );
};

const deleteAccount = async (auth, password, setLoading, setUser, setName, setIsAnonymous, setTasks, navigation) => {
    setLoading(true);
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert('Error', 'No user is logged in.');
            return;
        }
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        // Delete the user's tasks
        const tasksRef = collection(db, `tasks/${currentUser.uid}/taskList`);
        const tasksSnapshot = await getDocs(tasksRef);
        const deleteTasksPromises = tasksSnapshot.docs.map((taskDoc) =>
            deleteDoc(doc(tasksRef, taskDoc.id))
        );
        await Promise.all(deleteTasksPromises);
        // Delete the user's account
        await deleteUser(currentUser);
        await signInAnonymously(auth);
        // reset the state
        setTasks([]);
        setUser(auth.currentUser);
        setName('');
        setIsAnonymous(true);
        Alert.alert('Success', 'Account deleted successfully!');
        navigation.navigate('HomeStack');
    } catch (error) {
        Alert.alert('Error', error.message);
    } finally {
        setLoading(false);
    }
};

export const handleSaveName = async (auth, name, setIsEditingName) => {
    if (!name.trim()) {
        Alert.alert('Error', 'Name cannot be empty');
        return;
    }

    try {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateProfile(currentUser, { displayName: name });
            Alert.alert('Success', 'Name updated successfully!');
            setIsEditingName(false);
        }
    } catch (error) {
        Alert.alert('Error', error.message);
    }
};

export const handleCancelEdit = (setName, currentName, setIsEditingName) => {
    setName(currentName || '');
    setIsEditingName(false);
};

export const handleChangePassword = (navigation) => {
    navigation.navigate('ChangePassword');
};