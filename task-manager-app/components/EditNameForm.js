import { View, TextInput, TouchableOpacity } from 'react-native';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';
import { Ionicons } from '@expo/vector-icons';

export default function EditNameForm({ name, setName, handleSaveName, handleCancelEdit }) {
    const { isDarkMode, fontScale } = useTheme();

    return (
        // <View style={tw`flex-row items-center mb-4`}>
        <View style={tw`w-full p-4 bg-transparent`}>
            <TextInput 
                style={[
                    tw`border p-3 rounded-md font-roboto-var`,
                    {
                        fontSize: theme.fontSize.base * fontScale,
                        color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                        borderColor: isDarkMode ? theme.colors.darkTextSecondary : theme.colors.forest,
                        backgroundColor: isDarkMode ? theme.colors.darkBg : theme.colors.white,
                    },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : "#888"}
            />
            {/* Buttons */}
            <View style={tw`flex-row justify-between mt-4`}>
                <TouchableOpacity
                    onPress={handleSaveName}
                    style={tw`flex-row items-center justify-center py-3 px-4 rounded-md bg-mint shadow-custom w-[48%]`}
                >
                    <Ionicons name="checkmark-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.textPrimary} style={tw`mr-2`} />
                    <ThemedText variant="lg" style={tw`text-textPrimary`}>
                        Save
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleCancelEdit}
                    style={tw`flex-row items-center justify-center py-3 px-4 rounded-md bg-cinnabar shadow-custom w-[48%]`}
                >
                    <Ionicons name="close-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.white} style={tw`mr-2`} />
                    <ThemedText variant="lg" style={tw`text-white`}>
                        Cancel
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
};