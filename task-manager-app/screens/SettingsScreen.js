import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { handleLogOut, handleDeleteAccount, handleSaveName, handleCancelEdit } from '../helpers/authFunctions';
import { handleChangePassword } from '../helpers/navigationFunctions';
import EditNameForm from '../components/EditNameForm';
import GuestView from '../components/GuestView';

const SettingsScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

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
                            <GuestView
                                onLogIn={() => navigation.navigate('Login')}
                                onSignUp={() => navigation.navigate('SignUp')}
                            />
                        ) : isEditingName ? (
                            <EditNameForm
                                name={name}
                                setName={setName}
                                handleSaveName={() => handleSaveName(auth, name, setIsEditingName)}
                                handleCancelEdit={() =>
                                    handleCancelEdit(setName, user?.displayName, setIsEditingName)
                                }
                            />
                        ) : (
                            <>
                                <Text style={styles.userInfo}>Name: {user.displayName || 'N/A'}</Text>
                                <Button title="Edit Name" onPress={() => setIsEditingName(true)} color="blue" />
                                <Button title="Change Password" onPress={() => handleChangePassword(navigation)} color="blue" />
                                <Button title="Log Out" onPress={() => handleLogOut(auth, setLoading, setUser, setName, setIsAnonymous, navigation)} color="orange" />
                                <Button title="Delete Account" onPress={() => handleDeleteAccount(auth, setLoading, setUser, setName, setIsAnonymous, navigation)} color="red" />
                            </>
                        )}
                    </View>
                </>
            ) : (
                <GuestView
                    onLogIn={() => navigation.navigate('Login')}
                    onSignUp={() => navigation.navigate('SignUp')}
                />
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
});

export default SettingsScreen;