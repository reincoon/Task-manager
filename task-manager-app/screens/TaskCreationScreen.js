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
    
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} disabled={isCancelling || isUploadingAttachment}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Create To-Do List</Text>
                <TouchableOpacity 
                    onPress={handleSaveTask}
                    disabled={isSaving || isUploadingAttachment}
                >
                    <Ionicons name="save" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Main to-do list form */}
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <View style={styles.titleContainer}>
                    <TextInput
                        style={styles.input}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        placeholder="To-Do List Title"
                    />
                    {/* Microphone button */}
                    <SpeechToTextButton onTranscribedText={(text) => setTaskTitle(text)}/>
                </View>
                {/* Notes */}
                <View style={styles.notesContainer}>
                    <TextInput
                        style={[styles.input, styles.notesInput, { flex: 1, marginRight: 10 }]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Notes"
                        multiline
                    />
                    <SpeechToTextButton
                        onTranscribedText={(text) => setNotes(text)}
                    />
                </View>
                

                {/* Color Picker */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ marginBottom: 10, fontWeight: '600' }}>Category Colour:</Text>
                    <ColourPicker
                        selectedColour={selectedColour}
                        onSelectColour={setSelectedColour}
                    />
                </View>

                {/* Due date selector */}
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
                    onPress={() => setPriority(priority)}
                >
                    <Text style={styles.buttonText}>Priority: {priority}</Text>
                </TouchableOpacity>

                {/* Add subtask button */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#28a745' }]}
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
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add Subtask</Text>
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
                    style={[styles.button, { backgroundColor: '#FFA726' }]}
                    onPress={addMainTaskToCalendar}
                >
                    <Ionicons name="calendar-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Add To-Do List to Calendar</Text>
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