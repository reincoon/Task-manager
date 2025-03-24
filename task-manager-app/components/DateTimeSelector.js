import { useState } from 'react';
import { Platform, TouchableOpacity, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateTime } from '../helpers/date';
import tw, { theme } from '../twrnc';
import ThemedText from './ThemedText';
import { useTheme } from '../helpers/ThemeContext';

const DateTimeSelector = ({ date, onDateChange }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const { isDarkMode } = useTheme();

    const onDateSelected = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            if (Platform.OS === 'android') {
                // On Android, after date selection, show time picker
                onDateChange(newDate);
                setShowTimePicker(true);
            } else {
                // On iOS, mode='datetime' will pick both at once
                onDateChange(newDate);
            }
        }
    };

    const onTimeSelected = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            // Combining chosen time with the already chosen date
            const updatedDate = new Date(date);
            updatedDate.setHours(selectedTime.getHours());
            updatedDate.setMinutes(selectedTime.getMinutes());
            onDateChange(updatedDate);
        }
    };

    const openPicker = () => {
        if (Platform.OS === 'ios') {
            // for iOS show one picker in datetime mode
            setShowDatePicker(true);
        } else {
            // for Android show date picker first
            setShowDatePicker(true);
        }
    };

    const safeDate = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();

    return (
        <View style={tw` ${isDarkMode ? 'bg-grayHd' : 'bg-columnBg'} rounded-lg px-1 py-2 items-center`}>
            <TouchableOpacity 
                style={tw`${isDarkMode ? 'bg-darkForest' : 'bg-forest'} px-3 py-2 rounded-lg mb-5`} 
                onPress={openPicker}
            >
                <ThemedText variant="lg" color={theme.colors.darkTextPrimary}>
                    {formatDateTime(safeDate)}
                </ThemedText>
            </TouchableOpacity>
    
            {/* iOS combined datetime picker */}
            {showDatePicker && Platform.OS === 'ios' && (
                <DateTimePicker
                    value={safeDate}
                    mode="datetime"
                    display="default"
                    onChange={onDateSelected}
                    preferredDatePickerStyle={isDarkMode ? 'compact' : 'wheels'}
                />
            )}
    
            {/* Android date picker */}
            {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={safeDate}
                    mode="date"
                    display="default"
                    onChange={onDateSelected}
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                />
            )}
    
            {/* Android time picker, shown after date is selected */}
            {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={safeDate}
                    mode="time"
                    display="default"
                    onChange={onTimeSelected}
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                />
            )}
        </View>
    );
};
    
export default DateTimeSelector;