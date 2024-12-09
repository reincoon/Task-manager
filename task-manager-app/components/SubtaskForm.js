import { TextInput, TouchableOpacity, Text, Picker, Button } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const SubtaskForm = ({ currentSubtask, setCurrentSubtask, showSubtaskDatePicker, setShowSubtaskDatePicker, notificationOptions, handleAddSubtask }) => {
    return (
        <>
            <TextInput
                style={styles.input}
                value={currentSubtask.title}
                onChangeText={(text) => setCurrentSubtask({ ...currentSubtask, title: text })}
                placeholder="Subtask Title"
            />
            <TouchableOpacity
                style={styles.button}
                onPress={() => setCurrentSubtask({
                    ...currentSubtask,
                    priority: currentSubtask.priority === 'Low' ? 'High' : 'Low',
                })}
            >
                <Text style={styles.buttonText}>Priority: {currentSubtask.priority}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={() => setCurrentSubtask({
                    ...currentSubtask,
                    isRecurrent: !currentSubtask.isRecurrent,
                })}
            >
                <Text style={styles.buttonText}>Recurrent: {currentSubtask.isRecurrent ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => setShowSubtaskDatePicker(true)}>
                <Text style={styles.buttonText}>Pick Date for Subtask</Text>
            </TouchableOpacity>

            {showSubtaskDatePicker && (
                <DateTimePicker
                    value={currentSubtask.dueDate}
                    mode="datetime"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowSubtaskDatePicker(false);
                        if (selectedDate) {
                            setCurrentSubtask({ ...currentSubtask, dueDate: selectedDate });
                        }
                    }}
                />
            )}

            <TouchableOpacity style={styles.button}>
                <Picker
                    selectedValue={currentSubtask.reminder}
                    onValueChange={(value) => setCurrentSubtask({ ...currentSubtask, reminder: value })}
                    style={styles.picker}
                >
                    {notificationOptions.map((option) => (
                        <Picker.Item key={option} label={option} value={option} />
                    ))}
                </Picker>
            </TouchableOpacity>

            <Button title="Save Subtask" onPress={handleAddSubtask} />
        </>
    );
};

const styles = {
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
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
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
    },
};

export default SubtaskForm;