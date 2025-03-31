import {Modal, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../helpers/ThemeContext';
import tw, { theme } from '../twrnc';
import ThemedText from './ThemedText';
import { PRIORITY_COLOURS } from '../helpers/constants';

const MoveToModal = ({ visible, onClose, onMove, columns, currentColumnKey, grouping, projects }) => {
    const { isDarkMode, fontScale } = useTheme();

    const modalBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.white;
    const overlayBg = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)';
    const buttonBg = isDarkMode ? theme.colors.darkSky : theme.colors.sky;
    
    // Given a hex background colour, return an appropriate text colour
    const getContrastText = (bgColour) => {
        if (!bgColour) {
            return theme.colors.textPrimary;
        }
        let colour = bgColour.replace('#', '');
        
        const r = parseInt(colour.substr(0, 2), 16);
        const g = parseInt(colour.substr(2, 2), 16);
        const b = parseInt(colour.substr(4, 2), 16);
        // Calculate brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        // If brightness is low (dark background), return a light color; otherwise, textPrimary
        return brightness < 128 ? theme.colors.darkTextPrimary : theme.colors.textPrimary;
    };

    if (!visible) {
        return null;
    }

    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: overlayBg }]}>
                <View style={[tw`w-80% rounded-xl p-6 items-center`, { backgroundColor: modalBg }]}>
                    <ThemedText 
                        variant="xl" 
                        color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary} 
                        fontFamily="poppins-bold"
                    >
                        Move Task To
                    </ThemedText>
                    {columns.map((column, index) => {
                        // Prevent moving to the same column
                        if (column.key !== currentColumnKey) {
                            let buttonColour = buttonBg;
                            if (grouping === 'priority') {
                                if (PRIORITY_COLOURS[column.key]) {
                                    buttonColour = PRIORITY_COLOURS[column.key];
                                }
                            } else if (grouping === 'project' && projects) {
                                const project = projects.find(p => p.id === column.key);
                                if (project && project.color) {
                                    buttonColour = project.color;
                                }
                            }
                            const textColour = getContrastText(buttonColour);
                            return (
                                <TouchableOpacity
                                    key={column.key || column.id || index}
                                    style={[tw`w-full p-3 rounded-md my-1 items-center`, { backgroundColor: buttonColour }]}
                                    onPress={() => onMove(column.key || column.id)}
                                >
                                    <ThemedText variant="lg" color={textColour} fontFamily="poppins-medium">{column.title}</ThemedText>
                                </TouchableOpacity>
                            );
                        }
                        return null;
                    })}
                    <TouchableOpacity style={tw`bg-cinnabar rounded mt-3 py-2 px-6`} onPress={onClose}>
                        <ThemedText variant="lg" color={theme.colors.white}>Cancel</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default MoveToModal;