import { View, TextInput, Button, StyleSheet } from 'react-native';

const EditNameForm = ({ name, setName, handleSaveName, handleCancelEdit }) => (
    <View style={styles.container}>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />
        <View style={styles.buttonContainer}>
            <Button title="Save" onPress={handleSaveName} />
            <Button title="Cancel" onPress={handleCancelEdit} color="red" />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginRight: 10,
    },
});

export default EditNameForm;