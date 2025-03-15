import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';

const SignUpInHeader = ({ title, icon, navigation }) => {
    const { isDarkMode, fontScale } = useTheme();

    return (
        <View style={tw`flex-row items-center justify-between mb-6`}>
            {/* Back Arrow */}
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Ionicons
                    name="arrow-back"
                    size={theme.fontSize.xl2 * fontScale}
                    color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary}
                />
            </TouchableOpacity>
        
            {/* Title with Icon */}
            <View style={tw`flex-1 flex-row items-center justify-center`}>
                <Ionicons
                    name={icon}
                    size={theme.fontSize.xl2 * fontScale}
                    color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary}
                    style={tw`mr-2`}
                />
                <ThemedText variant="xl3" style={tw`text-center font-inter-var`} numberOfLines={2}>
                    {title}
                </ThemedText>
            </View>
        
            {/* Placeholder to balance layout */}
            <View style={{ width: theme.fontSize.xl2 * fontScale }} />
        </View>
    );
};

export default SignUpInHeader;