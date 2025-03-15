import { useState, useEffect } from 'react';
import { View, SafeAreaView, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { handleLogOut, handleDeleteAccount, handleSaveName, handleCancelEdit, handleChangePassword } from '../helpers/authFunctions';
import EditNameForm from '../components/EditNameForm';
import GuestView from '../components/GuestView';
import ThemeToggle from '../components/ThemeToggle';
import tw, { theme } from '../twrnc';
import ActionButton from '../components/ActionButton';
import Slider from '@react-native-community/slider';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from '../components/ThemedText';
import SignUpInHeader from '../components/SignUpInHeader';

const SettingsScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const { isDarkMode, toggleTheme, fontScale, setFontScale } = useTheme();

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
        <SafeAreaView style={tw`${isDarkMode ? 'bg-darkBg' : 'bg-light'} flex-1 p-5`}>
            {/* Header component */}
            <SignUpInHeader title="Settings" icon="settings-outline" navigation={navigation} />
            
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.sky} />
            ) : user ? (
                <>
                    {/* Account Info Card */}
                    <View 
                        style={[
                            tw`p-5 rounded-xl shadow-lg mb-6 self-center w-4/5`,
                            {
                                backgroundColor: isDarkMode ? theme.colors.darkBg : theme.colors.white,
                                borderColor: isDarkMode ? theme.colors.darkTextSecondary : theme.colors.white,
                                shadowColor: isDarkMode ? theme.colors.darkSky : theme.colors.darkForest,
                                borderWidth: 0.5,
                            },
                        ]}
                    >
                        <ThemedText variant="xl" style={tw`mb-2 font-inter-var text-center`}>
                            Account Info
                        </ThemedText>
                        <ThemedText style={tw`mb-1 font-roboto-var text-center`}>
                            Email: {isAnonymous ? 'Guest' : user.email}
                        </ThemedText>

                        {!isAnonymous && !isEditingName && (
                            <ThemedText style={tw`mb-1 font-roboto-var text-center`}>
                                Name: {user.displayName || 'N/A'}
                            </ThemedText>
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
                                <View style={tw`flex-row justify-between px-2`}>
                                    <ActionButton 
                                        title="Edit Name" 
                                        onPress={() => setIsEditingName(true)} 
                                        bgColor={theme.colors.mint} 
                                        shadowColor={theme.colors.forest} 
                                        iconName="pencil-outline" 
                                        textColor={theme.colors.textPrimary}
                                        width="48%"
                                    />
                                    <ActionButton 
                                        title="Change Password" 
                                        onPress={() => handleChangePassword(navigation)} 
                                        bgColor={theme.colors.sky} 
                                        shadowColor={theme.colors.evergreen} 
                                        iconName="key-outline"
                                        textColor={theme.colors.textPrimary}
                                        width="51%"
                                    />
                                </View>
                                
                            </View>
                        </>
                    )}
                </>
            ) : (
                <GuestView
                    onLogIn={() => navigation.navigate('Login')}
                    onSignUp={() => navigation.navigate('SignUp')}
                />
            )}

            {/* Theme toggle */}
            <View style={tw`mt-4`}>
                <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
            </View>
            {/* Font Size Slider */}
            <View style={tw`mb-6`}>
                <ThemedText 
                    style={tw`mb-2 font-roboto-var text-center`}
                >
                    Font Size: {Math.round(theme.fontSize.base * fontScale)}px
                </ThemedText>
                <Slider
                    style={{ width: '90%', height: 40, alignSelf: 'center' }}
                    minimumValue={0.8}
                    maximumValue={1.5}
                    step={0.1}
                    value={fontScale}
                    onValueChange={(value) => setFontScale(value)}
                    minimumTrackTintColor={theme.colors.evergreen}
                    maximumTrackTintColor="#ccc"
                    thumbTintColor={theme.colors.mint}
                />
            </View>

            {!isAnonymous && (
                <View style={tw`mt-8 px-5`}>
                    <View style={tw`flex-row justify-between`}>                       
                        <ActionButton 
                            title="Log Out" 
                            onPress={() => handleLogOut(auth, setLoading, setUser, setName, setIsAnonymous, navigation, setTasks = () => {})} 
                            bgColor={theme.colors.evergreen} 
                            shadowColor={theme.colors.darkMint} 
                            iconName="log-out-outline" 
                            textColor={theme.colors.white}
                            width="49%"
                        />
                        <ActionButton 
                            title="Delete Account" 
                            onPress={() => handleDeleteAccount(auth, setLoading, setUser, setName, setIsAnonymous, navigation)} 
                            bgColor={theme.colors.darkCinnabar} 
                            shadowColor={theme.colors.darkCinnabar} 
                            iconName="trash-outline"
                            textColor={theme.colors.white}
                            width="49%"
                        />
                    </View>
                </View>
            )}           
        </SafeAreaView>
    );
};

export default SettingsScreen;