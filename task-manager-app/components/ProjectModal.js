import { View, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '../helpers/ThemeContext';
import tw, { theme } from '../twrnc';
import ThemedText from './ThemedText';

const ProjectModal = ({ visible, onCancel, onCreate }) => {
    const [projectName, setProjectName] = useState('');
    const { isDarkMode, fontScale } = useTheme();

    const modalBg = isDarkMode ? theme.colors.darkCardBg : theme.colors.white;
    const overlayBg = 'rgba(0,0,0,0.4)';
    const inputBg = isDarkMode ? theme.colors.darkBg : theme.colors.light;
    const borderColor = isDarkMode ? theme.colors.darkTextSecondary : theme.colors.textSecondary;
    const buttonBgCreate = isDarkMode ? theme.colors.darkSky : theme.colors.sky;
    const buttonBgCancel = isDarkMode ? theme.colors.darkCinnabar : theme.colors.cinnabar;

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
            <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: overlayBg }]}>
                <View style={[tw`w-4/5 p-4 rounded-lg`, { backgroundColor: modalBg }]}>
                    <ThemedText variant="lg" style={tw`font-bold mb-3 text-center`}>
                        Name your new project:
                    </ThemedText>
                    <TextInput
                        style={[
                            tw`w-full p-3 rounded-md mt-2`,
                            {
                                backgroundColor: inputBg,
                                borderColor: borderColor,
                                borderWidth: 1,
                                color: isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary,
                                fontSize: theme.fontSize.base * fontScale,
                            },
                        ]}
                        value={projectName}
                        onChangeText={setProjectName}
                        placeholder='Enter Project Name'
                        placeholderTextColor={isDarkMode ? theme.colors.darkTextSecondary : '#888'}
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
                    <View style={tw`flex-row justify-around mt-5`}>
                        <TouchableOpacity 
                            style={[tw`px-4 py-2 rounded-md`, { backgroundColor: buttonBgCreate }]} 
                            onPress={handleCreate}
                        >
                            <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.textSecondary}>
                                Create
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[tw`px-4 py-2 rounded-md`, { backgroundColor: buttonBgCancel }]}
                            onPress={handleCancel}
                        >
                            <ThemedText variant="base" fontFamily="poppins-semibold" color={theme.colors.white}>
                                Cancel
                            </ThemedText>
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