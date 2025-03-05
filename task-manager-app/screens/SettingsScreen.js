import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { handleLogOut, handleDeleteAccount, handleSaveName, handleCancelEdit, handleChangePassword } from '../helpers/authFunctions';
import EditNameForm from '../components/EditNameForm';
import GuestView from '../components/GuestView';
import ThemeToggle from '../components/ThemeToggle';
import tw from '../twrnc';
import ActionButton from '../components/ActionButton';

const SettingsScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

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

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <SafeAreaView style={tw`${isDarkMode ? 'bg-darkBg' : 'bg-light'} flex-1 p-5`}>
            <Text style={tw`text-3xl font-extrabold text-center mb-8 font-inter ${isDarkMode ? 'text-darkTextPrimary' : 'text-textPrimary'}`}>
                Settings
            </Text>
            
            {loading ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : user ? (
                <>
                    {/* Account Info Card */}
                    <View style={tw`bg-gray-100 dark:bg-gray-800 p-5 rounded-lg shadow mb-6`}>
                        <Text style={tw`text-lg font-bold mb-2 font-inter ${isDarkMode ? 'text-darkTextPrimary' : 'text-textPrimary'}`}>
                            Account Info
                        </Text>
                        <Text style={tw`text-base mb-1 font-roboto ${isDarkMode ? 'text-darkTextPrimary' : 'text-textPrimary'}`}>
                            Email: {isAnonymous ? 'Guest' : user.email}
                        </Text>

                        {!isAnonymous && !isEditingName && (
                            <Text style={tw`text-base mb-1 font-roboto ${isDarkMode ? 'text-darkTextPrimary' : 'text-textPrimary'}`}>
                                Name: {user.displayName || 'N/A'}
                            </Text>
                        )}
                    </View>
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
                                <View style={tw`mb-6`}>
                                    <ActionButton title="Edit Name" onPress={() => setIsEditingName(true)} bgColor="#A4FCB4" shadowColor="#5D8765" />
                                    <ActionButton title="Change Password" onPress={() => handleChangePassword(navigation)} bgColor="#9EE1F0" shadowColor="#416147" />
                                    <ActionButton title="Log Out" onPress={() => handleLogOut(auth, setLoading, setUser, setName, setIsAnonymous, navigation, setTasks = () => {})} bgColor="#416147" shadowColor="#8FD3A8" />
                                    <ActionButton title="Delete Account" onPress={() => handleDeleteAccount(auth, setLoading, setUser, setName, setIsAnonymous, navigation)} bgColor="#E74C3C" shadowColor="#C94133" />
                                </View>
                            </>
                        )}
                    {/* </View> */}
                </>
            ) : (
                <GuestView
                    onLogIn={() => navigation.navigate('Login')}
                    onSignUp={() => navigation.navigate('SignUp')}
                />
            )}

            {/* Theme toggle */}
            <View style={tw`mt-8`}>
                <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
            </View>            
        </SafeAreaView>
    );
};

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//     },
//     title: {
//         fontSize: 24,
//         marginBottom: 20,
//         textAlign: 'center',
//     },
//     userInfoContainer: {
//         marginBottom: 20,
//     },
//     userInfo: {
//         fontSize: 16,
//         marginBottom: 10,
//     },
// });

export default SettingsScreen;