import { useState } from 'react';
import { SafeAreaView, TextInput, Button, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
// import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// import { CommonActions } from '@react-navigation/native';
import { handleUpgradeAnonymousAccount } from '../helpers/authFunctions';
import tw from '../twrnc';

const SignUpScreen = ({ navigation, route }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
        <SafeAreaView style={tw`flex-1 bg-light p-6 justify-center`}>
            <View style={tw`bg-white p-6 rounded-lg shadow`}>
                <Text style={tw`text-3xl font-extrabold text-center mb-6 font-inter text-textPrimary`}>Sign Up</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#007BFF" />
                ) : (
                    <>
                        <TextInput
                            style={tw`border border-gray-300 p-3 rounded-md mb-4 font-roboto text-base`}
                            placeholder="Name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#888"
                        />
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
                        <TextInput
                            style={tw`border border-gray-300 p-3 rounded-md mb-4 font-roboto text-base`}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            placeholderTextColor="#888"
                        />
                        <TouchableOpacity onPress={handleSignUp} style={tw`py-3 bg-forest rounded-md mb-4`}>
                            <Text style={tw`text-center font-bold text-white font-poppins`}>Sign Up</Text>
                        </TouchableOpacity>
                        <Text style={tw`text-center font-roboto text-blue-500`} onPress={() => navigation.navigate('Login')}>
                            Already have an account? Log in
                        </Text>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

export default SignUpScreen;