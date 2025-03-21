import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

// Open a project creation modal
const AddProjectButton = ({ onPress, label = 'Add Project' }) => {
    const { isDarkMode } = useTheme();

    return (
        <TouchableOpacity 
            style={[tw`flex-row items-center px-2 py-2 rounded-full border shadow-lg`,
                {
                    backgroundColor: isDarkMode ? theme.colors.textPrimary : theme.colors.white,
                    borderColor: isDarkMode ? theme.colors.mint : theme.colors.darkMint,
                }
            ]} 
            onPress={onPress}
        >
            <Ionicons name="add-circle" size={theme.fontSize.xl3} color={theme.colors.darkMint} />
            <ThemedText variant="base" fontFamily="poppins-medium" color={isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary} style={tw`ml-2`}>
                {label}
            </ThemedText>
        </TouchableOpacity>
    );
};

export default AddProjectButton;

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#007bff',
    },
    buttonLabel: {
        marginLeft: 5,
        color: '#007bff',
        fontSize: 16,
    },
});

