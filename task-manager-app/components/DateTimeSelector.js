import { useState } from 'react';
import { Platform, TouchableOpacity, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateTime } from '../helpers/date';

const DateTimeSelector = ({ date, onDateChange }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

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
        <View>
            <TouchableOpacity 
                style={{
                    backgroundColor: '#007bff',
                    padding: 10,
                    marginBottom: 20,
                    borderRadius: 5,
                }} 
                onPress={openPicker}
            >
                <Text style={{ color: '#fff', textAlign: 'center' }}>
                    Set Due Date: {formatDateTime(safeDate)}
                </Text>
            </TouchableOpacity>
    
            {/* iOS combined datetime picker */}
            {showDatePicker && Platform.OS === 'ios' && (
                <DateTimePicker
                    value={safeDate}
                    mode="datetime"
                    display="default"
                    onChange={onDateSelected}
                />
            )}
    
            {/* Android date picker */}
            {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={safeDate}
                    mode="date"
                    display="default"
                    onChange={onDateSelected}
                />
            )}
    
            {/* Android time picker, shown after date is selected */}
            {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={safeDate}
                    mode="time"
                    display="default"
                    onChange={onTimeSelected}
                />
            )}
        </View>
    );
};
    
export default DateTimeSelector;