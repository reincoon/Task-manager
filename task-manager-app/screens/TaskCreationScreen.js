import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import DateTimeSelector from '../components/DateTimeSelector';
import SubtaskList from '../components/SubtaskList';
import AttachmentsList from '../components/AttachmentsList';
import { addAttachmentOfflineAndOnline, removeAttachment, deleteAllAttachmentsFromSupabase } from '../helpers/attachmentHelpers';
import ColourPicker from '../components/ColourPicker';
import SpeechToTextButton from '../components/SpeechToTextButton';
import { useTaskCreation } from '../hooks/useTaskCreation';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';import ThemedText from '../components/ThemedText';

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
    
    return (
        <SafeAreaView style={tw`flex-1 bg-light p-5`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center border-b border-grayHd pb-3`}>
                <TouchableOpacity onPress={handleCancel} disabled={isCancelling || isUploadingAttachment}>
                    <Ionicons name="arrow-back" size={theme.fontSize.xl2 * fontScale} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <ThemedText variant="xl" fontFamily="poppins-bold" style={tw`flex-1 text-center`}>
                    Create To-Do List
                </ThemedText>
                <TouchableOpacity 
                    onPress={handleSaveTask}
                    disabled={isSaving || isUploadingAttachment}
                >
                    <Ionicons name="save" size={theme.fontSize.xl2 * fontScale} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Main to-do list form */}
            <ScrollView 
                contentContainerStyle={tw`p-5 pb-10`}
            >
                {/* Title */}
                <View style={tw`flex-row items-center mb-5`}>
                    <TextInput
                        style={tw`flex-1 border border-grayHd p-3 rounded-lg bg-white text-textPrimary`}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        placeholder="To-Do List Title"
                        placeholderTextColor={theme.colors.grayHd}
                    />
                    {/* Microphone button */}
                    <SpeechToTextButton onTranscribedText={(text) => setTaskTitle(text)}/>
                </View>
                {/* Notes */}
                <View style={tw`flex-row items-start mb-5`}>
                    <TextInput
                        style={tw`flex-1 border border-grayHd p-3 rounded-lg bg-white text-textPrimary h-24`}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Notes"
                        placeholderTextColor={theme.colors.grayHd}
                        multiline
                    />
                    <SpeechToTextButton
                        onTranscribedText={(text) => setNotes(text)}
                    />
                </View>
                

                {/* Color Picker */}
                <View style={tw`mb-5`}>
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                        Category Colour:
                    </ThemedText>
                    <ColourPicker
                        selectedColour={selectedColour}
                        onSelectColour={setSelectedColour}
                    />
                </View>

                {/* Due date selector */}
                <View style={tw`mb-5`}>
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                        Due Date:
                    </ThemedText>
                    <DateTimeSelector date={dueDate} onDateChange={setDueDate} />
                </View>
                {/* Notification picker */}
                <View style={tw`mb-5`}>
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                        Reminder:
                    </ThemedText>
                    <NotificationPicker
                        selectedValue={notification}
                        onValueChange={setNotification}
                        options={NOTIFICATION_OPTIONS}
                    />
                </View>

                {/* Priority button */}
                <TouchableOpacity 
                    style={tw`flex-row items-center justify-center bg-sky p-3 rounded-lg mb-5`}
                    onPress={() => setPriority(priority)}
                >
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`text-white`}>
                        Priority: {priority}
                    </ThemedText>
                </TouchableOpacity>

                {/* Add subtask button */}
                <TouchableOpacity
                    style={tw`flex-row items-center justify-center bg-greenCyan p-3 rounded-lg mb-5`}
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
                    <Ionicons name="add-circle-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.white} />
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`text-white`}>
                        Add Subtask
                    </ThemedText>
                </TouchableOpacity>

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
                {/* Add to-do list to calendar */}
                <TouchableOpacity
                    style={tw`flex-row items-center justify-center bg-orange p-3 rounded-lg mb-5`}
                    onPress={addMainTaskToCalendar}
                >
                    <Ionicons name="calendar-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.white} style={tw`mr-2`} />
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`text-white`}>
                        Add To-Do List to Calendar
                    </ThemedText>
                </TouchableOpacity>
                {/* Attachments list*/}
                <AttachmentsList 
                    attachments={attachments}
                    setAttachments={setAttachments}
                    // onAddAttachment={handleAddAttachment}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        padding: 16,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    notesInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },
});

// export default TaskCreationScreen;