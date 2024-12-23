import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { handleOpenAttachment } from '../helpers/attachmentHelpers'

const AttachmentsList = ({ attachments, onAddAttachment, onRemoveAttachment }) => {
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);

    const renderAttachment = (item, index) => {
        // <View style={styles.attachmentItem}>
        //     <TouchableOpacity onPress={() => handleOpenAttachment(item.uri)} style={{ flex: 1 }}>
        //         <Text style={styles.attachmentText} numberOfLines={1}>
        //             {item.name}
        //         </Text>
        //     </TouchableOpacity>
        //     <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
        //         <Ionicons name="trash-outline" size={20} color="red" />
        //     </TouchableOpacity>
        // </View>
        const isImage = item.mimeType && item.mimeType.startsWith('image/');

        const handlePress = () => {
            if (isImage) {
                setSelectedImageUri(item.uri);
                setImageModalVisible(true);
            } else {
                handleOpenAttachment(item.uri, item.mimeType, (uri) => {
                    // Handle image preview
                });
            }
        };

        return (
            <View key={`${index}-${item.uri}`} style={styles.attachmentItem}>
                <TouchableOpacity onPress={handlePress} style={{ flex: 1 }}>
                    <Text style={styles.attachmentText} numberOfLines={1}>
                        {item.name}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
                    <Ionicons name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
            </View>
        );
    };

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
                // <SectionList
                //     data={attachments}
                //     keyExtractor={(item, index) => `${index}-${item.uri}`}
                //     renderItem={({ item, index }) => (
                //         <View style={styles.attachmentItem}>
                //             {/* <Text style={styles.attachmentText} numberOfLines={1}>{item.name}</Text> */}
                //             <TouchableOpacity onPress={() => handleOpenAttachment(item.uri)} style={{ flex: 1 }}>
                //                 <Text style={styles.attachmentText} numberOfLines={1}>
                //                     {item.name}
                //                 </Text>
                //             </TouchableOpacity>
                //             <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
                //                 <Ionicons name="trash-outline" size={20} color="red" />
                //             </TouchableOpacity>
                //         </View>
                //     )}
                // />
                // <FlatList
                //     data={attachments}
                //     keyExtractor={(item, index) => `${index}-${item.uri}`}
                //     renderItem={renderAttachment}
                // />
                // attachments.map((item, index) => renderAttachment(item, index)
                    // <View key={`${index}-${item.uri}`} style={styles.attachmentItem}>
                    //     <TouchableOpacity onPress={() => handleOpenAttachment(item.uri)} style={{ flex: 1 }}>
                    //         <Text style={styles.attachmentText} numberOfLines={1}>
                    //             {item.name}
                    //         </Text>
                    //     </TouchableOpacity>
                    //     <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
                    //         <Ionicons name="trash-outline" size={20} color="red" />
                    //     </TouchableOpacity>
                    // </View>
                    
                    attachments.map((item, index) => renderAttachment(item, index))
            )}
            {/* Image Preview Modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setImageModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Image
                            source={{ uri: selectedImageUri }}
                            style={styles.imagePreview}
                            resizeMode="contain"
                        />
                    </View>
                </View>
            </Modal>
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
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        height: '80%',
        backgroundColor: '#000',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 5,
        borderRadius: 15,
    },
});

export default AttachmentsList;