import { useState } from 'react';
import { SafeAreaView, TextInput, Button, View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
// import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// import { CommonActions } from '@react-navigation/native';
import { handleUpgradeAnonymousAccount } from '../helpers/authFunctions';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

const SignUpScreen = ({ navigation, route }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { isDarkMode, fontScale } = useTheme();

    const handleSignUp = async () => {
        if (!name) { 
            Alert.alert('Error', 'Name is required');
            return;
        };

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        };

        const setTasks = route.params?.setTasks;
        await handleUpgradeAnonymousAccount(auth, email, password, name, setLoading, setTasks, navigation);
    };

    return (
        <SafeAreaView style={tw`flex-1 p-6 justify-center ${isDarkMode ? 'bg-darkBg' : 'bg-light'}`}>
            <View style={tw`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <Text 
                    style={[
                    tw`text-center mb-6 font-inter-var`,
                    { 
                        fontSize: theme.fontSize.xl3 * fontScale, 
                        color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary 
                    },
                ]}>
                    Sign Up
                </Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#007BFF" />
                ) : (
                    <>
                        <TextInput
                            style={[
                                tw`border p-3 rounded-md mb-4 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale, 
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    borderColor: isDarkMode ? theme.colors.darkTextSecondary : '#ccc'
                                },
                            ]}
                            placeholder="Name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                        />
                        <TextInput
                            style={[
                                tw`border p-3 rounded-md mb-4 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale, 
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    borderColor: isDarkMode ? theme.colors.darkTextSecondary : '#ccc'
                                },
                            ]}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                        />
                        <TextInput
                            style={[
                                tw`border p-3 rounded-md mb-4 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale, 
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    borderColor: isDarkMode ? theme.colors.darkTextSecondary : '#ccc'
                                },
                            ]}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                        />
                        <TextInput
                            style={[
                                tw`border p-3 rounded-md mb-4 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale, 
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    borderColor: isDarkMode ? theme.colors.darkTextSecondary : '#ccc'
                                },
                            ]}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                        />
                        <TouchableOpacity onPress={handleSignUp} style={tw`py-3 rounded-md mb-4 ${isDarkMode ? 'bg-darkForest' : 'bg-forest'}`}>
                            <Text 
                                style={[
                                    tw`text-center font-bold text-white font-poppins-regular`,
                                    { fontSize: theme.fontSize.lg * fontScale },
                                ]}
                            >
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                        <Text 
                            style={[
                                tw`text-center font-roboto-var text-blue-500`,
                                { fontSize: theme.fontSize.sm * fontScale },
                            ]}
                            onPress={() => navigation.navigate('Login')}
                        >
                            Already have an account? Log in
                        </Text>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

export default SignUpScreen;