import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';

const ProjectModal = ({ visible, onCancel, onCreate }) => {
    const [projectName, setProjectName] = useState('');

    useEffect(() => {
        if (!visible) {
            setProjectName('');
        }
    }, [visible]);

    const handleCreate = () => {
        if (!projectName.trim()) {
            Alert.alert('Error', 'Project name is required');
            return;
        }
        // if (selectedTasks && selectedTasks.length > 0 && selectedTasks.length !== 2) {
        //     Alert.alert('Error', 'Please select exactly two tasks to create a project.');
        //     return;
        // }
        onCreate(projectName.trim());
        // setProjectName('');
    };

    const handleCancel = () => {
        setProjectName('');
        onCancel();
    };

    return (
        <Modal visible={visible} transparent animationType='fade'>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Name your new project:</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={projectName}
                        onChangeText={setProjectName}
                        placeholder='Project Name'
                    />
                    {/* {selectedTasks && selectedTasks.length > 0 && ( */}
                        {/* <View style={styles.selectedTasksContainer}>
                            <Text style={styles.modalTitle}>Selected Tasks:</Text>
                            {selectedTasks.map(task => (
                                <Text key={task.id} style={styles.selectedTaskText}>
                                    - {task.title}
                                </Text>
                            ))}
                        </View> */}
                    {/* )} */}
                    <View style={{flexDirection:'row', justifyContent:'space-around', marginTop:20}}>
                        <TouchableOpacity style={styles.modalButton} onPress={handleCreate}>
                            <Text style={styles.modalButtonText}>Create</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, {backgroundColor:'red'}]} onPress={handleCancel}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer:{
        flex:1,
        backgroundColor:'rgba(0,0,0,0.5)',
        justifyContent:'center',
        alignItems:'center'
    },
    modalContent:{
        backgroundColor:'#fff',
        padding:20,
        borderRadius:10,
        width:'80%'
    },
    modalInput:{
        borderColor:'#ccc',
        borderWidth:1,
        borderRadius:5,
        padding:10,
        marginTop:10
    },
    modalButton:{
        backgroundColor:'#007bff',
        padding:10,
        borderRadius:5,
        minWidth:80,
        alignItems:'center'
    },
    modalButtonText:{
        color:'#fff'
    },
    modalTitle: {
        fontWeight: '600',
        fontSize: 14,
        marginTop: 10,
    },
    selectedTasksContainer: {
        marginTop: 10,
    },
    selectedTaskText: {
        fontSize: 12,
        color: '#555',
    },
    buttonContainer:{
        flexDirection:'row',
        justifyContent:'space-around',
        marginTop:20
    },
    cancelButton:{
        backgroundColor:'red'
    },
});

export default ProjectModal;