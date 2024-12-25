import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ImageBackground, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { handleOpenAttachment } from '../helpers/attachmentHelpers'
import { WebView } from 'react-native-webview';
import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

const AttachmentsList = ({ attachments, onAddAttachment, onRemoveAttachment }) => {
    const [imageModalVisible, setImageModalVisible] = useState(false);
    // const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [textModalVisible, setTextModalVisible] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [audioModalVisible, setAudioModalVisible] = useState(false);
    const [selectedFileUri, setSelectedFileUri] = useState(null);
    const [selectedTextContent, setSelectedTextContent] = useState('');
    const [pdfDataUri, setPdfDataUri] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(true);

    const handlePressAttachment = (item) => {
        handleOpenAttachment(
            item.uri, 
            item.mimeType, 
            (uri) => {
                // Image preview handler
                setSelectedFileUri(uri);
                setImageModalVisible(true);
            },
            (content) => {
                // Text preview handler
                setSelectedTextContent(content);
                setTextModalVisible(true);
            },
            (pdfUri) => {
                // PDF preview handler
                console.log('PDF Data URI length:', pdfUri.length);
                setPdfDataUri(pdfUri);
                setPdfModalVisible(true);
            },
            (uri) => {
                // Video playback handler
                setSelectedFileUri(uri);
                setVideoModalVisible(true);
            },
            (uri) => {
                // Audio playback handler
                setSelectedFileUri(uri);
                setAudioModalVisible(true);
            }
        );
    };
    // const renderAttachment = (item, index) => {
    //     // <View style={styles.attachmentItem}>
    //     //     <TouchableOpacity onPress={() => handleOpenAttachment(item.uri)} style={{ flex: 1 }}>
    //     //         <Text style={styles.attachmentText} numberOfLines={1}>
    //     //             {item.name}
    //     //         </Text>
    //     //     </TouchableOpacity>
    //     //     <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
    //     //         <Ionicons name="trash-outline" size={20} color="red" />
    //     //     </TouchableOpacity>
    //     // </View>
    //     const isImage = item.mimeType && item.mimeType.startsWith('image/');

    //     const handlePress = () => {
    //         if (isImage) {
    //             setSelectedImageUri(item.uri);
    //             setImageModalVisible(true);
    //         } else {
    //             handleOpenAttachment(item.uri, item.mimeType, (uri) => {
    //                 // Handle image preview
    //             });
    //         }
    //     };

    //     return (
    //         <View key={`${index}-${item.uri}`} style={styles.attachmentItem}>
    //             <TouchableOpacity onPress={handlePress} style={{ flex: 1 }}>
    //                 <Text style={styles.attachmentText} numberOfLines={1}>
    //                     {item.name}
    //                 </Text>
    //             </TouchableOpacity>
    //             <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
    //                 <Ionicons name="trash-outline" size={20} color="red" />
    //             </TouchableOpacity>
    //         </View>
    //     );
    // };

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
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Attachments</Text>
                <TouchableOpacity style={styles.addButton} onPress={onAddAttachment}>
                    <Ionicons name="attach" size={20} color="white" />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>
            {/* Attachments list */}
            {attachments.length === 0 ? (
                <Text style={styles.noAttachmentsText}>No attachments yet</Text>
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
                    
                attachments.map((item, index) => (
                    <View key={`${index}-${item.uri}`} style={styles.attachmentItem}>
                        <TouchableOpacity onPress={() => handlePressAttachment(item)} style={{ flex: 1 }}>
                            <Text style={styles.attachmentText} numberOfLines={1}>{item.name}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
                            <Ionicons name="trash-outline" size={20} color="red" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
            {/* Image preview modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        {/* <TouchableOpacity style={styles.closeButton} onPress={() => setImageModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        {selectedFileUri && (
                            <Image source={{ uri: selectedFileUri }} style={styles.imagePreview} resizeMode="contain"/>
                        )} */}
                        <ImageBackground
                            source={{ uri: selectedFileUri }}
                            style={styles.imagePreview}
                            resizeMode="contain"
                        >
                            <TouchableOpacity style={styles.closeButton} onPress={() => setImageModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </ImageBackground>
                    </View>
                </View>
            </Modal>
            {/* Text preview modal */}
            <Modal
                visible={textModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setTextModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.textModalContainer}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setTextModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <ScrollView contentContainerStyle={styles.textContent}>
                            <Text style={styles.textPreview}>{selectedTextContent}</Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* PDF preview modal */}
            <Modal
                visible={pdfModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setPdfModalVisible(false)}
            >
                {/* <View style={styles.modalBackground}> */}
                    <View style={styles.pdfModalContainer}>
                        <TouchableOpacity style={styles.closeButtonTop} onPress={() => setPdfModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        {pdfDataUri ? (
                            <>
                                <WebView
                                    originWhitelist={['*']}
                                    source={{
                                        html: `
                                            <html>
                                            <head>
                                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                <style>
                                                    body, html {
                                                        margin: 10;
                                                        padding: 30 0;
                                                        
                                                        overflow: auto;
                                                        background-color: #fff;
                                                    }
                                                    object {
                                                        width: 100%;
                                                    
                                                        border: none;
                                                    }
                                                </style>
                                            </head>
                                            <body>
                                                <object data="${pdfDataUri}" type="application/pdf">
                                                    <p>Your device does not support PDFs. <a href="${pdfDataUri}">Download the PDF</a>.</p>
                                                </object>
                                            </body>
                                            </html>
                                        `
                                    }}
                                    style={styles.pdfPreview}
                                    javaScriptEnabled={true}
                                    scalesPageToFit={true}
                                    onLoadStart={() => setPdfLoading(true)}
                                    onLoadEnd={() => setPdfLoading(false)}
                                    onError={(syntheticEvent) => {
                                        const { nativeEvent } = syntheticEvent;
                                        console.log('WebView error: ', nativeEvent);
                                        Alert.alert('Error', 'Failed to load the PDF.');
                                        setPdfModalVisible(false);
                                    }}
                                />
                                {pdfLoading && (
                                    <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
                                )}
                            </>
                        ) : (
                            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
                        )}
                    </View>
                {/* </View> */}
            </Modal>

            {/* Video playback modal */}
            <Modal
                visible={videoModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setVideoModalVisible(false)}
            >
                <View style={styles.videoModalContainer}>
                    <TouchableOpacity style={styles.closeButtonTop} onPress={() => setVideoModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    {selectedFileUri && (
                        <Video
                            source={{ uri: selectedFileUri }}
                            rate={1.0}
                            volume={1.0}
                            isMuted={false}
                            resizeMode="contain"
                            shouldPlay
                            useNativeControls
                            style={styles.videoPlayer}
                        />
                    )}
                </View>
            </Modal>

            {/* Audio playback modal */}
            <Modal
                visible={audioModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setAudioModalVisible(false)}
            >
                <View style={styles.audioModalContainer}>
                    <TouchableOpacity style={styles.closeButtonTop} onPress={() => setAudioModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    {selectedFileUri && (
                        <Video
                            source={{ uri: selectedFileUri }}
                            rate={1.0}
                            volume={1.0}
                            isMuted={false}
                            resizeMode="contain"
                            shouldPlay
                            useNativeControls
                            style={styles.audioPlayer}
                        />
                    )}
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
        paddingHorizontal: 10,
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
    noAttachmentsText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
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
        width: width * 0.9,
        height: height * 0.8,
        backgroundColor: '#000',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    textModalContainer: {
        width: width * 0.9,
        height: height * 0.8,
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContent: {
        paddingTop: 50,
    },
    textPreview: {
        color: '#fff',
        fontSize: 16,
    },
    pdfModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    pdfPreview: {
        flex: 1,
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
    closeButtonTop: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
        zIndex: 1,
    },
    videoModalContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlayer: {
        width: width,
        height: height * 0.6,
    },
    audioModalContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    audioPlayer: {
        width: width * 0.8,
        height: 100,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
});

export default AttachmentsList;