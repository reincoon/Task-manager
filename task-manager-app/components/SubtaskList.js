import { View, TouchableOpacity } from 'react-native';
import { formatDateTime } from '../helpers/date';
import { Ionicons } from '@expo/vector-icons';
import { toggleSubtaskCompletionLocal } from '../helpers/subtaskCompletionHelpers';
import ThemedText from './ThemedText';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

export default function SubtaskList({ 
    subtasks, 
    onEditSubtask, 
    onDeleteSubtask, 
    onAddSubtaskToCalendar,
    setSubtasks,
}) {
    const { isDarkMode, fontScale } = useTheme();

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
                    <View key={index} style={tw`border rounded-lg ${isDarkMode ? 'border-darkTextPrimary bg-darkCardBg' : 'border-darkTextSecondary bg-white'} p-4 mb-3`}>
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
                                        item.isCompleted ? tw`line-through text-darkTextSecondary` : (isDarkMode? tw`text-darkMint` : tw`text-evergreen`)
                                    }
                                >
                                    Due: {formatDateTime(item.dueDate)}
                                </ThemedText>
                                <ThemedText
                                    variant="xs"
                                    style={
                                        item.isCompleted ? tw`line-through text-darkTextSecondary` : (isDarkMode? tw`text-darkMint` : tw`text-evergreen`)
                                    }
                                >
                                    Reminder: {item.reminder}
                                </ThemedText>
                                {item.isRecurrent && (
                                    <ThemedText
                                        variant="xs"
                                        style={
                                            item.isCompleted ? tw`line-through text-darkTextSecondary` : tw`text-darkTextSecondary`
                                        }
                                    >
                                        Recurrent: Yes
                                    </ThemedText>
                                )}
                                {/* Completion timestamp */}
                                {item.isCompleted && item.completedAt && (
                                    <ThemedText variant="xs" style={isDarkMode ? tw`text-mint` : tw`text-textSecondary`}>
                                        Completed at: {new Date(item.completedAt).toLocaleString()}
                                    </ThemedText>
                                )}
                            </View>
                        </View>

                        {/* Action row */}
                        <View style={tw`flex-row mt-3 justify-between`}>
                            {onAddSubtaskToCalendar && (
                                <TouchableOpacity
                                    style={tw`mr-6 ml-2`}
                                    onPress={() => onAddSubtaskToCalendar(item, index)}
                                >
                                    <Ionicons name="calendar" size={theme.fontSize.xl3 * fontScale} color={isDarkMode ? theme.colors.darkSky : theme.colors.teal} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={tw`mr-6`}
                                onPress={() => onEditSubtask(index)}
                            >
                                <Ionicons name="create" size={theme.fontSize.xl3 * fontScale} color={isDarkMode ? theme.colors.darkForest : theme.colors.forest} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={tw`mr-2`} 
                                onPress={() => onDeleteSubtask(index)}
                            >
                                <Ionicons name="trash" size={theme.fontSize.xl3 * fontScale} color={isDarkMode ? theme.colors.darkCinnabar : theme.colors.cinnabar} />
                            </TouchableOpacity>
                            
                        </View>
                    </View>
                ))
            ) : (
                <ThemedText variant="base" fontFamily="poppins-regular" style={tw`text-center`}>
                    No subtasks added yet.
                </ThemedText>
            )}
        </View>
    );
};