import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, TextInput, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import { signOut, deleteUser, updateProfile } from 'firebase/auth';

const SettingsScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        const currentUser = auth.currentUser;
        setUser(currentUser);
        if (currentUser) {
            setName(currentUser.displayName || '');
            setIsAnonymous(currentUser.isAnonymous);
        }
    }, []);

    const handleLogOut = async () => {
        try {
            await signOut(auth);
            Alert.alert('Success', 'Logged out successfully!');
            setUser({ email: 'Guest' });
            setName('Guest');
            setIsAnonymous(true);
            navigation.navigate('HomeStack');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await deleteUser(currentUser);
                Alert.alert('Success', 'Account deleted successfully!');
                setUser(null);
                setName('');
                setIsAnonymous(false);
                navigation.navigate('HomeStack');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleSaveName = async () => {
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

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            {user ? (
                <>
                    <View style={styles.userInfoContainer}>
                        {/* <Text style={styles.userInfo}>Name: {user.displayName || 'N/A'}</Text> */}
                        {/* <Text style={styles.userInfo}>Email: {user.email}</Text> */}
                        <Text style={styles.userInfo}>Email: {isAnonymous ? 'Guest' : user.email}</Text>
                        {isAnonymous ? (
                            <>
                                <Text style={styles.guestMessage}>
                                    You are logged in as a guest. To save your data, please log in or sign up.
                                </Text>
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
                        ) : (
                            <>
                                {isEditingName ? (
                                    <View style={styles.nameEditContainer}>
                                        <TextInput
                                            style={styles.input}
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="Enter your name"
                                        />
                                        <Button title="Save" onPress={handleSaveName} />
                                    </View>
                                ) : (
                                    <>
                                        <Text style={styles.userInfo}>
                                            Name: {user.displayName || 'N/A'}
                                        </Text>
                                        <Button
                                            title="Edit Name"
                                            onPress={() => setIsEditingName(true)}
                                            color="blue"
                                        />
                                    </>
                                )}
                                <Button
                                    title="Change Password"
                                    onPress={handleChangePassword}
                                    color="blue"
                                />
                                <Button title="Log Out" onPress={handleLogOut} color="orange" />
                                <Button
                                    title="Delete Account"
                                    onPress={handleDeleteAccount}
                                    color="red"
                                />
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