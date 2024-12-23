import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Linking } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as Sharing from 'expo-sharing';

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

        console.log('DocumentPicker result:', result);

        const asset = result.assets && result.assets.length > 0 ? result.assets[0] : null;

        if (!asset) {
            Alert.alert('Error', 'No file selected.');
            return;
        }

        const { name, uri, mimeType } = asset;

        if (!uri) {
            Alert.alert('Error', 'No file URI found.');
            return;
        }

        const fileName = `${Date.now()}-${name}`;
        const newUri = FileSystem.documentDirectory + fileName;

        console.log('Copying from:', uri, 'to:', newUri);

        try {
            await FileSystem.copyAsync({ from: uri, to: newUri });
            console.log('File copied to:', newUri);
        } catch (copyErr) {
            console.log('copyAsync error:', copyErr);
            try {
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                await FileSystem.writeAsStringAsync(newUri, base64, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                console.log('File written from base64 to:', newUri);
            } catch (base64Err) {
                console.log('base64 fallback error:', base64Err);
                Alert.alert(
                    'Error',
                    'Failed to load the file. Please try a different file type or location.'
                );
                return;
            }
        }

        const info = await FileSystem.getInfoAsync(newUri);
        console.log('File info from newUri:', info);

        if (!info.exists) {
            Alert.alert('Error', 'File failed to copy locally.');
            return;
        }

        const newAttachment = { name, uri: newUri, mimeType };
        const updatedAttachments = [...attachments, newAttachment];
        setAttachments(updatedAttachments);

        // Update Firestore
        if (taskId && userId) {
            const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
            await updateDoc(taskDocRef, { attachments: updatedAttachments });
        }
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

        // Update Firestore
        if (taskId && userId) {
            const taskDocRef = doc(db, `tasks/${userId}/taskList`, taskId);
            await updateDoc(taskDocRef, { attachments: updatedAttachments });
        }
    } catch (error) {
        console.log('Error removing attachment:', error);
        Alert.alert('Error', 'Failed to remove the attachment');
    }
};

export const handleOpenAttachment = async (uri, mimeType, onImagePreview) => {
    try {
        // const supported = await Linking.canOpenURL(uri);
        // if (supported) {
        //     await Linking.openURL(uri);
        // } else {
        //     Alert.alert('Error', 'Cannot open this file.');
        // }
        if (mimeType && mimeType.startsWith('image/')) {
            // If the attachment is an image, preview it within the app
            onImagePreview(uri);
            return;
        }

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('Error', 'Sharing is not available on this platform');
            return;
        }

        await Sharing.shareAsync(uri);
    } catch (error) {
        console.log('Error opening attachment:', error);
        Alert.alert('Error', 'Failed to open the attachment.');
    }
    
};