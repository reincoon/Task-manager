import { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { handleLogOut, handleDeleteAccount, handleSaveName, handleCancelEdit, handleChangePassword } from '../helpers/authFunctions';
import EditNameForm from '../components/EditNameForm';
import GuestView from '../components/GuestView';
import ThemeToggle from '../components/ThemeToggle';
import tw, { theme } from '../twrnc';
import ActionButton from '../components/ActionButton';
import Slider from '@react-native-community/slider';
import { useTheme } from '../helpers/ThemeContext';

const SettingsScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fontScale, setFontScale] = useState(1);
    const { isDarkMode, toggleTheme } = useTheme();

    const baseHeaderSize = theme.fontSize.xl3;
    const baseSubHeaderSize = theme.fontSize.xl;
    const baseBodySize = theme.fontSize.base; 

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

    // const toggleTheme = () => {
    //     setIsDarkMode(prev => !prev);
    // };

    return (
        <SafeAreaView style={tw`${isDarkMode ? 'bg-darkBg' : 'bg-light'} flex-1 p-5`}>
            <Text style={[
                tw`font-extrabold text-center mb-8 font-inter-var`,
                {
                    fontSize: baseHeaderSize * fontScale,
                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                },
            ]}>
                Settings
            </Text>
            
            {loading ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : user ? (
                <>
                    {/* Account Info Card */}
                    <View style={tw`p-5 rounded-lg shadow mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-sky'}`}>
                        <Text style={[
                            tw`mb-2 font-inter-var`,
                            {
                                fontSize: baseSubHeaderSize * fontScale,
                                color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                            },
                        ]}>
                            Account Info
                        </Text>
                        <Text style={[
                            tw`mb-1 font-roboto-var`,
                            {
                                fontSize: baseBodySize * fontScale,
                                color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                            },
                        ]}>
                            Email: {isAnonymous ? 'Guest' : user.email}
                        </Text>

                        {!isAnonymous && !isEditingName && (
                            <Text style={[
                                tw`mb-1 font-roboto-var`,
                                {
                                    fontSize: baseBodySize * fontScale,
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                },
                            ]}>
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
                                    <ActionButton title="Edit Name" onPress={() => setIsEditingName(true)} bgColor={theme.colors.mint} shadowColor={theme.colors.forest} />
                                    <ActionButton title="Change Password" onPress={() => handleChangePassword(navigation)} bgColor={theme.colors.sky} shadowColor={theme.colors.evergreen} />
                                    <ActionButton title="Log Out" onPress={() => handleLogOut(auth, setLoading, setUser, setName, setIsAnonymous, navigation, setTasks = () => {})} bgColor={theme.colors.evergreen} shadowColor={theme.colors.darkMint} />
                                    <ActionButton title="Delete Account" onPress={() => handleDeleteAccount(auth, setLoading, setUser, setName, setIsAnonymous, navigation)} bgColor={theme.colors.cinnabar} shadowColor={theme.colors.darkCinnabar} />
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
            {/* Font Size Slider */}
            <View style={tw`mb-6`}>
                <Text
                    style={[
                        tw`mb-2 font-roboto-var text-center`,
                        {
                            fontSize: baseBodySize * fontScale,
                            color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                        },
                    ]}
                >
                    Font Size: {Math.round(baseBodySize * fontScale)}px
                </Text>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0.8}
                    maximumValue={1.5}
                    step={0.1}
                    value={fontScale}
                    onValueChange={setFontScale}
                    minimumTrackTintColor={theme.colors.evergreen}
                    maximumTrackTintColor="#ccc"
                    thumbTintColor={theme.colors.evergreen}
                />
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