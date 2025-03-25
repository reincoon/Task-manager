import { TouchableOpacity, View } from "react-native";
import tw, { theme } from "../twrnc";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../helpers/ThemeContext";
import ThemedText from "./ThemedText";

export default function ActionButton({ 
    title, 
    onPress, 
    bgColor, 
    shadowColor, 
    iconName, 
    textColor, 
    width = '80%', 
    size = "lg" 
}) {
    const { fontScale } = useTheme();

    const baseStyle = {
        ...tw`flex-row items-center justify-center py-3 px-5 rounded-lg my-2`,
        backgroundColor: bgColor,
        alignSelf: 'center',
        width: width,
        shadowColor: shadowColor || theme.colors.darkBg,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    };
    return (
        <TouchableOpacity style={baseStyle} onPress={onPress}>
            {iconName && (
                <View style={tw`mr-2`}>
                    <Ionicons name={iconName} size={theme.fontSize.xl * fontScale} color={textColor} />
                </View>
            )}
            <ThemedText variant={size} style={{ color: textColor, textAlign: 'center' }}>
                {title}
            </ThemedText>
        </TouchableOpacity>
    );
};