import { useState } from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { transcribeAudio } from "../helpers/transcriptionHelpers";
import tw, { theme } from '../twrnc';

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

    const bgColour = (isRecording || isTranscribing) ? tw`bg-cinnabar` : tw`bg-teal`;

    return (
        <TouchableOpacity
            style={[
                tw`ml-1 rounded-full p-2 justify-center items-center`, 
                bgColour ]}
            onPress={onPressButton}
            disabled={isTranscribing}
        >
            {isTranscribing ? (
                <ActivityIndicator color={theme.colors.white} />
            ) : isRecording ? (
                <Ionicons name="stop-circle" size={theme.fontSize.xl2} color={theme.colors.white} />
            ) : (
                <Ionicons name="mic-outline" size={theme.fontSize.xl2} color={theme.colors.white} />
            )}
        </TouchableOpacity>
    );
}
