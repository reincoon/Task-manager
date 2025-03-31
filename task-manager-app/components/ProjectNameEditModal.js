import { Modal, View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../helpers/ThemeContext';
import tw, { theme } from '../twrnc';
import ThemedText from './ThemedText';

export default function ProjectNameEditModal({ visible, onClose, onSave, projectName, projectId, onChangeProjectName }) {
    const { isDarkMode, fontScale } = useTheme();
    // Colours
    const modalBg = isDarkMode ? theme.colors.textPrimary : theme.colors.white;
    const borderColour = isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary;
    const inputBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.light;
    
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={tw`flex-1 justify-center items-center bg-darkBg/50`}>
                <View style={[tw`w-4/5 p-4 rounded-md`, { backgroundColor: modalBg }]}>
                    <ThemedText variant="lg" style={tw`font-bold mb-4 text-center`}>
                        Edit Project Name
                    </ThemedText>
                    <TextInput
                        style={[
                            tw`w-full p-3 rounded-md mb-4`,
                            {
                                backgroundColor: inputBg,
                                borderColor: borderColour,
                                borderWidth: 1,
                                color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                fontSize: theme.fontSize.base * fontScale,
                            },
                        ]}
                        value={projectName}
                        onChangeText={onChangeProjectName}
                        placeholder="Enter new project name"
                        placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : theme.colors.darkTextSecondary}
                    />
                    <View style={tw`flex-row justify-around`}>
                        <TouchableOpacity
                            style={tw`px-4 py-2 rounded-md bg-sky`}
                            onPress={() => onSave(projectId, projectName)}
                        >
                            <ThemedText variant="base" style={tw`text-textPrimary font-bold`}>
                                Save
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`px-4 py-2 rounded-md bg-cinnabar`}
                            onPress={onClose}
                        >
                            <ThemedText variant="base" style={tw`text-white font-bold`}>
                                Cancel
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}