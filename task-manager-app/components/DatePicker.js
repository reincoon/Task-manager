import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity, Text } from 'react-native';

const DatePicker = ({ date, showDatePicker, setShowDatePicker, setDate, title }) => {
    return (
        <>
            <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.buttonText}>{title}: {date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="datetime"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setDate(selectedDate);
                        }
                    }}
                />
            )}
        </>
    );
};

const styles = {
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },
};

export default DatePicker;