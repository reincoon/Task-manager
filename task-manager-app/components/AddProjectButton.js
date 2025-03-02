import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Open a project creation modal
const AddProjectButton = ({ onPress, label = 'Add Project' }) => {
    return (
        <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
            <Ionicons name="add-circle" size={30} color="#007bff" />
            <Text style={styles.buttonLabel}>{label}</Text>
        </TouchableOpacity>
    );
};

export default AddProjectButton;

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#007bff',
    },
    buttonLabel: {
        marginLeft: 5,
        color: '#007bff',
        fontSize: 16,
    },
});

