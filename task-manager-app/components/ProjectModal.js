import { View, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '../helpers/ThemeContext';
import tw, { theme } from '../twrnc';
import ThemedText from './ThemedText';

export default function ProjectModal({ visible, onCancel, onCreate }) {
    const [projectName, setProjectName] = useState('');
    const { isDarkMode, fontScale } = useTheme();

    const modalBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.white;
    const inputBg = isDarkMode ? theme.colors.darkBg : theme.colors.light;
    const borderColor = isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary;
    const buttonBgCreate = isDarkMode ? theme.colors.darkSky : theme.colors.sky;
    const buttonBgCancel = isDarkMode ? theme.colors.darkCinnabar : theme.colors.cinnabar;

    useEffect(() => {
        if (!visible) {
            setProjectName('');
        }
    }, [visible]);

    const handleCreate = () => {
        if (!projectName.trim()) {
            Alert.alert('Error', 'Project name is required');
            return;
        }
        onCreate(projectName.trim());
    };

    const handleCancel = () => {
        setProjectName('');
        onCancel();
    };

    return (
        <Modal visible={visible} transparent animationType='fade'>
            <View style={tw`flex-1 justify-center items-center bg-darkBg/40`}>
                <View style={[tw`w-4/5 p-4 rounded-lg`, { backgroundColor: modalBg }]}>
                    <ThemedText variant="lg" style={tw`font-bold mb-3 text-center`}>
                        Name your new project:
                    </ThemedText>
                    <TextInput
                        style={[
                            tw`w-full p-3 rounded-md mt-2`,
                            {
                                backgroundColor: inputBg,
                                borderColor: borderColor,
                                borderWidth: 1,
                                color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                fontSize: theme.fontSize.base * fontScale,
                            },
                        ]}
                        value={projectName}
                        onChangeText={setProjectName}
                        placeholder='Enter Project Name'
                        placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
                    />
                    <View style={tw`flex-row justify-around mt-5`}>
                        <TouchableOpacity 
                            style={[tw`px-4 py-2 rounded-md`, { backgroundColor: buttonBgCreate }]} 
                            onPress={handleCreate}
                        >
                            <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.textSecondary}>
                                Create
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[tw`px-4 py-2 rounded-md`, { backgroundColor: buttonBgCancel }]}
                            onPress={handleCancel}
                        >
                            <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.white}>
                                Cancel
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};