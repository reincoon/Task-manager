import { View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateTaskStatus, toggleTaskCompletion, updateTaskStatusInFirestore } from '../helpers/subtaskCompletionHelpers';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';

// TodoCard component shows details about a single to-do list:
export default function TodoCard({ 
    task, 
    projectName, 
    onPress, 
    onLongPress, 
    onDeleteTask, 
    showMoveButton, 
    onMoveTask,
    userId,
}) {
    const { isDarkMode, fontScale } = useTheme();

    // Count number of subtasks and attachments
    const subtaskCount = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : 0;

    // Compute to-do list status
    const status = calculateTaskStatus(task);

    // Compute subtask progress
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
    const completedCount = task.subtasks ? task.subtasks.filter((s) => s.isCompleted).length : 0;
    const progressPercentage = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : 0;

    // Mark entire to-do list as finished
    const handleCompleteTask = async () => {
        if (!userId || !task?.id) {
            return;
        }

        try {
            await toggleTaskCompletion({
                userId,
                taskId: task.id,
                subtasks: task.subtasks || [],
                markAsComplete: true,
            });
            await updateTaskStatusInFirestore(true, userId, task.id);
            Alert.alert('Success', 'To-Do list marked as finished.');
        } catch (error) {
            Alert.alert('Error', 'Failed to mark this list as finished.');
        }
    }

    // Undo finishing the task
    const handleUnfinishTask = async () => {
        if (!userId || !task?.id) {
            return;
        }
        try {
            await toggleTaskCompletion({
                userId,
                taskId: task.id,
                subtasks: task.subtasks || [],
                markAsComplete: false,
            });
            await updateTaskStatusInFirestore(false, userId, task.id);
            Alert.alert('Success', 'To-Do list reverted to incomplete.');
        } catch (error) {
            Alert.alert('Error', 'Failed to revert the list.');
        }
    };

    return (
        <View 
            style={[
                tw`p-4 rounded-xl my-1 self-center border shadow-md w-92%`, 
                { 
                    backgroundColor: isDarkMode ? theme.colors.darkCardBg : theme.colors.white,
                    borderColor: isDarkMode ? theme.colors.textSecondary : theme.colors.white, 
                }
            ]}
        >
            {/* Colour indicator */}
            <View 
                style={[
                    tw`absolute left-0 top-0 bottom-0 w-3 rounded-l-xl`, 
                    { 
                        backgroundColor: task.colour || theme.colors.sky 
                    }
                ]} 
            />

            {/* Task details */}
            <TouchableOpacity
                style={tw`flex-1 pr-12`}
                onPress={onPress}
                onLongPress={onLongPress}
            >
                {/* Title */}
                <ThemedText variant="lg" fontFamily="poppins-bold" color={isDarkMode ? theme.colors.darkSky : theme.colors.evergreen}>
                    {task.title}
                </ThemedText>
                {/* Status */}
                <View style={tw`flex-row items-center mt-1`}>
                    <ThemedText variant="sm" fontFamily="poppins-bold">Status: </ThemedText>
                    <ThemedText variant="sm">{status}</ThemedText>
                </View>
                {/* Show completed timestamp */}
                {task.taskCompletedAt && (
                    <ThemedText variant="xs">
                        Completed At: {new Date(task.taskCompletedAt).toLocaleString()}
                    </ThemedText>
                )}
                {/* Progress bar for subtasks */}
                {subtaskCount > 0 && (
                    <>
                        <View style={tw`mt-2`}>
                            <View style={[tw`w-full h-2 bg-darkTextSecondary rounded-md overflow-hidden`]}>
                                <View
                                    style={[
                                        tw`h-full bg-greenCyan`,
                                        { width: `${progressPercentage}%` }
                                    ]}
                                />
                            </View>
                            <ThemedText variant="xs" style={tw`mt-1`}>
                                {completedCount}/{subtaskCount} subtasks
                            </ThemedText>
                        </View>
                    </>
                )}

                {/* Project name */}
                <View style={tw`mt-2`}>
                    <ThemedText variant="sm" fontFamily="poppins-bold">Project: 
                        <ThemedText variant="sm"> {projectName || 'Unassigned'}</ThemedText>
                    </ThemedText>
                    
                </View>

                {/* Priority */}
                <View>
                    <ThemedText variant="sm" fontFamily="poppins-bold">Priority: 
                        <ThemedText variant="sm"> {task.priority || 'Low'}</ThemedText>
                    </ThemedText>
                </View>

                {/* Due Date */}
                <ThemedText variant="sm" fontFamily="poppins-bold">
                    Due: 
                    <ThemedText variant="sm"> {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A'}
                    </ThemedText>
                </ThemedText>
                
                {/* Subtask and attachment counts */}
                <ThemedText variant="xs">Subtasks: {subtaskCount}</ThemedText>
                <ThemedText variant="xs">Attachments: {attachmentCount}</ThemedText>
            </TouchableOpacity>

            <View style={tw`absolute top-3 right-3 flex-row items-center`}>
                {/* Icon to mark entire list as complete, if not already finished, and revert */}
                {status !== 'Finished' ? (
                    <TouchableOpacity style={tw`absolute top-3 right-3`} onPress={handleCompleteTask}>
                        <Ionicons name="checkmark-done-circle" size={theme.fontSize.xl3 * fontScale} color={theme.colors.greenCyan} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={tw`absolute top-3 right-3`} onPress={handleUnfinishTask}>
                        <Ionicons name="arrow-undo-circle" size={theme.fontSize.xl3 * fontScale} color="orange" />
                    </TouchableOpacity>
                )}
            </View>
    
            {/* Move Button (Visible Only in Kanban View) for MoveToModal */}
            {showMoveButton && (
                <TouchableOpacity style={tw`absolute top-1/2 right-3 -mt-3`} onPress={onMoveTask}>
                    <Ionicons name="swap-horizontal" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkMint : theme.colors.violet} />
                </TouchableOpacity>
            )}
            {/* Delete icon */}
            {onDeleteTask && (
                <TouchableOpacity style={tw`absolute bottom-3 right-5`} onPress={onDeleteTask} >
                    <Ionicons name="trash-outline" size={theme.fontSize.xl3 * fontScale} color={theme.colors.cinnabar} />
                </TouchableOpacity>
            )}
        </View>
    );
};