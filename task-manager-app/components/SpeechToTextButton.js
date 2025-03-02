import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { transcribeAudio } from "../helpers/transcriptionHelpers";

// A button that records audio using expo-av, uploads to Supabase, transcribes via AssemblyAI, calls onTranscribedText once recognised
export default function SpeechToTextButton({ onTranscribedText }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recording, setRecording] = useState(null);

    // Start recording audio
    const startRecording = async () => {
        try {
            // Request permission to record audio
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                alert('Please grant audio recording permission');
                return;
            }

            // Prepare to record
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Start recording
            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            await newRecording.startAsync();
            setRecording(newRecording);
            setIsRecording(true);
        } catch (error) {
            console.error('startRecording error:', error);
            Alert.alert('Could not start recording: ' + error.message);
        }
    };

    // Stop recording audio, start transcription
    const stopRecording = async () => {
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setIsRecording(false);
            setIsTranscribing(true);
            // Transcribe the recorded audio
            const transcription = await transcribeAudio(uri);
            setIsTranscribing(false);

            if (transcription) {
                onTranscribedText(transcription);
            }
        } catch (error) {
            console.error('stopRecording error:', error);
            setIsProcessing(false);
            Alert.alert('Could not upload/transcribe: ' + error.message);
        }
    };
    
    const onPressButton = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, isTranscribing && styles.recording ]}
            onPress={onPressButton}
            disabled={isTranscribing}
        >
            {isTranscribing ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.buttonText}>
                    {isRecording ? 'Stop' : 'Record'}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    recording: {
        backgroundColor: '#e53935',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
});