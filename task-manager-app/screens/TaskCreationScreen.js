import { SafeAreaView, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import DateTimeSelector from '../components/DateTimeSelector';
import SubtaskList from '../components/SubtaskList';
import AttachmentsList from '../components/AttachmentsList';
import { addAttachmentOfflineAndOnline, removeAttachment } from '../helpers/attachmentHelpers';
import ColourPicker from '../components/ColourPicker';
import SpeechToTextButton from '../components/SpeechToTextButton';
import { useTaskCreation } from '../hooks/useTaskCreation';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from '../components/ThemedText';
import PrioritySegmentedControl from '../components/PrioritySegmentedControl';

export default function TaskCreationScreen ({ navigation }) {
    const {
        taskTitle,
        setTaskTitle,
        notes,
        setNotes,
        dueDate,
        setDueDate,
        notification,
        setNotification,
        priority,
        setPriority,
        selectedColour,
        setSelectedColour,
        subtasks,
        setSubtasks,
        showSubtaskForm,
        setShowSubtaskForm,
        currentSubtask,
        setCurrentSubtask,
        attachments,
        setAttachments,
        addedAttachments,
        setAddedAttachments,
        isSaving,
        isCancelling,
        isUploadingAttachment,
        setIsUploadingAttachment,
        handleAddSubtask,
        handleSaveTask,
        addMainTaskToCalendar,
        addSubtaskToCalendarHandler,
        handleCancel,
    } = useTaskCreation(navigation);

    const { isDarkMode, fontScale } = useTheme();

    // Colours
    const screenBg = isDarkMode ? theme.colors.darkBg : theme.colors.light;
    const headerColour = isDarkMode ? theme.colors.darkBg : theme.colors.white;
    const inputBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.white;
    const inputTextColour = isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary;
    
    return (
        <SafeAreaView style={[tw`flex-1 p-5`, { backgroundColor: screenBg }]}>
            {/* Header */}
            <View 
                style={[
                    tw`flex-row items-center border-b border-darkTextSecondary px-4 py-3`, 
                    { 
                        backgroundColor: headerColour 
                    }
                ]}
            >
                {/* Back button / Cancel */}
                <TouchableOpacity 
                    onPress={handleCancel} 
                    disabled={isCancelling || isUploadingAttachment} 
                    style={tw`mr-3`}
                >
                    <Ionicons name="arrow-back" size={theme.fontSize.xl2 * fontScale} color={inputTextColour} />
                </TouchableOpacity>
                {/* Title */}
                <ThemedText variant="xl2" fontFamily="poppins-bold" style={tw`flex-1 text-center`}>
                    Create To-Do List
                </ThemedText>
                {/* Save button */}
                <TouchableOpacity 
                    onPress={handleSaveTask}
                    disabled={isSaving || isUploadingAttachment}
                    style={tw`ml-3`}
                >
                    <Ionicons name="save" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkMint : theme.colors.greenCyan} />
                </TouchableOpacity>
            </View>

            {/* Main to-do list form */}
            <ScrollView 
                indicatorStyle={isDarkMode ? 'white' : 'black'}
                contentContainerStyle={tw`px-6 py-6 pb-16`}
                keyboardShouldPersistTaps="handled"
            >
                {/* Title */}
                <View style={tw`flex-row items-center mb-4`}>
                    <TextInput
                        style={[
                            tw`flex-1 border px-3 py-2 rounded-lg border-darkTextSecondary`, 
                            {
                                backgroundColor: inputBg,
                                color: inputTextColour,
                                fontSize: theme.fontSize.base * fontScale,
                            }
                        ]}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        placeholder="To-Do List Title"
                        placeholderTextColor={isDarkMode ? theme.colors.gray : theme.colors.darkTextSecondary}
                    />
                    {/* Microphone button */}
                    <SpeechToTextButton onTranscribedText={(text) => setTaskTitle(text)}/>
                </View>
                {/* Notes */}
                <View style={tw`flex-row items-start mb-5`}>
                    <TextInput
                        style={[
                            tw`flex-1 border px-3 py-2 rounded-lg h-32 border-darkTextSecondary`,
                            {
                                backgroundColor: inputBg,
                                color: inputTextColour,
                                fontSize: theme.fontSize.base * fontScale,
                                textAlignVertical: 'top',
                            }
                        ]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Notes"
                        placeholderTextColor={isDarkMode ? theme.colors.gray : theme.colors.darkTextSecondary}
                        multiline
                    />
                    <SpeechToTextButton
                        onTranscribedText={(text) => setNotes(text)}
                    />
                </View>
                

                {/* Colour Picker */}
                <View style={tw`mb-3`}>
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                        Category Colour:
                    </ThemedText>
                    <ColourPicker
                        selectedColour={selectedColour}
                        onSelectColour={setSelectedColour}
                    />
                </View>

                <View style={tw`mb-1 flex-row`}>
                    {/* Due date selector */}
                    <View style={tw`flex-2 mr-2 mb-5`}>
                        <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                            Due Date:
                        </ThemedText>
                        <DateTimeSelector date={dueDate} onDateChange={setDueDate} />
                    </View>
                    {/* Notification picker */}
                    <View style={tw`flex-1 ml-2 mb-5`}>
                        <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                            Reminder:
                        </ThemedText>
                        <View 
                            style={[
                                tw`rounded-lg border border-darkTextSecondary`,
                                { backgroundColor: inputBg }
                            ]}
                        >
                            <NotificationPicker
                                selectedValue={notification}
                                onValueChange={setNotification}
                                options={NOTIFICATION_OPTIONS}
                            />
                        </View>
                    </View>
                </View>
                
                {/* Add to-do list to calendar */}
                <TouchableOpacity
                    style={tw`mb-6 flex-row items-center justify-center p-3 rounded-lg bg-gold`}
                    onPress={addMainTaskToCalendar}
                >
                    <Ionicons name="calendar-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.textPrimary} style={tw`mr-2`} />
                    <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.textPrimary}>
                        Add To-Do List to Calendar
                    </ThemedText>
                </TouchableOpacity>
                
                {/* Priority button */}
                <View style={tw`mb-4`}>
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                        Priority:
                    </ThemedText>
                    <PrioritySegmentedControl
                        selectedPriority={priority}
                        onSelectPriority={(val) => setPriority(val)}
                    />
                </View>

                {/* Add subtask button */}
                <View style={tw`mb-4`}>
                    <TouchableOpacity
                        style={tw`flex-row items-center justify-center bg-greenCyan p-3 rounded-lg`}
                        onPress={() => {
                            setShowSubtaskForm(true);
                            setCurrentSubtask({
                                title: '',
                                dueDate: new Date(),
                                priority: 'Low',
                                reminder: 'None',
                                isRecurrent: false,
                                notificationId: null,
                                eventId: null,
                            });
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.white} style={tw`mr-2`} />
                        <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.white}>
                            Add Subtask
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Subtasks list */}
                <SubtaskList 
                    subtasks={subtasks}
                    onEditSubtask={() => {}}
                    onDeleteSubtask={(index) => {
                        const updated = [...subtasks];
                        updated.splice(index, 1);
                        setSubtasks(updated);
                    }}
                    onAddSubtaskToCalendar={(subtask, idx) => addSubtaskToCalendarHandler(subtask, idx)}
                />
                
                {/* Attachments list*/}
                <AttachmentsList 
                    attachments={attachments}
                    setAttachments={setAttachments}
                    onAddAttachment={() =>
                        addAttachmentOfflineAndOnline({
                            attachments,
                            setAttachments,
                            addedAttachments,
                            setAddedAttachments,
                        })
                    }
                    onRemoveAttachment={(index) =>
                        removeAttachment({
                            attachments,
                            setAttachments,
                            index,
                            shouldDeleteSupabase: false,
                        })
                    }
                    setIsUploading={setIsUploadingAttachment}
                />
            </ScrollView>
            
            {/* Subtask form modal */}
            <SubtaskBottomSheet
                visible={showSubtaskForm}
                onClose={() => setShowSubtaskForm(false)}
                currentSubtask={currentSubtask}
                setCurrentSubtask={setCurrentSubtask}
                onSave={handleAddSubtask}
            />   
        </SafeAreaView>
    );
};