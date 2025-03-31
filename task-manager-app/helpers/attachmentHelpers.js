/** handles:
    * Picking a file from DocumentPicker
    * Copying locally for offline usage
    * Uploading to Supabase
    * Adding to the in-memory attachments array
    * Removing an attachment from memory + local storage + Supabase
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { uploadFileToSupabase, downloadFileFromSupabase, removeFileFromSupabase } from './supabaseStorageHelpers';

// Add an attachment by picking a file, copying it locally, and uploading to Supabase
export const addAttachmentOfflineAndOnline = async ({ attachments, setAttachments, addedAttachments, setAddedAttachments, }) => {
    // return a promise that resolves only after the local state is updated
    return new Promise(async (resolve, reject) => {
        try {
            // Pick a file
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                resolve();
                return;
            }

            const asset = result.assets?.[0];

            if (!asset) {
                Alert.alert('Error', 'No file selected.');
                resolve();
                return;
            }

            const { name, uri } = asset;
            let mimeType = asset.mimeType;

            if (!uri) {
                Alert.alert('Error', 'No file URI found.');
                resolve();
                return;
            }

            // Copy file locally
            const localFileName = `${Date.now()}-${name}`;
            const localUri = FileSystem.documentDirectory + localFileName;

            try {
                await FileSystem.copyAsync({ from: uri, to: localUri });
            } catch (copyErr) {
                try {
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    await FileSystem.writeAsStringAsync(localUri, base64, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                } catch (base64Err) {
                    Alert.alert('Error', 'Failed to load the file. Please try a different file type or location.');
                    resolve();
                    return;
                }
            }

            // upload to Supabase
            const supRes = await uploadFileToSupabase(localUri, name);
            let supabaseKey = null; 
            let signedUrl = null;
            let finalMime = mimeType || supRes?.mimeType || 'application/octet-stream';

            if (supRes) {
                supabaseKey = supRes.supabaseKey;
                signedUrl = supRes.signedUrl;
            }

            // Build the final attachment object
            const newAttachment = {
                name,
                mimeType: finalMime,
                localUri,
                supabaseKey,
                signedUrl
            };


            const updatedAttachments = [...attachments, newAttachment];
            console.log('Updated Attachments:', updatedAttachments);
            setAttachments(updatedAttachments);
            // Track added attachments for potential cleanup on cancel
            setAddedAttachments([...addedAttachments, newAttachment]);
            resolve();
        } catch (error) {
            Alert.alert('Error', 'Failed to pick the file');
            reject(err);
        }
    });
};

// Remove an attachment by index, deleting the local file and updating Firestore
export const removeAttachment = async ({ attachments, setAttachments, index, shouldDeleteSupabase = true }) => {
    try {
        const removed = attachments[index];
        const updated = [...attachments];
        updated.splice(index, 1);
        setAttachments(updated);

        // Delete the file from local storage
        if (removed.localUri) {
            await FileSystem.deleteAsync(removed.localUri, { idempotent: true });
        }

        // remove from Supabase if there's a supabaseKey and it should be removed
        if (shouldDeleteSupabase  && removed.supabaseKey) {
            const success = await removeFileFromSupabase(removed.supabaseKey);
            if (!success) {
                Alert.alert('Error', 'Failed to delete the file "${removed.name}" from storage.');
            }
        }
    } catch (error) {
        Alert.alert('Error', 'Failed to remove the attachment');
    }
};

export const handleOpenLocalFile = async (
    { localUri, mimeType },
    {
        onImagePreview,
        onTextPreview,
        onPdfPreview,
        onVideoPreview,
        onAudioPreview,
    }
) => {  
    if (!localUri) {
        Alert.alert('Error', 'No local file URI to open.');
        return;
    }
    
    try {
        // images
        if (mimeType?.startsWith('image/')) {
            onImagePreview(localUri);
        }
        // pdf
        else if (mimeType === 'application/pdf') {
            const pdfBase64 = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const dataUri = `data:application/pdf;base64,${pdfBase64}`;
            onPdfPreview(dataUri);
        }
        // text
        else if (mimeType?.startsWith('text/')) {
            const content = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.UTF8,
            });
            onTextPreview(content);
        }
        // video
        else if (mimeType?.startsWith('video/')) {
            onVideoPreview(localUri);
        }
        // audio
        else if (mimeType?.startsWith('audio/')) {
            onAudioPreview(localUri);
        } else {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(localUri, { dialogTitle: 'Open File' });
            } else {
                Alert.alert('Unsupported', 'File type not supported in-app. Try an external app.');
            }
        }
    } catch (err) {
        Alert.alert('Error', 'Could not open local file.');
    }
};

// Fetch file from Supabase
export const doDownloadSupabaseFile = async ({
    attachment,
    attachments,
    setAttachments,
}) => {
    if (!attachment.supabaseKey) {
        Alert.alert('Error', 'No supabaseKey for this file');
        return;
    }
    // pick a local name
    const localFileName = `${attachment.supabaseKey}-downloaded`;
    const downloadedUri = await downloadFileFromSupabase(
        attachment.supabaseKey,
        localFileName
    );
    if (!downloadedUri) return;

    // update the attachment in memory
    const idx = attachments.findIndex((a) => a === attachment);
    if (idx !== -1) {
        const copy = [...attachments];
        copy[idx] = {
            ...attachment,
            localUri: downloadedUri,
        };
        setAttachments(copy);
        return downloadedUri;
    }
    return null;
};