import { View, Switch } from 'react-native';
import tw, { theme } from '../twrnc';
import ThemedText from './ThemedText';

export default function ThemeToggle({ isDark, onToggle }) {
    return (
        <View style={tw`flex-row items-center justify-center my-4`}>
            <ThemedText variant="sm" style={tw`mr-2`}>Light</ThemedText>
            <Switch
                value={isDark}
                onValueChange={onToggle}
                thumbColor={isDark ? theme.colors.darkMint : theme.colors.mint }
                trackColor={{ false: theme.colors.sky, true: theme.colors.evergreen }}
            />
            <ThemedText variant="sm" style={tw`mr-2`}>Dark</ThemedText>
        </View>
    );
};