import { useState } from 'react';
import { SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { CommonActions } from '@react-navigation/native';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import SignUpInHeader from '../components/SignUpInHeader';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { isDarkMode, fontScale } = useTheme();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            Alert.alert('Success', 'Logged in successfully!');
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'HomeStack' }],
                })
            );
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 p-6 justify-center ${isDarkMode ? 'bg-darkBg' : 'bg-light'}`}>
            <KeyboardAvoidingView
                style={tw`flex-1 justify-center p-6`}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={tw`p-6 rounded-lg shadow ${isDarkMode ? 'bg-darkCardBg' : 'bg-white'}`}>
                    {/* Header */}
                    <SignUpInHeader title="Log In" icon="log-in-outline" navigation={navigation} />

                    {/* Email field */}
                    <View
                        style={tw`flex-row items-center border rounded-md mb-4 px-3 ${
                        isDarkMode ? 'border-darkTextSecondary' : 'border-darkTextSecondary'
                        }`}
                    >
                        <Ionicons
                        name="mail-outline"
                        size={theme.fontSize.xl}
                        color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                        style={tw`mr-2`}
                        />
                        <TextInput
                            style={[
                                tw`flex-1 border p-3 rounded-md m-1 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale,
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    borderColor: theme.colors.darkTextSecondary,
                                },
                            ]}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                        />
                    </View>

                    {/* Password Field */}
                    <View
                        style={tw`flex-row items-center border rounded-md mb-4 px-3 border-darkTextSecondary`}
                    >
                        <Ionicons
                        name="lock-closed-outline"
                        size={theme.fontSize.xl}
                        color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                        style={tw`mr-2`}
                        />
                        <TextInput
                            style={[
                                tw`flex-1 border border-darkTextSecondary p-3 rounded-md m-1 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale,
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    // borderColor: theme.colors.darkTextSecondary,
                                },
                            ]}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                        />
                    </View>
                    {/* Login button */}
                    <TouchableOpacity onPress={handleLogin} style={tw`py-3 rounded-md mb-4 ${isDarkMode ? 'bg-darkForest' : 'bg-evergreen'}`}>
                        <ThemedText variant="lg" fontFamily="poppins-semibold" color={theme.colors.white} style={tw`text-center`}>
                            Log In
                        </ThemedText>
                    </TouchableOpacity>
                    {/* Sign Up Link */}
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <ThemedText variant="sm" fontFamily="roboto-var" style={tw`text-center ${isDarkMode ? 'text-sky' : 'text-forest'}`}>
                            Don't have an account? Sign Up
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};