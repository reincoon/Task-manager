import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';

export default function SettingsStatsHeader({ title, icon }) {
    const { isDarkMode, fontScale } = useTheme();

    return (
        <View style={tw`flex-row items-center justify-center mb-6`}>
            {/* Icon */}
            <Ionicons
                name={icon}
                size={theme.fontSize.xl2 * fontScale}
                color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary}
                style={tw`mr-2`}
            />
            
            {/* Title */}
            <ThemedText 
                variant="xl3" 
                style={tw`text-center font-inter-var`} 
                numberOfLines={2}
            >
                {title}
            </ThemedText>
        </View>
    );
}