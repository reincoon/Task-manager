import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDateTime } from '../helpers/date';
import { Ionicons } from '@expo/vector-icons';
import { toggleSubtaskCompletionLocal } from '../helpers/subtaskCompletionHelpers';
import ThemedText from './ThemedText';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

const SubtaskList = ({ 
    subtasks, 
    onEditSubtask, 
    onDeleteSubtask, 
    onAddSubtaskToCalendar,
    // userId,
    // taskId,
    setSubtasks,
}) => {
    const { isDarkMode, fontScale } = useTheme();

    // if (!subtasks || subtasks.length === 0) {
    //     return null;
    // };

    // const handleToggleCompletion = async (index) => {
    const handleToggleCompletion = async (index) => {
        try {
            const updatedSubtasks = await toggleSubtaskCompletionLocal({ subtasks, subtaskIndex: index });
            setSubtasks(updatedSubtasks);
        } catch (error) {
            console.log('Error toggling subtask completion:', error);
        }
    };

    return (
        <View style={tw`mt-5`}>
            <ThemedText variant="xl" fontFamily="poppins-bold" style={tw`mb-3`}>Subtasks</ThemedText>
            {subtasks && subtasks.length > 0 ? (
                subtasks.map((item, index) => (
                    <View key={index} style={tw`border rounded-lg ${isDarkMode ? 'border-darkTextPrimary bg-darkCardBg' : 'border-grayHd bg-white'} p-4 mb-3`}>
                        <View style={tw`flex-row items-center`}>
                            <TouchableOpacity onPress={() => handleToggleCompletion(index)} style={tw`mr-4`}>
                                {item.isCompleted ? (
                                    <Ionicons name="checkbox" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkMint : theme.colors.greenCyan} />
                                ) : (
                                    <Ionicons name="checkbox-outline" size={theme.fontSize.xl2 * fontScale} color={isDarkMode? theme.colors.darkTextSecondary : theme.colors.textSecondary} />
                                )}
                            </TouchableOpacity>
                            <View style={tw`flex-1`}>
                                <ThemedText variant="base" style={item.isCompleted ? tw`line-through text-darkTextSecondary` : {}}>
                                    {item.title} (Priority: {item.priority})
                                </ThemedText>
                                <ThemedText 
                                    variant="xs"
                                    style={
                                        item.isCompleted ? tw`line-through text-darkTextSecondary` : tw`text-grayHd`
                                    }
                                >
                                    Due: {formatDateTime(item.dueDate)}
                                </ThemedText>
                                <ThemedText
                                    variant="xs"
                                    style={
                                        item.isCompleted ? tw`line-through text-darkTextSecondary` : tw`text-grayHd`
                                    }
                                >
                                    Reminder: {item.reminder}
                                </ThemedText>
                                {item.isRecurrent && (
                                    <ThemedText
                                        variant="xs"
                                        style={
                                            item.isCompleted ? tw`line-through text-darkTextSecondary` : tw`text-grayHd`
                                        }
                                    >
                                        Recurrent: Yes
                                    </ThemedText>
                                )}
                                {/* Completion timestamp */}
                                {item.isCompleted && item.completedAt && (
                                    <ThemedText variant="xs" style={isDarkMode ? tw`text-darkTextSecondary` : tw`text-textSecondary`}>
                                        Completed at: {new Date(item.completedAt).toLocaleString()}
                                    </ThemedText>
                                )}
                            </View>
                        </View>

                        {/* Action row */}
                        <View style={tw`flex-row mt-3 justify-end`}>
                            <TouchableOpacity
                                style={tw`mr-4`}
                                onPress={() => onEditSubtask(index)}
                            >
                                <Ionicons name="create" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkForest : theme.colors.forest} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={tw`mr-4`} 
                                onPress={() => onDeleteSubtask(index)}
                            >
                                <Ionicons name="trash" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkCinnabar : theme.colors.cinnabar} />
                            </TouchableOpacity>
                            {onAddSubtaskToCalendar && (
                                <TouchableOpacity
                                    style={tw`mr-4`}
                                    onPress={() => onAddSubtaskToCalendar(item, index)}
                                >
                                    <Ionicons name="calendar" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkSky : theme.colors.teal} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    //     {/* <Text>{item.title} (Priority: {item.priority})</Text>
                    //     <Text>Due: {formatDateTime(item.dueDate)}</Text>
                    //     {item.reminder !== 'None' && <Text>Reminder: {item.reminder}</Text>}
                    //     {item.isRecurrent && <Text>Recurrent: Yes</Text>}
                    //     <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    //         <TouchableOpacity style={{ marginRight: 10 }} onPress={() => onEditSubtask(index)}>
                    //             <Ionicons name="pencil-outline" size={20} color="blue" />
                    //         </TouchableOpacity>
                    //         <TouchableOpacity onPress={() => onDeleteSubtask(index)}>
                    //             <Ionicons name="trash-outline" size={20} color="red" />
                    //         </TouchableOpacity>
                    //         {onAddSubtaskToCalendar && (
                    //             <TouchableOpacity onPress={() => onAddSubtaskToCalendar(item, index)}>
                    //                 <Ionicons name="calendar-outline" size={20} color="#007bff" />
                    //             </TouchableOpacity>
                    //         )}
                    //     </View>
                    // </View> */}
                ))
            ) : (
                <ThemedText variant="base" fontFamily="poppins-regular" style={tw`text-center text-gray-500`}>
                    No subtasks added yet.
                </ThemedText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    subtaskItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: 10,
    },
    subTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subInfo: {
        fontSize: 12,
        color: '#666',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
});

export default SubtaskList;