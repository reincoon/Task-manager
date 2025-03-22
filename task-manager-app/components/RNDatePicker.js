import { useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from "../helpers/ThemeContext";
import ActionButton from "./ActionButton";
import tw, { theme } from "../twrnc";

export default function RNDatePicker({ date, onConfirm, mode = 'date', label = 'Select Date', buttonWidth = '100%', bgColor }) {
    const [show, setShow] = useState(false);
    const { isDarkMode } = useTheme();

    const defaultBg = isDarkMode ? theme.colors.darkMint : theme.colors.mint;
    const buttonBgColor = bgColor || defaultBg;

    const handleChange = (event, selectedDate) => {
        // If user closes the picker or chooses date, the picker is hidden    
        setShow(false);
        
        if (selectedDate) {
            // If a valid date is chosen, pass it back
            onConfirm?.(selectedDate);
        }
    };

    return (
        <View style={tw`my-2`}>
            <ActionButton
                title={date ? date.toLocaleDateString() : label}
                onPress={() => setShow(true)}
                width={buttonWidth}
                bgColor={buttonBgColor}
                textColor={theme.colors.textPrimary}
                iconName="calendar-outline"
                size="base"
            />
        
            {show && (
                <DateTimePicker
                    value={date || new Date()}
                    mode={mode}
                    display="default"
                    onChange={handleChange}
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                />
            )}
        </View>
    );
}