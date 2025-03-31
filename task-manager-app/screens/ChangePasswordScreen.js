import { useState } from 'react';
import { SafeAreaView, TextInput, View, Alert } from 'react-native';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ActionButton from '../components/ActionButton';
import SignUpInHeader from '../components/SignUpInHeader';

export default function ChangePasswordScreen({ navigation }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const { isDarkMode, fontScale } = useTheme();

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) Alert.alert('Error', 'New passwords do not match.');

        try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            
            await reauthenticateWithCredential(user, credential);
            
            await updatePassword(user, newPassword);
            Alert.alert('Success', 'Password updated successfully');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView style={tw`${isDarkMode ? 'bg-darkBg' : 'bg-light'} flex-1 p-6`}>
            <SignUpInHeader title="Change Password" icon="lock-closed-outline" navigation={navigation} />
            
            {/* Input Fields */}
            <View style={tw`m-6 gap-4 p-4 rounded-xl shadow-lg ${isDarkMode ? 'bg-darkBg' : 'bg-white'}`}>
                <TextInput
                    style={[
                        tw`border p-3 rounded-md font-roboto-var`,
                        {
                            fontSize: theme.fontSize.base * fontScale,
                            color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                            borderColor: isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary,
                            backgroundColor: isDarkMode ? theme.colors.darkBg : theme.colors.white,
                        },
                    ]}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                />
                <TextInput
                    style={[
                        tw`border p-3 rounded-md font-roboto-var`,
                        {
                            fontSize: theme.fontSize.base * fontScale,
                            color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                            borderColor: isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary,
                            backgroundColor: isDarkMode ? theme.colors.darkBg : theme.colors.white,
                        },
                    ]}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                />
                <TextInput
                    style={[
                        tw`border p-3 rounded-md font-roboto-var`,
                        {
                            fontSize: theme.fontSize.base * fontScale,
                            color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                            borderColor: isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary,
                            backgroundColor: isDarkMode ? theme.colors.darkBg : theme.colors.white,
                        },
                    ]}
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry
                    placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
                />
            </View>
            {/* Change Password Button */}
            <ActionButton 
                title="Change Password" 
                onPress={handleChangePassword} 
                bgColor={theme.colors.forest} 
                shadowColor={theme.colors.evergreen} 
                iconName="checkmark-outline"
                textColor={theme.colors.white}
                width="90%"
            />
        </SafeAreaView>
    );
};