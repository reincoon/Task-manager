import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, StyleSheet } from 'react-native';

const NotificationPicker = ({ selectedValue, onValueChange, options }) => {
    return (
        <View style={styles.container}>
            <Picker selectedValue={selectedValue} onValueChange={onValueChange} style={styles.picker}>
                {options.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                ))}
            </Picker>
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