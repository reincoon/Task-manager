import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AttachmentsList = ({ attachments, onAddAttachment, onRemoveAttachment }) => {
    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>Attachments:</Text>
            <FlatList
                data={attachments}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.attachmentItem}>
                        <Ionicons name="document-attach" size={20} color="#333" style={{ marginRight: 8 }} />
                        <Text style={styles.attachmentText}>{item.name}</Text>
                        <TouchableOpacity onPress={() => onRemoveAttachment(index)} style={{ marginLeft: 'auto' }}>
                            <Ionicons name="trash-outline" size={20} color="red" />
                        </TouchableOpacity>
                    </View>
                )}
            /> */}
            <View style={styles.header}>
                <Text style={styles.title}>Attachments</Text>
                <TouchableOpacity style={styles.addButton} onPress={onAddAttachment}>
                    <Ionicons name="attach" size={20} color="white" />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>
            {attachments.length === 0 ? (
                <Text style={{color:'#666'}}>No attachments yet</Text>
            ) : (
                <FlatList
                    data={attachments}
                    keyExtractor={(item, index) => `${index}-${item.uri}`}
                    renderItem={({ item, index }) => (
                        <View style={styles.attachmentItem}>
                            <Text style={styles.attachmentText} numberOfLines={1}>{item.name}</Text>
                            <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
                                <Ionicons name="trash-outline" size={20} color="red" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 10,
    },
    header: {
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom: 10
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 16,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    attachmentText: {
        fontSize: 14,
        color: '#333',
    },
    addButton: {
        flexDirection:'row',
        backgroundColor:'#007bff',
        padding:5,
        borderRadius:5,
        alignItems:'center'
    },
    addButtonText: {
        color:'white',
        marginLeft:5
    },
});

export default AttachmentsList;