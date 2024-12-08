import { signOut, deleteUser, updateProfile, signInAnonymously, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Alert } from 'react-native';

export const handleLogOut = async (auth, setLoading, setUser, setName, setIsAnonymous, navigation) => {
    setLoading(true);
    try {
        await signOut(auth);
        await signInAnonymously(auth);
        Alert.alert('Success', 'Logged out successfully!');
        setUser(auth.currentUser);
        setName('');
        setIsAnonymous(true);
        navigation.navigate('HomeStack');
    } catch (error) {
        Alert.alert('Error', error.message);
    } finally {
        setLoading(false);
    }
};

export const handleDeleteAccount = async (auth, setLoading, setUser, setName, setIsAnonymous, navigation) => {
    Alert.prompt(
        "Delete Account",
        "Please enter your password to delete the account",
        async (password) => {
            if (!password) {
                Alert.alert('Error', 'Password cannot be empty');
                return;
            }
            await deleteAccount(auth, password, setLoading, setUser, setName, setIsAnonymous, navigation);
        },
        'secure-text'
    );
};

const deleteAccount = async (auth, password, setLoading, setUser, setName, setIsAnonymous, navigation) => {
    setLoading(true);
    try {
        const currentUser = auth.currentUser;
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        await deleteUser(currentUser);
        await signInAnonymously(auth);
        Alert.alert('Success', 'Account deleted successfully!');
        setUser(auth.currentUser);
        setName('');
        setIsAnonymous(true);
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