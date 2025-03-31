import { View, TouchableOpacity } from 'react-native';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';
import { PRIORITIES } from '../helpers/constants';
import { PRIORITY_COLOURS } from '../helpers/constants';

export default function PrioritySegmentedControl({ selectedPriority, onSelectPriority }) {
    const { isDarkMode, fontScale } = useTheme();

    // Colours
    const unselectedBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.darkTextSecondary;
    const unselectedText = isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary;

    return (
        <View style={tw`flex-row justify-between items-center`}>
            {PRIORITIES.map((option) => {
                const isSelected = option === selectedPriority;
                const backgroundColour = isSelected
                    ? PRIORITY_COLOURS[option] || theme.colors.cinnabar
                    : unselectedBg;
                    const textColour = isSelected ? theme.colors.white : unselectedText;

                return (
                    <TouchableOpacity
                        key={option}
                        style={[
                            tw`px-2 py-2 flex-1 rounded`,
                            {
                                backgroundColor: backgroundColour,
                            }
                        ]}
                        onPress={() => onSelectPriority(option)}
                    >
                        <ThemedText
                            variant="sm"
                            fontFamily="poppins-semibold"
                            style={{
                                color: textColour,
                                alignSelf: 'center',
                            }}
                        >
                            {option}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}