// import { TextInput, TouchableOpacity, Text } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Picker } from '@react-native-picker/picker';

// const TaskDetails = ({ taskTitle, setTaskTitle, notes, setNotes, priority, setPriority, notification, setNotification, notificationOptions }) => {
//     return (
//         <>
//             <TextInput
//                 style={styles.input}
//                 value={taskTitle}
//                 onChangeText={setTaskTitle}
//                 placeholder="To-Do List Title"
//             />
//             <TextInput
//                 style={[styles.input, styles.notesInput]}
//                 value={notes}
//                 onChangeText={setNotes}
//                 placeholder="Notes"
//                 multiline
//             />
//             <TouchableOpacity style={styles.button}>
//                 <Text style={styles.buttonText}>Priority: {priority}</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.button}>
//                 <Picker
//                     selectedValue={notification}
//                     onValueChange={setNotification}
//                     style={styles.picker}
//                 >
//                     {notificationOptions.map((option) => (
//                         <Picker.Item key={option} label={option} value={option} />
//                     ))}
//                 </Picker>
//             </TouchableOpacity>
//         </>
//     );
// };

// const styles = {
//     input: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         padding: 10,
//         marginBottom: 20,
//         borderRadius: 5,
//     },
//     notesInput: {
//         height: 80,
//         textAlignVertical: 'top',
//     },
//     button: {
//         backgroundColor: '#007bff',
//         padding: 10,
//         marginBottom: 20,
//         borderRadius: 5,
//     },
//     buttonText: {
//         color: '#fff',
//         textAlign: 'center',
//     },
//     picker: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         borderRadius: 5,
//         marginBottom: 20,
//     },
// };

// export default TaskDetails;