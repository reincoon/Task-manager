import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ImageBackground, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { handleOpenLocalFile, doDownloadSupabaseFile } from '../helpers/attachmentHelpers'
import { WebView } from 'react-native-webview';
import { Video } from 'expo-av';
import ThemedText from './ThemedText';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

export default function AttachmentsList({ attachments, onAddAttachment, onRemoveAttachment, setAttachments, setIsUploading }) {
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [textModalVisible, setTextModalVisible] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [audioModalVisible, setAudioModalVisible] = useState(false);
    const [selectedFileUri, setSelectedFileUri] = useState(null);
    const [selectedTextContent, setSelectedTextContent] = useState('');
    const [pdfDataUri, setPdfDataUri] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(true);
    const [isAddingAttachment, setIsAddingAttachment] = useState(false);

    const { isDarkMode, fontScale } = useTheme();

    useEffect(() => {
        if (typeof setIsUploading === 'function') {
            setIsUploading(isAddingAttachment);
        }
    }, [isAddingAttachment, setIsUploading]);
    
    const handlePressAttachment = async (item) => {
        if (item.localUri) {
            await handleOpenLocalFile(item, {
                onImagePreview: (uri) => {
                    // Image preview handler
                    setSelectedFileUri(uri);
                    setImageModalVisible(true);
                },
                onTextPreview: (content) => {
                    // Text preview handler
                    setSelectedTextContent(content);
                    setTextModalVisible(true);
                },
                onPdfPreview: (pdfUri) => {
                    // PDF preview handler
                    setPdfDataUri(pdfUri);
                    setPdfModalVisible(true);
                },
                onVideoPreview: (uri) => {
                    // Video playback handler
                    setSelectedFileUri(uri);
                    setVideoModalVisible(true);
                },
                onAudioPreview: (uri) => {
                    // Audio playback handler
                    setSelectedFileUri(uri);
                    setAudioModalVisible(true);
                },
            });
        } else if (item.supabaseKey) {
            setPdfLoading(true);
            const localUri = await doDownloadSupabaseFile({
                attachment: item,
                attachments,
                setAttachments,
            });
            setPdfLoading(false);
            if (localUri) {
                handlePressAttachment({ ...item, localUri });
            }
        } else {
            Alert.alert('Error', 'No local file or supabaseKey to open.');
        }
    };

    return (
        <View style={tw`mt-5 border-t border-grayHd pt-3 px-2`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <ThemedText variant="xl" fontFamily="poppins-bold">Attachments</ThemedText>
                {isAddingAttachment ? (
                    <ActivityIndicator size="small" color={theme.colors.teal} style={tw`mr-2`} />
                ) : (
                    <TouchableOpacity
                        style={tw`flex-row items-center ${isDarkMode ? 'bg-darkSky' : 'bg-neon'} px-3 py-2 rounded-lg`}
                        onPress={async () => {
                            try {
                                setIsAddingAttachment(true);
                                await onAddAttachment();
                            } catch (err) {
                                console.log('Error adding attachment:', err);
                            } finally {
                                setIsAddingAttachment(false);
                            }
                        }}
                    >
                        <Ionicons name="attach" size={theme.fontSize.xl * fontScale} color={isDarkMode ? theme.colors.textPrimary : theme.colors.darkTextPrimary} />
                        <ThemedText variant="base" fontFamily="poppins-semibold" color={isDarkMode ? theme.colors.textPrimary : theme.colors.white} style={tw`ml-2`}>
                            Add
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>
            {/* Attachments list */}
            {attachments.length === 0 ? (
                <ThemedText variant="base" fontFamily="poppins-regular" style={tw`self-center`}>No attachments yet.</ThemedText>
            ) : (
                attachments.map((item, index) => (
                    <View 
                        key={index.toString()} 
                        style={tw`flex-row items-center justify-between p-4 mb-3 rounded-lg ${isDarkMode ? 'bg-darkCardBg border-darkTextSecondary' : 'bg-white border-grayHd'}`}
                    >
                        <TouchableOpacity onPress={() => handlePressAttachment(item)} style={tw`flex-1 mr-2`}>
                            <ThemedText 
                                variant="lg" 
                                ellipsizeMode="tail" 
                                color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary} 
                                numberOfLines={1}
                            >
                                {item.name}
                            </ThemedText>
                        </TouchableOpacity>
                        {/* Download icon if it has supabaseKey */}
                        {item.supabaseKey && (
                        <TouchableOpacity 
                            onPress={async () => {
                                setPdfLoading(true);
                                const localUri = await doDownloadSupabaseFile({
                                    attachment: item,
                                    attachments,
                                    setAttachments,
                                });
                                setPdfLoading(false);
                                if (localUri) {
                                    handlePressAttachment({ ...item, localUri });
                                }
                            }}
                            style={tw`mr-3`}
                        >
                            <Ionicons name="cloud-download" size={theme.fontSize.xl * fontScale} color={isDarkMode ? 'bg-darkSky' : 'bg-neon'} style={tw`mr-2`} />
                        </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => onRemoveAttachment(index)}>
                            <Ionicons name="trash" size={theme.fontSize.xl2 * fontScale} color={isDarkMode ? theme.colors.darkCinnabar : theme.colors.cinnabar} />
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
                <View style={tw`flex-1 justify-center items-center bg-darkBg/80`}>
                    <View style={tw`w-[90%] h-[80%] bg-darkBg rounded-lg`}>
                        <ImageBackground
                            source={{ uri: selectedFileUri }}
                            style={tw`flex-1`}
                            resizeMode="contain"
                        >
                            <TouchableOpacity style={tw`absolute top-3 right-3 bg-darkBg/50 p-2 rounded-full`} onPress={() => setImageModalVisible(false)}>
                                <Ionicons name="close" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
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
                <View style={tw`flex-1 bg-darkCardBg/80 justify-center items-center`}>
                    <View style={tw`w-[90%] h-[80%] bg-darkCardBg rounded-lg p-5 relative`}>
                        <TouchableOpacity 
                            style={tw`absolute top-1 right-1 p-1 bg-darkBg/20 rounded-full z-10`} 
                            onPress={() => setTextModalVisible(false)}
                        >
                            <Ionicons name="close" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
                        </TouchableOpacity>
                        <ScrollView contentContainerStyle={tw`mt-16`}>
                            <ThemedText variant="base" fontFamily="poppins-regular" color={theme.colors.white}>
                                {selectedTextContent}
                            </ThemedText>
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
                <View style={tw`flex-1 bg-white`}>
                    <TouchableOpacity 
                        style={tw`absolute top-10 right-5 z-10 bg-darkBg/50 p-2 rounded-full`} 
                        onPress={() => setPdfModalVisible(false)}
                    >
                        <Ionicons name="close" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
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
                                style={tw`flex-1`}
                                javaScriptEnabled
                                scalesPageToFit
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
                                <ActivityIndicator size="large" color={theme.colors.mint} style={tw`absolute inset-0 justify-center items-center`} />
                            )}
                        </>
                    ) : (
                        <ActivityIndicator size="large" color={theme.colors.mint} style={tw`flex-1 justify-center items-center`} />
                    )}
                </View>
            </Modal>

            {/* Video playback modal */}
            <Modal
                visible={videoModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setVideoModalVisible(false)}
            >
                <View style={tw`flex-1 bg-darkBg justify-center items-center`}>
                    <TouchableOpacity 
                        style={tw`absolute top-10 right-5 bg-darkBg/50 p-3 rounded-full`} 
                        onPress={() => setVideoModalVisible(false)}
                    >
                        <Ionicons name="close" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
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
                            style={tw`w-full h-[60%]`}
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
                <View style={tw`flex-1 bg-black justify-center items-center`}>
                    <TouchableOpacity 
                        style={tw`absolute top-10 right-5 bg-black/50 p-3 rounded-full`} 
                        onPress={() => setAudioModalVisible(false)}
                    >
                        <Ionicons name="close" size={theme.fontSize.xl2 * fontScale} color={theme.colors.white} />
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
                            style={tw`w-[80%] h-24`}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

// const styles = StyleSheet.create({
//     container: {
//         marginTop: 20,
//         borderTopWidth: 1,
//         borderTopColor: '#ccc',
//         paddingTop: 10,
//         paddingHorizontal: 10,
//     },
//     header: {
//         flexDirection:'row',
//         justifyContent:'space-between',
//         alignItems:'center',
//         marginBottom: 10
//     },
//     title: {
//         fontWeight: 'bold',
//         marginBottom: 10,
//         fontSize: 16,
//     },
//     attachmentItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 8,
//         padding: 10,
//         borderBottomWidth: 1,
//         borderBottomColor: '#ccc'
//     },
//     attachmentText: {
//         fontSize: 14,
//         color: '#333',
//     },
//     noAttachmentsText: {
//         color: '#666',
//         textAlign: 'center',
//         marginTop: 10,
//     },
//     addButton: {
//         flexDirection:'row',
//         backgroundColor:'#007bff',
//         padding:5,
//         borderRadius:5,
//         alignItems:'center'
//     },
//     addButtonText: {
//         color:'white',
//         marginLeft:5
//     },
//     modalBackground: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.8)',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     modalContainer: {
//         width: width * 0.9,
//         height: height * 0.8,
//         backgroundColor: '#000',
//         borderRadius: 10,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     imagePreview: {
//         flex: 1,
//         width: '100%',
//         height: '100%',
//         justifyContent: 'flex-start',
//         alignItems: 'flex-end',
//     },
//     textModalContainer: {
//         width: width * 0.9,
//         height: height * 0.8,
//         backgroundColor: '#333',
//         borderRadius: 10,
//         padding: 20,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     textContent: {
//         paddingTop: 50,
//     },
//     textPreview: {
//         color: '#fff',
//         fontSize: 16,
//     },
//     pdfModalContainer: {
//         flex: 1,
//         backgroundColor: '#fff',
//     },
//     pdfPreview: {
//         flex: 1,
//         width: '100%',
//         height: '100%',
//     },
//     closeButton: {
//         position: 'absolute',
//         top: 10,
//         right: 10,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         padding: 5,
//         borderRadius: 15,
//     },
//     closeButtonTop: {
//         position: 'absolute',
//         top: 40,
//         right: 20,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         padding: 10,
//         borderRadius: 25,
//         zIndex: 1,
//     },
//     videoModalContainer: {
//         flex: 1,
//         backgroundColor: '#000',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     videoPlayer: {
//         width: width,
//         height: height * 0.6,
//     },
//     audioModalContainer: {
//         flex: 1,
//         backgroundColor: '#000',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     audioPlayer: {
//         width: width * 0.8,
//         height: 100,
//     },
//     loader: {
//         flex: 1,
//         justifyContent: 'center',
//     },
// });

// export default AttachmentsList;