import { Modal, View, TouchableOpacity, TextInput, Button, StyleSheet } from 'react-native';
import { useTheme } from '../helpers/ThemeContext';
import tw, { theme } from '../twrnc';
import ThemedText from './ThemedText';

export default function ProjectNameEditModal({ visible, onClose, onSave, projectName, projectId, onChangeProjectName }) {
    const { isDarkMode, fontScale } = useTheme();
    const overlayBg = 'rgba(0, 0, 0, 0.5)';
    const modalBg = isDarkMode ? theme.colors.darkBg : theme.colors.white;
    const borderColor = isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary;
    const inputBg = isDarkMode ? theme.colors.darkEvergreen : theme.colors.light;
    
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: overlayBg }]}>
                <View style={[tw`w-4/5 p-4 rounded-md`, { backgroundColor: modalBg }]}>
                    <ThemedText variant="lg" style={tw`font-bold mb-4 text-center`}>
                        Edit Project Name
                    </ThemedText>
                    {/* <TextInput
                        style={styles.input}
                        value={projectName}
                        onChangeText={onChangeProjectName}
                    /> */}
                    <TextInput
                        style={[
                            tw`w-full p-3 rounded-md mb-4`,
                            {
                                backgroundColor: inputBg,
                                borderColor,
                                borderWidth: 1,
                                color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                fontSize: theme.fontSize.base * fontScale,
                            },
                        ]}
                        value={projectName}
                        onChangeText={onChangeProjectName}
                        placeholder="Enter new project name"
                        placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : '#777'}
                    />
                    {/* <Button title="Save" onPress={() => onSave(projectId, projectName)} />
                    <Button title="Cancel" onPress={onClose} /> */}
                    <View style={tw`flex-row justify-around`}>
                        <TouchableOpacity
                            style={[tw`px-4 py-2 rounded-md`, { backgroundColor: theme.colors.sky }]}
                            onPress={() => onSave(projectId, projectName)}
                        >
                            <ThemedText variant="base" style={tw`text-white font-bold`}>
                                Save
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[tw`px-4 py-2 rounded-md`, { backgroundColor: theme.colors.cinnabar }]}
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        margin: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
    },
    label: {
        fontSize: 24,
        marginBottom: 20,
    },
    input: {
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        borderRadius: 5,
    },
});