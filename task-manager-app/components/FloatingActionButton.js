import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

export default function FloatingActionButton({ onPress }) {
    const { isDarkMode, fontScale } = useTheme();
    const bgColor = isDarkMode ? theme.colors.lavender : theme.colors.magenta;

    return (
        <TouchableOpacity 
            style={[
                tw`absolute bottom-6 right-6 w-16 h-16 rounded-full shadow justify-center items-center`, 
                { 
                    backgroundColor: bgColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 6,
                }]} 
            onPress={onPress}
        >
            <Ionicons name="add" size={theme.fontSize.xl3 * fontScale} color={isDarkMode ? theme.colors.darkMagenta : theme.colors.lavender} />
        </TouchableOpacity>
    );
};

// const styles = StyleSheet.create({
//     fab: {
//         position: 'absolute',
//         bottom: 16,
//         right: 16,
//         backgroundColor: 'blue',
//         width: 56,
//         height: 56,
//         borderRadius: 28,
//         justifyContent: 'center',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.3,
//         shadowRadius: 4,
//         elevation: 5,
//     },
// });

// export default FloatingActionButton;  