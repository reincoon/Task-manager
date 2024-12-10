import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import NotificationPicker from './NotificationPicker';
import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';

const BOTTOM_SHEET_HEIGHT_COLLAPSED = 300;
const BOTTOM_SHEET_HEIGHT_EXPANDED = '90%';

const SubtaskBottomSheet = ({
    visible,
    onClose,
    currentSubtask,
    setCurrentSubtask,
    onSave,
}) => {
    const [expanded, setExpanded] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    if (!visible) return null;

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setCurrentSubtask({ ...currentSubtask, dueDate: selectedDate });
        }
    };

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.container, expanded ? styles.expanded : styles.collapsed]}>
                <View style={styles.handleBarContainer}>
                    <TouchableOpacity onPress={toggleExpand}>
                        <View style={styles.handleBar} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
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

                    <TouchableOpacity style={styles.button} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.buttonText}>
                            Due Date: {currentSubtask.dueDate.toLocaleString()}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={currentSubtask.dueDate}
                            mode="datetime"
                            display="default"
                            onChange={handleDateChange}
                        />
                    )}

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
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#f5f5f5',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    collapsed: {
        height: BOTTOM_SHEET_HEIGHT_COLLAPSED,
    },
    expanded: {
        height: BOTTOM_SHEET_HEIGHT_EXPANDED,
    },
    handleBarContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    handleBar: {
        width: 60,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#ccc',
    },
    content: {
        paddingHorizontal: 20,
        flex: 1,
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