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

// // Infer the MIME type based on the file extension.
// const getMimeTypeFromFileName = (fileName) => {
//     const extension = fileName.split('.').pop().toLowerCase();
//     const mimeTypes = {
//         // Images
//         jpg: 'image/jpeg',
//         jpeg: 'image/jpeg',
//         png: 'image/png',
//         gif: 'image/gif',
//         webp: 'image/webp',
//         heic: 'image/heic',
//         // Documents
//         pdf: 'application/pdf',
//         doc: 'application/msword',
//         docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         xls: 'application/vnd.ms-excel',
//         xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         ppt: 'application/vnd.ms-powerpoint',
//         pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//         txt: 'text/plain',
//         csv: 'text/csv',
//         xml: 'application/xml',
//         epub: 'application/epub+zip',
//         // Audio
//         mp3: 'audio/mpeg',
//         wav: 'audio/wav',
//         // Video
//         mp4: 'video/mp4',
//         mov: 'video/quicktime',
//         avi: 'video/x-msvideo',
//         mkv: 'video/x-matroska',
//     };

//     return mimeTypes[extension] || 'application/octet-stream';
// };

// Add an attachment by picking a file, copying it locally, and uploading to Supabase
export const addAttachmentOfflineAndOnline = async ({ attachments, setAttachments }) => {
    try {
        // Pick a file
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return;
        }

        // const asset = result.assets && result.assets.length > 0 ? result.assets[0] : null;
        const asset = result.assets?.[0];

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

        // // If mimeType is undefined, infer it based on file extension
        // if (!mimeType) {
        //     mimeType = getMimeTypeFromFileName(name);
        //     console.log(`Inferred mimeType: ${mimeType} for file: ${name}`);
        // }

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
        // if (!supRes) {
        //     // Upload failed, clean up and do not add the attachment
        //     await FileSystem.deleteAsync(localUri, { idempotent: true });
        //     return;
        // }
        // Build the final attachment object
        const newAttachment = {
            name,
            mimeType: finalMime,
            // mimeType: supRes.mimeType || 'application/octet-stream',
            localUri,  
            // supabaseKey: supRes.supabaseKey, 
            // signedUrl: supRes.signedUrl,
            supabaseKey,
            signedUrl
        };


        // const info = await FileSystem.getInfoAsync(newUri);

        // if (!info.exists) {
        //     Alert.alert('Error', 'File failed to copy locally.');
        //     return;
        // }

        // const newAttachment = { name, uri: newUri, mimeType };
        // console.log('New Attachment:', newAttachment);
        const updatedAttachments = [...attachments, newAttachment];
        console.log('Updated Attachments:', updatedAttachments);
        setAttachments(updatedAttachments);
    } catch (error) {
        console.log('DocumentPicker error:', error);
        Alert.alert('Error', 'Failed to pick the file');
    }
};

// Remove an attachment by index, deleting the local file and updating Firestore
export const removeAttachment = async ({ attachments, setAttachments, index }) => {
    try {
        // const updatedAttachments = [...attachments];
        // const removed = updatedAttachments.splice(index, 1);
        // setAttachments(updatedAttachments);
        const removed = attachments[index];
        const updated = [...attachments];
        updated.splice(index, 1);
        setAttachments(updated);

        // Delete the file from local storage
        if (removed.localUri) {
            await FileSystem.deleteAsync(removed.localUri, { idempotent: true });
        }

        // remove from Supabase if there's a supabaseKey
        if (removed.supabaseKey) {
            await removeFileFromSupabase(removed.supabaseKey);
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
    // const { localUri, supabaseKey, mimeType } = attachment;
    // const {
    //     onImagePreview, onTextPreview, onPdfPreview, onVideoPreview, onAudioPreview,
    //     onNeedDownload,
    // } = callbacks;

    // // If localUri, open from local
    // if (localUri) {
    //     console.log('Opening local file:', localUri);

    // } else if (supabaseKey) {
    //     if (onNeedDownload) {
    //         onNeedDownload(supabaseKey);
    //     }
    // } else {
    //     Alert.alert('Error', 'No local file or supabase key for this attachment.');
    // }
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
        console.log('Error opening local file:', err);
        Alert.alert('Error', 'Could not open local file.');
    }




    // try {
    //     console.log(`Opening file with URI: ${uri} and MIME type: ${mimeType}`);

    //     if (mimeType && typeof mimeType.startsWith === 'function') {
    //         if (mimeType.startsWith('image/')) {
    //             // If the attachment is an image, preview it within the app (in modal)
    //             onImagePreview(uri);
    //         } else if (mimeType === 'application/pdf') {
    //             try {
    //                 const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
    //                     encoding: FileSystem.EncodingType.Base64,
    //                 });
    //                 const dataUri = `data:application/pdf;base64,${pdfBase64}`;
    //                 console.log(`Generated PDF Data URI length: ${dataUri.length}`);
    //                 onPdfPreview(dataUri);
    //             } catch (error) {
    //                 console.log('Error opening PDF:', error);
    //                 Alert.alert('Error', 'Failed to open the PDF file.');
    //             }
    //         } else if (mimeType.startsWith('video/')) {
    //             // Play video within the app (using expo-av library)
    //             onVideoPreview(uri);
    //         } else if (mimeType.startsWith('text/')) {
    //             // In-app text preview
    //             // const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    //             // onTextPreview(content);
    //             try {
    //                 const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    //                 onTextPreview(content);
    //             } catch (error) {
    //                 console.log('Error reading text file:', error);
    //                 Alert.alert('Error', 'Failed to read the text file.');
    //             }
    //         } else if (mimeType.startsWith('audio/')) {
    //             // In-app audio playback
    //             onAudioPreview(uri);
    //         } else {
    //             // Open other document types with external apps (using expo-sharing library)
    //             const isAvailable = await Sharing.isAvailableAsync();
    //             if (!isAvailable) {
    //                 Alert.alert(
    //                     'Unsupported File',
    //                     'This file type is not supported for preview. Please open it with an appropriate app.'
    //                 );
    //                 return;
    //             }
    //             await Sharing.shareAsync(uri, { dialogTitle: 'Open File' });
    //         }
    //     } else {
    //         // Attempt to open with external apps
    //         const isAvailable = await Sharing.isAvailableAsync();
    //         if (isAvailable) {
    //             await Sharing.shareAsync(uri, { dialogTitle: 'Open File' });
    //         }
    //     }
    // } catch (error) {
    //     console.log('Error opening attachment:', error);
    //     Alert.alert('Error', 'Failed to open the attachment.');
    // }
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