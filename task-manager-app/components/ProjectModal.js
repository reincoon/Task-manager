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
                    <Text style={{fontWeight:'bold', fontSize:16, marginBottom:10}}>Name your project:</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={projectName}
                        onChangeText={setProjectName}
                        placeholder='Project Name'
                    />
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
        minWidth:70,
        alignItems:'center'
    },
    modalButtonText:{
        color:'#fff'
    }
});

export default ProjectModal;