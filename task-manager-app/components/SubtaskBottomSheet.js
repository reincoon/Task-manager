import { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationPicker from './NotificationPicker';
import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimeSelector from './DateTimeSelector';
import SpeechToTextButton from './SpeechToTextButton';
import ThemedText from './ThemedText';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import PrioritySegmentedControl from './PrioritySegmentedControl';

export default function SubtaskBottomSheet({
    visible,
    onClose,
    currentSubtask,
    setCurrentSubtask,
    onSave,
}) {
    const { isDarkMode, fontScale } = useTheme();
    const snapPoints = useMemo(() => ['50%', '90%'], []);

    if (!visible) {
        return null;
    }

    const handleDateChange = (newDate) => {
        setCurrentSubtask({ ...currentSubtask, dueDate: newDate });
    };

    const handleCloseSheet = () => {
        onClose();
    };

    const validSubtaskDate = (currentSubtask.dueDate instanceof Date && !isNaN(currentSubtask.dueDate.getTime())) 
        ? currentSubtask.dueDate 
        : new Date();

    return (
        <View style={tw`absolute inset-0 bg-darkBg/30`}>
            <BottomSheet
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
                <BottomSheetScrollView contentContainerStyle={tw`p-5 pb-8 ${isDarkMode ? 'bg-darkBg' : 'bg-white'}`}>
                    <ThemedText
                        variant="xl"
                        fontFamily="poppins-bold"
                        style={tw`mb-4 text-center`}
                        color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary}
                    >
                        Add Subtask
                    </ThemedText>
                    <View style={tw`flex-row items-center mb-4`}>
                        <TextInput
                            style={tw`flex-1 border rounded-lg px-3 py-2 ${
                                isDarkMode ? 'bg-darkCardBg border-darkTextSecondary' : 'bg-white border-darkTextSecondary'
                            }`}
                            value={currentSubtask.title}
                            onChangeText={(text) => setCurrentSubtask({ ...currentSubtask, title: text })}
                            placeholder="Subtask Title"
                            placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : theme.colors.darkTextSecondary}
                            multiline
                        />
                        <SpeechToTextButton onTranscribedText={(text) => setCurrentSubtask({ ...currentSubtask, title: text })}/>
                    </View>
                    {/* <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            setCurrentSubtask({
                                ...currentSubtask,
                                priority: cyclePriority(currentSubtask.priority),
                            })
                        }
                    >
                        <Text style={styles.buttonText}>Priority: {currentSubtask.priority}</Text>
                    </TouchableOpacity> */}
                    <View style={tw`mb-4`}>
                        <ThemedText
                            variant="base"
                            fontFamily="poppins-semibold"
                            style={tw`mb-2`}
                            color={isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary}
                        >
                            Priority:
                        </ThemedText>
                        <PrioritySegmentedControl
                            selectedPriority={currentSubtask.priority}
                            onSelectPriority={(val) =>
                                setCurrentSubtask({ ...currentSubtask, priority: val })
                            }
                        />
                    </View>
                    <View style={tw`mb-1 flex-row`}>
                        {/* Date and Time selector */}
                        <View style={tw`flex-2 mr-2 mb-4`}>
                            <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                                Due Date:
                            </ThemedText>
                            <DateTimeSelector date={validSubtaskDate} onDateChange={handleDateChange} />
                        </View>
                        {/* Notification Picker */}
                        <View style={tw`flex-1 ml-2 mb-4`}>
                            <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                                Reminder:
                            </ThemedText>
                            <View 
                                style={[
                                    tw`rounded-lg border`,
                                    { 
                                        borderColor: isDarkMode ? theme.colors.darkTextSecondary : theme.colors.darkTextSecondary, 
                                        backgroundColor: isDarkMode ? theme.colors.darkCardBg : theme.colors.white
                                    }
                                ]}
                            >
                                <NotificationPicker
                                    selectedValue={currentSubtask.reminder}
                                    onValueChange={(value) =>
                                        setCurrentSubtask({ ...currentSubtask, reminder: value })
                                    }
                                    options={NOTIFICATION_OPTIONS}
                                />
                            </View>
                        </View>
                    </View>
                    {/* Save and Cancel buttons */}
                    <View style={tw`flex-row justify-end`}>
                        <TouchableOpacity 
                            style={tw`${isDarkMode ? 'bg-darkMint' : 'bg-mint'} rounded-full p-3 mr-3`} 
                            onPress={onSave}
                        >
                            <Ionicons name="checkmark" size={theme.fontSize.xl2 * fontScale} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={tw`${isDarkMode ? 'bg-darkCinnabar' : 'bg-cinnabar'} rounded-full p-3`} 
                            onPress={handleCloseSheet}
                        >
                            <Ionicons name="close" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
};
