import { useState } from 'react';
import { SafeAreaView, TextInput, TouchableOpacity, Text, Alert, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { CommonActions } from '@react-navigation/native';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

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
            <View style={tw`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <Text style={[
                    tw`text-center mb-6 font-inter-var`,
                    { 
                        fontSize: theme.fontSize.xl3 * fontScale, 
                        color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary, 
                    },
                ]}>
                    Log In
                </Text>
                <TextInput
                    style={[
                        tw`border p-3 rounded-md mb-4 font-roboto-var`,
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
                <TextInput
                    style={[
                        tw`border p-3 rounded-md mb-4 font-roboto-var`,
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
                <TouchableOpacity onPress={handleLogin} style={tw`py-3 rounded-md mb-4 ${isDarkMode ? 'bg-darkMint' : 'bg-sky'}`}>
                    <Text 
                        style={[
                            tw`text-center font-poppins-semibold`,
                            { 
                                fontSize: theme.fontSize.lg * fontScale,
                                color: theme.colors.textPrimary
                            },
                        ]}
                    >
                        Log In
                    </Text>
                </TouchableOpacity>
                <Text 
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
                </Text>
            </View>
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