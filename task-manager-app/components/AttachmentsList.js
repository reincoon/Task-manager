import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, ImageBackground, ActivityIndicator, ScrollView, Alert } from 'react-native';
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
        <View style={tw`mt-5 border-t border-darkTextSecondary pt-3 px-2`}>
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
                        <Ionicons 
                            name="attach" 
                            size={theme.fontSize.xl * fontScale} 
                            color={isDarkMode ? theme.colors.textPrimary : theme.colors.darkTextPrimary} 
                        />
                        <ThemedText 
                            variant="base" 
                            fontFamily="poppins-semibold" 
                            color={isDarkMode ? theme.colors.textPrimary : theme.colors.white} 
                            style={tw`ml-2`}
                        >
                            Add
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>
            {/* Attachments list */}
            {attachments.length === 0 ? (
                <ThemedText variant="base" fontFamily="poppins-regular" style={tw`self-center`}>
                    No attachments yet.
                </ThemedText>
            ) : (
                attachments.map((item, index) => (
                    <View 
                        key={index.toString()} 
                        style={tw`flex-row items-center justify-between p-4 mb-3 rounded-lg ${isDarkMode ? 'bg-darkCardBg border-darkTextSecondary' : 'bg-white border-darkTextSecondary'}`}
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
                        <ScrollView 
                            contentContainerStyle={tw`mt-16`}
                            indicatorStyle={isDarkMode ? 'white' : 'black'}
                        >
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
                <View style={tw`flex-1 bg-darkBg justify-center items-center`}>
                    <TouchableOpacity 
                        style={tw`absolute top-10 right-5 bg-darkBg/50 p-3 rounded-full`} 
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