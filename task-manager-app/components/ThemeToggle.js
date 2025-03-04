import { View, Text, Switch } from 'react-native';
import tw from '../twrnc';

export default function ThemeToggle({ isDark, onToggle }) {
    return (
        <View style={tw`flex-row items-center justify-center my-4`}>
            <Text style={isDark ? tw`text-darkTextPrimary` : tw`text-textPrimary`}>Light</Text>
            <Switch
                value={isDark}
                onValueChange={onToggle}
                thumbColor={isDark ? "#7A0064" : "#A4FCB4"}
                trackColor={{ false: "#9EE1F0", true: "#416147" }}
            />
            <Text style={isDark ? tw`text-darkTextPrimary` : tw`text-textPrimary`}>Dark</Text>
        </View>
    );
};