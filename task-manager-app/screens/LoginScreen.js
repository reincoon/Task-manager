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

const LoginScreen = ({ navigation }) => {
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
                        size={20}
                        color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                        style={tw`mr-2`}
                        />
                        <TextInput
                            style={[
                                tw`flex-1 border p-3 rounded-md m-1 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale,
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    borderColor: isDarkMode ? theme.colors.darkTextSecondary : '#ccc',
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
                        style={tw`flex-row items-center border rounded-md mb-4 px-3 ${
                            isDarkMode ? 'border-darkTextSecondary' : 'border-darkTextSecondary'
                        }`}
                    >
                        <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                        style={tw`mr-2`}
                        />
                        <TextInput
                            style={[
                                tw`flex-1 border p-3 rounded-md m-1 font-roboto-var`,
                                { 
                                    fontSize: theme.fontSize.base * fontScale,
                                    color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                    borderColor: isDarkMode ? theme.colors.darkTextSecondary : '#ccc',
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
                        {/* <Text 
                            style={[
                                tw`text-center font-poppins-semibold`,
                                { 
                                    fontSize: theme.fontSize.lg * fontScale,
                                    color: theme.colors.textPrimary
                                },
                            ]}
                        >
                            Log In
                        </Text> */}

                        <ThemedText variant="lg" style={tw`text-center font-poppins-semibold text-white`}>
                            Log In
                        </ThemedText>
                    </TouchableOpacity>
                    {/* <Text 
                        style={[
                            tw`text-center font-roboto-var`,
                            { 
                                fontSize: theme.fontSize.sm * fontScale, 
                                color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary 
                            },
                        ]}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        Don't have an account? Sign Up
                    </Text> */}
                    {/* Sign Up Link */}
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <ThemedText variant="sm" style={tw`text-center font-roboto-var ${isDarkMode ? 'text-sky' : 'text-forest'}`}>
                            Don't have an account? Sign Up
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//         justifyContent: 'center',
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         padding: 10,
//         marginBottom: 20,
//         borderRadius: 5,
//     },
//     link: {
//         marginTop: 20,
//         color: 'blue',
//         textAlign: 'center',
//     },
// });

export default LoginScreen;  