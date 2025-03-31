import { View, TouchableOpacity } from 'react-native';
import { COLOURS } from '../helpers/constants';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

export default function ColourPicker({ selectedColour, onSelectColour }) {
    const { isDarkMode } = useTheme();
    const currentColour = selectedColour;

    return (
        <View style={tw`flex-row flex-wrap justify-between my-2`}>
            {COLOURS.map(colour => (
                <TouchableOpacity
                    key={colour.name + colour.value}
                    style={[
                        tw`w-10 h-10 rounded-full m-1 border-2`,
                        { 
                            backgroundColor: colour.value, 
                            borderColor: currentColour === colour.value
                                ? (isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary)
                                : (isDarkMode ? theme.colors.textPrimary : theme.colors.darkTextPrimary),
                        },
                    ]}
                    onPress={() => onSelectColour(colour.value)}
                />
            ))}
        </View>
    );
};