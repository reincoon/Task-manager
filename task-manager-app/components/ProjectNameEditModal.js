import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function ProjectNameEditModal({ visible, onClose, onSave, projectName, projectId, onChangeProjectName }) {
    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.label}>Edit Project Name</Text>
                    {/* <TextInput
                        style={styles.input}
                        value={projectName}
                        onChangeText={onChangeProjectName}
                    /> */}
                    <TextInput
                        value={projectName}
                        onChangeText={onChangeProjectName}
                        style={styles.input}
                        placeholder="Enter new project name"
                    />
                    <Button title="Save" onPress={() => onSave(projectId, projectName)} />
                    <Button title="Cancel" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        margin: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
    },
    label: {
        fontSize: 24,
        marginBottom: 20,
    },
    input: {
        width: '80%',
        padding: 10,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 4,
    },
});