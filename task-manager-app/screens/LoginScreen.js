import { useState } from 'react';
import { SafeAreaView, TextInput, TouchableOpacity, Text, Alert, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { CommonActions } from '@react-navigation/native';
import tw from '../twrnc';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
        <SafeAreaView style={tw`flex-1 bg-light p-6 justify-center`}>
            <View style={tw`bg-white p-6 rounded-lg shadow`}>
                <Text style={tw`text-3xl font-extrabold text-center mb-6 font-inter text-textPrimary`}>
                    Log In
                </Text>
                <TextInput
                    style={tw`border border-gray-300 p-3 rounded-md mb-4 font-roboto text-base`}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#888"
                />
                <TextInput
                    style={tw`border border-gray-300 p-3 rounded-md mb-4 font-roboto text-base`}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#888"
                />
                <TouchableOpacity onPress={handleLogin} style={tw`py-3 bg-sky rounded-md mb-4`}>
                    <Text style={tw`text-center font-bold text-white font-inter`}>Log In</Text>
                </TouchableOpacity>
                <Text style={tw`text-center font-roboto text-blue-500`} onPress={() => navigation.navigate('SignUp')}>
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