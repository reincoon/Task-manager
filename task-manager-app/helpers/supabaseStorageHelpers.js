// Helpers for uploading files to Supabase Storage (private bucket) and getting a signed URL
// Helpers for downloading from Supabase to local filesystem, if user wants offline usage
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';

//  Guess mime type from extension
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

// Pick a file, upload to 'attachments' bucket in Supabase, return metadata to store in Firestore
export const uploadFileToSupabase = async (localUri, providedName) => {
    try {
        // // Pick a file
        // const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
        // if (result.canceled) {
        //     return null;
        // }

        // const asset = result.assets && result.assets.length > 0 ? result.assets[0] : null;
        // if (!asset) {
        //     Alert.alert('Error', 'No file selected.');
        //     return null;
        // }

        // const { name, uri } = asset;
        // let { mimeType } = asset;

        // if (!uri) {
        //     Alert.alert('Error', 'No file found.');
        //     return null;
        // }

        // // If mimeType is missing, infer from extension
        // if (!mimeType) {
        //     mimeType = getMimeTypeFromFileName(name);
        //     console.log(`Inferred mimeType: ${mimeType} for file: ${name}`);
        // }

        // Guess extension from provided name
        const name = providedName || ('file_' + uuidv4());
        let mimeType = getMimeTypeFromFileName(name);

        // // Convert file to a blob
        // const fileResponse = await fetch(localUri);
        // const fileBlob = await fileResponse.blob();

        // Read the file as a base64 string
        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
    
        // Convert base64 string to binary data
        const binary = Buffer.from(base64, 'base64');

        // Rename file with a unique ID and upload to Supabase private bucket
        const uniqueFileName = `${uuidv4()}-${name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(uniqueFileName, binary, {
                contentType: mimeType,
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            Alert.alert('Supabase Upload Error', uploadError.message);
            return null;
        }
        console.log('Upload success to Supabase: ', uploadData);

        // Generate a signed URL for the file that expires in 72 hours
        const { data: signedData, error: signedError } = await supabase.storage
            .from('attachments')
            .createSignedUrl(uniqueFileName, 60 * 60 * 72);

        if (signedError) {
            console.error('Signed URL Error:', signedError);
            Alert.alert('Signed URL error', signedError.message);
            return null;
        }
        const signedUrl = signedData.signedUrl;
        console.log('Signed URL: ', signedUrl);

        // Return an object with metadata
        return {
            originalName: name, // original file name
            supabaseKey: uniqueFileName, // actual name used in Supabase
            mimeType,
            signedUrl, // link to access the file
        };
    } catch (error) {
        console.log('Error in pickAndUploadFileToSupabase:', error);
        Alert.alert('Error', 'Something went wrong picking or uploading the file.');
        return null;
    }
};

// Returns fresh signed URL that user can view or download the file
export const getSignedUrlFromSupabase = async (supabaseKey) => {
    try {
        const { data, error } = await supabase.storage
            .from('attachments')
            .createSignedUrl(supabaseKey, 60 * 60 * 72);
        
        if (error) {
            console.log('Error creating signed URL:', error);
            return null;
        }
        return data.signedUrl;
    } catch (err) {
        console.log('Error in getSignedUrlFromSupabase:', err);
        return null;
    }
};

// Delete the file from Supabase entirely
export const removeFileFromSupabase = async (supabaseKey) => {
    try {
        const { data, error } = await supabase.storage
            .from('attachments')
            .remove([supabaseKey]);
        if (error) {
            console.log('Supabase remove error:', error);
            Alert.alert('Supabase Remove Error', error.message);
            return false;
        }
        console.log('Removed from Supabase:', data);
        return true;
    } catch (err) {
        console.log('Error removing file from Supabase:', err);
        Alert.alert('Error', 'Failed to remove the file from storage.');
        return false;
    }
};

// Generate a signed URL and download the file to local storage for offline usage
export const downloadFileFromSupabase = async (supabaseKey, localFileName = null) => {
    try {
        // get a signed URL
        const signedUrl = await getSignedUrlFromSupabase(supabaseKey);
        if (!signedUrl) {
            Alert.alert('Error', 'Could not fetch signed URL from Supabase');
            return null;
        }
        // Decide on a local path
        const fileName = localFileName || supabaseKey;
        const localUri = FileSystem.documentDirectory + fileName;

        // Download
        const { uri, status } = await FileSystem.downloadAsync(signedUrl, localUri);
        if (status !== 200) {
            Alert.alert('Download error', 'Status code: ' + status);
            return null;
        }
        // local path
        return uri;
    } catch (err) {
        console.log('downloadFileFromSupabase error:', err);
        return null; 
    }
};