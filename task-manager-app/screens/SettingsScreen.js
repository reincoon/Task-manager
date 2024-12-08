import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { signOut, deleteUser, updateProfile, signInAnonymously, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const SettingsScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    // useEffect(() => {
    //     const currentUser = auth.currentUser;
    //     setUser(currentUser);
    //     if (currentUser) {
    //         setName(currentUser.displayName || '');
    //         setIsAnonymous(currentUser.isAnonymous);
    //     }
    // }, [auth.currentUser]);
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setName(currentUser.displayName || '');
                setIsAnonymous(currentUser.isAnonymous);
            } else {
                setUser(null);
                setName('');
                setIsAnonymous(false);
            }
        });

        return unsubscribe;
    }, []);

    const handleLogOut = async () => {
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

    const handleDeleteAccount = async () => {
        Alert.prompt(
            "Delete Account",
            "Please enter your password to delete the account",
            async (password) => {
                if (!password) {
                    Alert.alert('Error', 'Password cannot be empty');
                    return;
                }
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
            },
            'secure-text'
        );
    };

    const handleSaveName = async () => {
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

    const handleCancelEdit = () => {
        setName(user?.displayName || '');
        setIsEditingName(false);
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            {loading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : user ? (
                <>
                    <View style={styles.userInfoContainer}>
                        <Text style={styles.userInfo}>Email: {isAnonymous ? 'Guest' : user.email}</Text>
                        {isAnonymous ? (
                            <>
                                <Text style={styles.guestMessage}>
                                    You are logged in as a guest. To save your data, please log in or sign up.
                                </Text>
                                <Button title="Log In" onPress={() => navigation.navigate('Login')} color="blue" />
                                <Button title="Sign Up" onPress={() => navigation.navigate('SignUp')} color="green" />
                            </>
                        ) : (
                            <>
                                {isEditingName ? (
                                    <View style={styles.nameEditContainer}>
                                        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />
                                        <Button title="Save" onPress={handleSaveName} />
                                        <Button title="Cancel" onPress={handleCancelEdit} color="red" />
                                    </View>
                                ) : (
                                    <>
                                        <Text style={styles.userInfo}>
                                            Name: {user.displayName || 'N/A'}
                                        </Text>
                                        <Button title="Edit Name" onPress={() => setIsEditingName(true)} color="blue" />
                                    </>
                                )}
                                <Button title="Change Password" onPress={handleChangePassword} color="blue" />
                                <Button title="Log Out" onPress={handleLogOut} color="orange" />
                                <Button title="Delete Account" onPress={handleDeleteAccount} color="red" />
                            </>
                        )}
                    </View>
                </>
            ) : (
                <>
                    <Button
                        title="Log In"
                        onPress={() => navigation.navigate('Login')}
                        color="blue"
                    />
                    <Button
                        title="Sign Up"
                        onPress={() => navigation.navigate('SignUp')}
                        color="green"
                    />
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    userInfoContainer: {
        marginBottom: 20,
    },
    userInfo: {
        fontSize: 16,
        marginBottom: 10,
    },
    guestMessage: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 20,
    },
    nameEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginRight: 10,
    },
});

export default SettingsScreen;