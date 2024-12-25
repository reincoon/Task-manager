import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
// import * as FileViewer from 'expo-file-viewer';

// Infer the MIME type based on the file extension.
const getMimeTypeFromFileName = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
        // Images
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        heic: 'image/heic',
        // Documents
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        txt: 'text/plain',
        csv: 'text/csv',
        xml: 'application/xml',
        epub: 'application/epub+zip',
        // Audio
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        // Video
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        mkv: 'video/x-matroska',
    };

    return mimeTypes[extension] || 'application/octet-stream';
};

// Add an attachment by picking a file, copying it locally, and updating Firestore
export const addAttachment = async ({ setAttachments, attachments, userId, taskId }) => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return;
        }

        const asset = result.assets && result.assets.length > 0 ? result.assets[0] : null;

        if (!asset) {
            Alert.alert('Error', 'No file selected.');
            return;
        }

        const { name, uri } = asset;
        let mimeType = asset.mimeType;

        if (!uri) {
            Alert.alert('Error', 'No file URI found.');
            return;
        }

        // If mimeType is undefined, infer it based on file extension
        if (!mimeType) {
            mimeType = getMimeTypeFromFileName(name);
            console.log(`Inferred mimeType: ${mimeType} for file: ${name}`);
        }

        const fileName = `${Date.now()}-${name}`;
        const newUri = FileSystem.documentDirectory + fileName;

        try {
            await FileSystem.copyAsync({ from: uri, to: newUri });
        } catch (copyErr) {
            try {
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                await FileSystem.writeAsStringAsync(newUri, base64, {
                    encoding: FileSystem.EncodingType.Base64,
                });
            } catch (base64Err) {
                Alert.alert('Error', 'Failed to load the file. Please try a different file type or location.');
                return;
            }
        }

        const info = await FileSystem.getInfoAsync(newUri);

        if (!info.exists) {
            Alert.alert('Error', 'File failed to copy locally.');
            return;
        }

        const newAttachment = { name, uri: newUri, mimeType };
        console.log('New Attachment:', newAttachment);
        const updatedAttachments = [...attachments, newAttachment];
        console.log('Updated Attachments:', updatedAttachments);
        setAttachments(updatedAttachments);

        // // Update Firestore
        // if (taskId && userId) {
        //     const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        //     try {
        //         await updateDoc(taskDocRef, { attachments: updatedAttachments });
        //         console.log('Firestore updated with new attachment.');
        //     } catch (firestoreError) {
        //         console.log('Firestore update error:', firestoreError);
        //         Alert.alert('Error', 'Failed to update Firestore with the attachment.');
        //     }
            
        // }
    } catch (error) {
        console.log('DocumentPicker error:', error);
        Alert.alert('Error', 'Failed to pick the file');
    }
};

// Remove an attachment by index, deleting the local file and updating Firestore
export const removeAttachment = async ({ setAttachments, attachments, index, userId, taskId }) => {
    try {
        const updatedAttachments = [...attachments];
        const removed = updatedAttachments.splice(index, 1);
        setAttachments(updatedAttachments);

        // Delete the file from local storage
        if (removed[0]?.uri) {
            await FileSystem.deleteAsync(removed[0].uri, { idempotent: true });
            console.log('Deleted file:', removed[0].uri);
        }

        // // Update Firestore
        // if (taskId && userId) {
        //     const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
        //     await updateDoc(taskDocRef, { attachments: updatedAttachments });
        // }
    } catch (error) {
        console.log('Error removing attachment:', error);
        Alert.alert('Error', 'Failed to remove the attachment');
    }
};

export const handleOpenAttachment = async (uri, mimeType, onImagePreview, onTextPreview, onPdfPreview, onVideoPreview, onAudioPreview) => {
    try {
        console.log(`Opening file with URI: ${uri} and MIME type: ${mimeType}`);

        if (mimeType && typeof mimeType.startsWith === 'function') {
            if (mimeType.startsWith('image/')) {
                // If the attachment is an image, preview it within the app (in modal)
                onImagePreview(uri);
            } else if (mimeType === 'application/pdf') {
                try {
                    const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const dataUri = `data:application/pdf;base64,${pdfBase64}`;
                    console.log(`Generated PDF Data URI length: ${dataUri.length}`);
                    onPdfPreview(dataUri);
                } catch (error) {
                    console.log('Error opening PDF:', error);
                    Alert.alert('Error', 'Failed to open the PDF file.');
                }
            } else if (mimeType.startsWith('video/')) {
                // Play video within the app (using expo-av library)
                onVideoPreview(uri);
            } else if (mimeType.startsWith('text/')) {
                // In-app text preview
                // const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
                // onTextPreview(content);
                try {
                    const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
                    onTextPreview(content);
                } catch (error) {
                    console.log('Error reading text file:', error);
                    Alert.alert('Error', 'Failed to read the text file.');
                }
            } else if (mimeType.startsWith('audio/')) {
                // In-app audio playback
                onAudioPreview(uri);
            } else {
                // Open other document types with external apps (using expo-sharing library)
                const isAvailable = await Sharing.isAvailableAsync();
                if (!isAvailable) {
                    Alert.alert(
                        'Unsupported File',
                        'This file type is not supported for preview. Please open it with an appropriate app.'
                    );
                    return;
                }
                await Sharing.shareAsync(uri, { dialogTitle: 'Open File' });
            }
        } else {
            // Attempt to open with external apps
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, { dialogTitle: 'Open File' });
            }
        }
    } catch (error) {
        console.log('Error opening attachment:', error);
        Alert.alert('Error', 'Failed to open the attachment.');
    }
};