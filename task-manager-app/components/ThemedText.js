import { Text } from 'react-native';
import { useTheme } from '../helpers/ThemeContext';
import tw, { theme } from '../twrnc';

export default function ThemedText({ variant = 'base', style, children, ...props }) {
    const { isDarkMode, fontScale } = useTheme();

    const color = isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary;

    // Multiply the base font size by the user-controlled scale
    const computedFontSize = theme.fontSize[variant] 
        ? theme.fontSize[variant] * fontScale
        : theme.fontSize.base * fontScale;

    const combinedStyle = [
        {
            color,
            fontSize: computedFontSize
        },
        style
    ];

    return (
        <Text style={combinedStyle} {...props}>{children}</Text>
    );
}