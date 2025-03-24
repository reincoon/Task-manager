import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

const NotificationPicker = ({ selectedValue, onValueChange, options }) => {
    const [showPicker, setShowPicker] = useState(false);
    const { isDarkMode } = useTheme();

    // Colours
    const textColour = isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary;
    const bgColour   = isDarkMode ? theme.colors.darkCardBg : theme.colors.white;
    const borderColour = isDarkMode ? theme.colors.darkTextSecondary : theme.colors.grayHd;

    const handlePress = () => {
        setShowPicker(true);
    };
    
    const onCloseModal = () => {
        setShowPicker(false);
    };
    return (
        <View>
            <TouchableOpacity
                style={[
                    tw`flex-row items-center justify-between px-3 py-2 border rounded-lg`,
                    {
                        backgroundColor: bgColour,
                        borderColor: borderColour,
                    }
                ]}
                onPress={handlePress}
            >
                <ThemedText variant="base" style={tw`mr-2`} color={textColour}>
                    {selectedValue}
                </ThemedText>
                <Ionicons name="chevron-down" size={theme.fontSize.lg} color={textColour} />
            </TouchableOpacity>
            <Modal
                visible={showPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={onCloseModal}
            >
                <View style={[tw`flex-1 justify-center`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[tw`mx-6 p-3 rounded-lg`, { backgroundColor: bgColour }]}>
                        <View style={tw`flex-row justify-end`}>
                            <TouchableOpacity onPress={onCloseModal} style={tw`p-1`}>
                                <Ionicons name="close" size={theme.fontSize.xl2} color={textColour} />
                            </TouchableOpacity>
                        </View>
                        <Picker
                            selectedValue={selectedValue}
                            onValueChange={(itemValue) => {
                                onValueChange(itemValue);
                            }}
                            style={{ color: textColour }}
                            dropdownIconColor={textColour}
                            itemStyle={{
                                color: textColour,
                                fontSize: theme.fontSize.xl,
                            }}
                        >
                            {options.map((option) => (
                                <Picker.Item key={option} label={option} value={option} />
                            ))}
                        </Picker>
                    </View>
                </View>
            </Modal>
            {/* <Picker selectedValue={selectedValue} onValueChange={onValueChange} style={styles.picker}>
                {options.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                ))}
            </Picker> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 5,
    },
    picker: {
        width: '100%',
    },
});

export default NotificationPicker;