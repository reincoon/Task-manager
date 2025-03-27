import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationPicker from '../components/NotificationPicker';
import SubtaskBottomSheet from '../components/SubtaskBottomSheet';
import DateTimeSelector from '../components/DateTimeSelector';
import SubtaskList from '../components/SubtaskList';
import AttachmentsList from '../components/AttachmentsList';
import SpeechToTextButton from '../components/SpeechToTextButton';
import ColourPicker from '../components/ColourPicker';
import { useTaskDetails } from '../hooks/useTaskDetails';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from '../components/ThemedText';
import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import { addAttachmentOfflineAndOnline, removeAttachment } from '../helpers/attachmentHelpers';
import PrioritySegmentedControl from '../components/PrioritySegmentedControl';

export default function TaskDetailsScreen({ route, navigation }) {
    const { taskId } = route.params;

    const {
        userId,
        loading,
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
        editingSubtaskIndex,
        setEditingSubtaskIndex,
        taskNotificationId,
        setTaskNotificationId,
        attachments,
        setAttachments,
        deletedAttachments,
        setDeletedAttachments,
        addedAttachments,
        setAddedAttachments,
        isSaving,
        isCancelling,
        setIsCancelling,
        originalTask,
        isUploadingAttachment,
        setIsUploadingAttachment,
        taskStatus,
        completedCount,
        manuallyFinished,
        localTaskCompletedAt,
        handleSaveTask,
        handleCancel,
        handleAddSubtask,
        handleDeleteTask,
        handleEditSubtask,
        handleDeleteSubtask,
        markTaskAsCompletedLocally,
        markTaskAsUnfinishedLocally,
        addMainTaskToCalendarHandler,
        addSubtaskToCalendarHandler,
    } = useTaskDetails(taskId, navigation);
    
    const { isDarkMode, fontScale } = useTheme();

    const screenBg = isDarkMode ? theme.colors.darkBg : theme.colors.light;
    const headerBg = isDarkMode ? theme.colors.darkBg : theme.colors.white;
    const inputBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.white;
    const inputTextColour = isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary;

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color={theme.colors.mint} />
            </SafeAreaView>
        );
    }

    // Calculate subtask progress
    const totalSubtasks = subtasks.length;
    const progress = totalSubtasks > 0 ? (completedCount / totalSubtasks) * 100 : 0;

    return (
        <SafeAreaView style={[tw`flex-1 p-5`, { backgroundColor: screenBg }]}>
            {/* Header */}
            <View
                style={[
                    tw`flex-row items-center border-b px-4 py-3 border-darkTextSecondary`,
                    { backgroundColor: headerBg }
                ]}
            >
                <TouchableOpacity 
                    onPress={handleCancel} 
                    disabled={isUploadingAttachment} 
                    style={tw`mr-3`}
                >
                    <Ionicons name="arrow-back" size={theme.fontSize.xl2 * fontScale} color={inputTextColour} />
                </TouchableOpacity>
                <ThemedText variant="xl2" fontFamily="poppins-bold" style={tw`flex-1 text-center`}>
                    Edit To-Do List
                </ThemedText>
                <TouchableOpacity 
                    onPress={handleSaveTask}
                    disabled={isSaving || isUploadingAttachment}
                    style={tw`ml-3`}
                >
                    <Ionicons name="save" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkMint : theme.colors.greenCyan} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={tw`px-6 py-6 pb-16`} 
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDarkMode ? 'white' : 'black'}
            >
                {/* Display the status */}
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mr-3`}>
                        Status: {taskStatus}
                    </ThemedText>

                    {/* Button/icon to mark entire list complete */}
                    {taskStatus !== 'Finished' ? (
                        <TouchableOpacity
                            style={tw`flex-row items-center bg-greenCyan px-3 py-2 rounded-lg`}
                            onPress={markTaskAsCompletedLocally}
                        >
                            <Ionicons name="checkmark-circle" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
                            <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.white} style={tw`ml-2`}>
                                Mark Complete
                            </ThemedText>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={tw`flex-row items-center bg-orange px-3 py-2 rounded-lg`}
                            onPress={markTaskAsUnfinishedLocally}
                        >
                            <Ionicons name="arrow-undo" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
                            <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.white} style={tw`ml-2`}>
                                Mark Unfinished
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Progress bar */}
                <View style={tw`h-2 bg-darkTextSecondary rounded-lg overflow-hidden mb-2`}>
                    <View style={[tw`h-full bg-greenCyan`, { width: `${progress}%` }]} />
                </View>
                <ThemedText variant="xs" fontFamily="poppins-regular" style={tw`mb-4`}>
                    {completedCount} / {totalSubtasks} Subtasks Completed
                </ThemedText>

                {/* Title and Notes */}
                <View style={tw`flex-row items-center mb-4`}>
                    <TextInput
                        style={[
                            tw`flex-1 border px-3 py-2 rounded-lg border-darkTextSecondary`,
                            { 
                                backgroundColor: inputBg,
                                color: inputTextColour, 
                                fontSize: theme.fontSize.base * fontScale 
                            }
                        ]}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        placeholder="To-Do List Title"
                        placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary}
                    />
                    <SpeechToTextButton onTranscribedText={(text) => setTaskTitle(text)}/>
                </View>
                {/* Notes */}
                <View style={tw`flex-row items-start mb-5`}>
                    <TextInput
                        style={[
                            tw`flex-1 border border-darkTextSecondary px-3 py-2 rounded-lg h-32`,
                            {
                                backgroundColor: inputBg,
                                color: inputTextColour,
                                fontSize: theme.fontSize.base * fontScale,
                                textAlignVertical: 'top'
                            }
                        ]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Notes"
                        placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary}
                        multiline
                    />
                    <SpeechToTextButton onTranscribedText={(text) => setNotes(text)} />
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
                    <View style={tw`flex-2 mr-2 mb-5`}>
                        {/* Due Date selector */}
                        <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                            Due Date:
                        </ThemedText>
                        <DateTimeSelector date={dueDate} onDateChange={setDueDate} />
                    </View>
                    <View style={tw`flex-1 ml-2 mb-5`}>
                        {/* Notification picker */}
                        <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                            Reminder:
                        </ThemedText>
                        <View style={[tw`rounded-lg border border-darkTextSecondary`, { backgroundColor: inputBg }]}>
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
                    onPress={addMainTaskToCalendarHandler}
                >
                    <Ionicons name="calendar-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.textPrimary} style={tw`mr-2`} />
                    <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.textPrimary}>
                        Add To-Do List to Calendar
                    </ThemedText>
                </TouchableOpacity>
                {/* Priority Control */}
                <View style={tw`mb-4`}>
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`mb-2`}>
                        Priority:
                    </ThemedText>
                    <PrioritySegmentedControl selectedPriority={priority} onSelectPriority={setPriority} />
                </View>
                {/* Separator */}
                <View style={tw`my-4 border-b border-darkTextSecondary`} />
                {/* Delete To-Do List */}
                <TouchableOpacity
                    style={tw`mb-6 flex-row items-center justify-center p-3 rounded-lg ${isDarkMode ? 'bg-darkCinnabar' : 'bg-cinnabar'}`}
                    onPress={handleDeleteTask}
                >
                    <Ionicons name="trash" size={theme.fontSize.xl * fontScale} color={theme.colors.white} />
                    <ThemedText variant="base" fontFamily="poppins-semibold" style={tw`text-center ml-1`} color={theme.colors.white}>
                        Delete To-Do List
                    </ThemedText>
                </TouchableOpacity>
                {/* Add subtask button */}
                <View style={tw`mb-4`}>
                    <TouchableOpacity
                        style={tw`flex-row items-center justify-center bg-greenCyan p-3 rounded-lg`}
                        onPress={() => {
                            setEditingSubtaskIndex(null);
                            setCurrentSubtask({
                                title: '',
                                dueDate: new Date(),
                                priority: 'Low',
                                reminder: 'None',
                                isRecurrent: false,
                                notificationId: null,
                                eventId: null,
                                isCompleted: false,
                            });
                            setShowSubtaskForm(true);
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={theme.fontSize.xl * fontScale} color={theme.colors.white} style={tw`mr-2`} />
                        <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.white}>
                            Add Subtask
                        </ThemedText>
                    </TouchableOpacity>
                </View>
                
                {/* List of subtasks */}
                <SubtaskList 
                    subtasks={subtasks} 
                    onEditSubtask={handleEditSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    onAddSubtaskToCalendar={addSubtaskToCalendarHandler}
                    userId={userId}
                    taskId={taskId}
                    setSubtasks={setSubtasks}
                />
                {/* Attachments list */}
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
                    onRemoveAttachment={(index) => {
                        const removed = attachments[index];
                        setDeletedAttachments([...deletedAttachments, removed]);
                        removeAttachment({
                            attachments,
                            setAttachments,
                            index,
                            shouldDeleteSupabase: false,
                        });
                    }}
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

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//         backgroundColor: '#fff',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 20,
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//         padding: 16,
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         padding: 10,
//         marginBottom: 20,
//         borderRadius: 5,
//     },
//     titleContainer: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//         marginBottom: 20,
//     },
//     notesContainer: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//         marginBottom: 20,
//     },
//     notesInput: {
//         height: 80,
//         textAlignVertical: 'top',
//     },
//     button: {
//         backgroundColor: '#007bff',
//         padding: 10,
//         marginHorizontal: 20,
//         marginBottom: 20,
//         borderRadius: 5,
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     buttonText: {
//         color: '#fff',
//         textAlign: 'center',
//         marginLeft: 5,
//     },
//     subtaskItem: {
//         borderBottomWidth: 1,
//         borderBottomColor: '#ccc',
//         padding: 10,
//     },
//     statusText: {
//         fontSize: 16,
//         fontWeight: '600',
//         marginRight: 10,
//     },
//     completeButton: {
//         backgroundColor: '#28a745',
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: 5,
//         paddingHorizontal: 8,
//         borderRadius: 5,
//     },
//     completeButtonText: {
//         color: '#fff',
//         marginLeft: 5,
//     },
//     progressBarContainer: {
//         height: 10,
//         backgroundColor: '#eee',
//         borderRadius: 5,
//         overflow: 'hidden',
//         marginVertical: 5,
//     },
//     progressBar: {
//         height: '100%',
//         backgroundColor: '#28a745',
//     },
//     progressText: {
//         marginBottom: 15,
//         fontWeight: '500',
//     },
// });