import { useState, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import NotificationPicker from './NotificationPicker';
import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
import { formatDateTime } from '../helpers/date';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimeSelector from './DateTimeSelector';

// const BOTTOM_SHEET_HEIGHT_COLLAPSED = 300;
// const BOTTOM_SHEET_HEIGHT_EXPANDED = '90%';

const SubtaskBottomSheet = ({
    visible,
    onClose,
    currentSubtask,
    setCurrentSubtask,
    onSave,
}) => {
    // const [expanded, setExpanded] = useState(false);
    // const [showDatePicker, setShowDatePicker] = useState(false);

    const bottomSheetRef = useRef(null);

    const snapPoints = useMemo(() => ['50%', '90%'], []);
    if (!visible) {
        return null;
    }

    // const handleDateChange = (event, selectedDate) => {
    //     setShowDatePicker(false);
    //     if (selectedDate) {
    //         setCurrentSubtask({ ...currentSubtask, dueDate: selectedDate });
    //     }
    // };
    const handleDateChange = (newDate) => {
        setCurrentSubtask({ ...currentSubtask, dueDate: newDate });
    };

    const handleCloseSheet = () => {
        onClose();
    };

    return (
        <View style={styles.overlay}>
            <BottomSheet
                ref={bottomSheetRef}
                index={1} // expanded sheet
                snapPoints={snapPoints}
                onChange={(index) => {
                    if (index === -1) {
                        // the sheet is closed
                        handleCloseSheet();
                    }
                }}
                enablePanDownToClose={true}
                onClose={handleCloseSheet}
            >
                <BottomSheetScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Add Subtask</Text>
                    <TextInput
                        style={styles.input}
                        value={currentSubtask.title}
                        onChangeText={(text) => setCurrentSubtask({ ...currentSubtask, title: text })}
                        placeholder="Subtask Title"
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            setCurrentSubtask({
                                ...currentSubtask,
                                priority: cyclePriority(currentSubtask.priority),
                            })
                        }
                    >
                        <Text style={styles.buttonText}>Priority: {currentSubtask.priority}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            setCurrentSubtask({
                                ...currentSubtask,
                                isRecurrent: !currentSubtask.isRecurrent,
                            })
                        }
                    >
                        <Text style={styles.buttonText}>
                            Recurrent: {currentSubtask.isRecurrent ? 'Yes' : 'No'}
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.buttonText}>
                            Due Date: {formatDateTime(currentSubtask.dueDate)}
                        </Text>
                    </TouchableOpacity> */}

                    <DateTimeSelector date={currentSubtask.dueDate} onDateChange={handleDateChange} />

                    <NotificationPicker
                        selectedValue={currentSubtask.reminder}
                        onValueChange={(value) =>
                            setCurrentSubtask({ ...currentSubtask, reminder: value })
                        }
                        options={NOTIFICATION_OPTIONS}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                            <Ionicons name="checkmark" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCloseSheet}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    content: {
        // paddingHorizontal: 20,
        // flex: 1,
        padding: 20,
        paddingBottom: 30,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
        backgroundColor: '#fff'
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
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: '#28a745',
        borderRadius: 30,
        padding: 10,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        borderRadius: 30,
        padding: 10,
        marginLeft: 10,
    },
});

export default SubtaskBottomSheet;