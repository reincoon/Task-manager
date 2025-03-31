import { Text } from 'react-native';
import { useTheme } from '../helpers/ThemeContext';
import { theme } from '../twrnc';

export default function ThemedText({ variant = 'base', fontFamily = 'poppins-regular', color, style, children, ...props }) {
    const { isDarkMode, fontScale } = useTheme();

    const defaultColor = isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary;

    // Multiply the base font size by the user-controlled scale
    const computedFontSize = theme.fontSize[variant] 
        ? theme.fontSize[variant] * fontScale
        : theme.fontSize.base * fontScale;

    const combinedStyle = [
        {
            color: color || defaultColor,
            fontSize: computedFontSize,
            fontFamily: fontFamily,
        },
        style
    ];

    return (
        <Text style={combinedStyle} {...props}>{children}</Text>
    );
}