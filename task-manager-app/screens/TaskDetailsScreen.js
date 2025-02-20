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

import { NOTIFICATION_OPTIONS } from '../helpers/constants';
import { cyclePriority } from '../helpers/priority';
import { addAttachmentOfflineAndOnline, removeAttachment } from '../helpers/attachmentHelpers';

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
    
    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </SafeAreaView>
        );
    }

    // Calculate subtask progress
    const totalSubtasks = subtasks.length;
    const progress = totalSubtasks > 0 ? (completedCount / totalSubtasks) * 100 : 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} disabled={isUploadingAttachment}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit To-Do List</Text>
                <TouchableOpacity 
                    onPress={handleSaveTask}
                    disabled={isSaving || isUploadingAttachment}
                >
                    <Ionicons name="save" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true}>
                {/* Display the status */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                        Status: {taskStatus}
                    </Text>

                    {/* Button/icon to mark entire list complete */}
                    {taskStatus !== 'Finished' ? (
                        <TouchableOpacity style={styles.completeButton} onPress={markTaskAsCompletedLocally}>
                            <Ionicons name="checkmark-circle" size={22} color="white" />
                            <Text style={styles.completeButtonText}>
                                Mark Complete
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.completeButton} onPress={markTaskAsUnfinishedLocally}>
                            <Ionicons name="arrow-undo" size={22} color="white" />
                            <Text style={styles.completeButtonText}>Mark Unfinished</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {completedCount} / {totalSubtasks} Subtasks Completed
                </Text>

                {/* Title and Notes */}
                <View style={styles.titleContainer}>
                    <TextInput
                        style={styles.input}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        placeholder="To-Do List Title"
                    />
                    <SpeechToTextButton onTranscribedText={(text) => setTaskTitle(text)}/>
                </View>
                <View style={styles.notesContainer}>
                    <TextInput
                        style={[styles.input, styles.notesInput, { flex: 1, marginRight: 10 }]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Notes"
                        multiline
                    />
                    <SpeechToTextButton onTranscribedText={(text) => setNotes(text)} />
                </View>
                {/* Colour Picker */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ marginBottom: 10, fontWeight: '600' }}>
                        Category Colour:
                    </Text>
                    <ColourPicker
                        selectedColour={selectedColour}
                        onSelectColour={setSelectedColour}
                    />
                </View>
                {/* Due Date selector */}
                <DateTimeSelector date={dueDate} onDateChange={setDueDate} />
                {/* Notification picker */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ marginBottom: 10, fontWeight: '600' }}>Reminder:</Text>
                    <NotificationPicker
                        selectedValue={notification}
                        onValueChange={setNotification}
                        options={NOTIFICATION_OPTIONS}
                    />
                </View>
                {/* Priority button */}
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => setPriority(cyclePriority(priority))}
                >
                    <Text style={styles.buttonText}>Priority: {priority}</Text>
                </TouchableOpacity>
                {/* Add subtask button */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#28a745' }]}
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
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add Subtask</Text>
                </TouchableOpacity>

                {/* Delete To-Do List */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: 'red' }]}
                    onPress={handleDeleteTask}
                >
                    <Ionicons name="trash-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Delete Task</Text>
                </TouchableOpacity>
                {/* Add to-do list to calendar */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FFA726' }]}
                    onPress={addMainTaskToCalendarHandler}
                >
                    <Ionicons name="calendar-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add To-Do List to Calendar</Text>
                </TouchableOpacity>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        marginLeft: 5,
    },
    subtaskItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: 10,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 10,
    },
    completeButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 5,
    },
    completeButtonText: {
        color: '#fff',
        marginLeft: 5,
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#eee',
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#28a745',
    },
    progressText: {
        marginBottom: 15,
        fontWeight: '500',
    },
});