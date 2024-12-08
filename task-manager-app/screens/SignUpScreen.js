import { useState } from 'react';
import { SafeAreaView, TextInput, Button, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
// import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// import { CommonActions } from '@react-navigation/native';
import { handleUpgradeAnonymousAccount } from '../helpers/authFunctions';

const SignUpScreen = ({ navigation }) => {
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

        // try {
        //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        //     const user = userCredential.user;
        //     await updateProfile(user, { displayName: name });
        //     Alert.alert('Success', 'Account created successfully');
        //     navigation.dispatch(
        //         CommonActions.reset({
        //             index: 0,
        //             routes: [{ name: 'HomeStack' }],
        //         })
        //     );
        // } catch (error) {
        //     Alert.alert('Error', error.message);
        // }
        await handleUpgradeAnonymousAccount(auth, email, password, name, setLoading, navigation);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>
            {loading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                    <Button title="Sign Up" onPress={handleSignUp} />
                    <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
                        Already have an account? Log in
                    </Text>
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    link: {
        marginTop: 20,
        color: 'blue',
        textAlign: 'center',
    },
});

export default SignUpScreen;