import { useState } from 'react';
import { SafeAreaView, TextInput, KeyboardAvoidingView, Platform, View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// import { CommonActions } from '@react-navigation/native';
import { handleUpgradeAnonymousAccount } from '../helpers/authFunctions';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from '../components/ThemedText';
import SignUpInHeader from '../components/SignUpInHeader';

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
            <KeyboardAvoidingView
                style={tw`flex-1 justify-center p-6`}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={tw`p-6 rounded-lg shadow ${isDarkMode ? 'bg-darkCardBg' : 'bg-white'}`}>
                    {/* Header Row */}
                    <SignUpInHeader title="Sign Up" icon="person-add-outline" navigation={navigation} />
                    
                    {loading ? (
                        <ActivityIndicator size="large" color="#007BFF" />
                    ) : (
                        <>
                            {/* Name Field */}
                            <View
                                style={tw`flex-row items-center border rounded-md mb-4 px-3 ${
                                    isDarkMode ? 'border-darkTextSecondary' : 'border-darkTextSecondary'
                                }`}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={theme.fontSize.xl * fontScale}
                                    color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                                    style={tw`mr-2`}
                                />
                                <TextInput
                                    style={[
                                        tw`flex-1 border p-3 rounded-md m-1 font-roboto-var`,
                                        {
                                            fontSize: theme.fontSize.base * fontScale,
                                            color: isDarkMode
                                                ? theme.colors.darkTextPrimary
                                                : theme.colors.textPrimary,
                                            borderColor: isDarkMode
                                                ? theme.colors.darkTextSecondary
                                                : '#ccc',
                                        },
                                    ]}
                                    placeholder="Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor={
                                        isDarkMode ? theme.colors.darkTextSecondary : '#888'
                                    }
                                />
                            </View>
                            {/* Email Field */}
                            <View
                                style={tw`flex-row items-center border rounded-md mb-4 px-3 ${
                                    isDarkMode ? 'border-darkTextSecondary' : 'border-darkTextSecondary'
                                }`}
                            >
                                <Ionicons
                                    name="mail-outline"
                                    size={theme.fontSize.xl * fontScale}
                                    color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                                    style={tw`mr-2`}
                                />
                                <TextInput
                                    style={[
                                        tw`flex-1 border p-3 rounded-md m-1 font-roboto-var`,
                                        {
                                            fontSize: theme.fontSize.base * fontScale,
                                            color: isDarkMode
                                                ? theme.colors.darkTextPrimary
                                                : theme.colors.textPrimary,
                                            borderColor: isDarkMode
                                                ? theme.colors.darkTextSecondary
                                                : '#ccc',
                                        },
                                    ]}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor={
                                        isDarkMode ? theme.colors.darkTextSecondary : '#888'
                                    }
                                />
                            </View>

                            {/* Password Field */}
                            <View
                                style={tw`flex-row items-center border rounded-md mb-4 px-3 ${
                                    isDarkMode ? 'border-darkTextSecondary' : 'border-darkTextSecondary'
                                }`}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={theme.fontSize.xl * fontScale}
                                    color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                                    style={tw`mr-2`}
                                />
                                <TextInput
                                    style={[
                                        tw`flex-1 border p-3 rounded-md m-1 font-roboto-var`,
                                        {
                                            fontSize: theme.fontSize.base * fontScale,
                                            color: isDarkMode
                                                ? theme.colors.darkTextPrimary
                                                : theme.colors.textPrimary,
                                            borderColor: isDarkMode
                                                ? theme.colors.darkTextSecondary
                                                : '#ccc',
                                        },
                                    ]}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    placeholderTextColor={
                                        isDarkMode ? theme.colors.darkTextSecondary : '#888'
                                    }
                                />
                            </View>

                            {/* Confirm Password Field */}
                            <View
                                style={tw`flex-row items-center border rounded-md mb-4 px-3 ${
                                    isDarkMode ? 'border-darkTextSecondary' : 'border-darkTextSecondary'
                                }`}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={theme.fontSize.xl * fontScale}
                                    color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                                    style={tw`mr-2`}
                                />
                                <TextInput
                                    style={[
                                        tw`flex-1 border p-3 rounded-md m-1 font-roboto-var`,
                                        {
                                            fontSize: theme.fontSize.base * fontScale,
                                            color: isDarkMode
                                                ? theme.colors.darkTextPrimary
                                                : theme.colors.textPrimary,
                                            borderColor: isDarkMode
                                                ? theme.colors.darkTextSecondary
                                                : '#ccc',
                                        },
                                    ]}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    placeholderTextColor={
                                        isDarkMode ? theme.colors.darkTextSecondary : '#888'
                                    }
                                />
                            </View>
                            {/* Sign up button */}
                            <TouchableOpacity onPress={handleSignUp} style={tw`py-3 rounded-md mb-4 ${isDarkMode ? 'bg-darkForest' : 'bg-forest'}`}>
                                <ThemedText variant="lg" style={tw`text-center font-poppins-semibold text-white`}>
                                    Sign Up
                                </ThemedText>
                            </TouchableOpacity>
                            {/* Link to Login screen */}
                            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={tw`mb-4`}>
                                <ThemedText variant="sm" style={tw`text-center font-roboto-var ${isDarkMode ? 'text-sky' : 'text-forest'}`}>
                                    Already have an account? Log in
                                </ThemedText>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUpScreen;