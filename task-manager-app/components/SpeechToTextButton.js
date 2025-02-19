import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';

const ASSEMBLYAI_API_KEY = 'f67efaeeb1ea48c78a00eeab7b86384b';

// A button that records audio using expo-av, uploads to Supabase, transcribes via AssemblyAI, calls onTranscribedText once recognised
export default function SpeechToTextButton({ onTranscribedText }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recording, setRecording] = useState(null);
    // const pollIntervalRef = useRef(null);

    const startRecording = async () => {
        try {
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

    const stopRecording = async () => {
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setIsRecording(false);
            setIsTranscribing(true);
            console.log('Recorded URI:', uri);
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
    
    const transcribeAudio = async (uri) => {
        try {
            // Convert local file URI to a blob
            const fileResponse = await fetch(uri);
            const blob = await fileResponse.blob();

            // Upload the audio file to AssemblyAI
            const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    authorization: ASSEMBLYAI_API_KEY,
                },
                body: blob,
            });

            const uploadResult = await uploadResponse.json();
            const audioUrl = uploadResult.upload_url;
            if (!audioUrl) {
                throw new Error('Failed to upload audio to AssemblyAI');
            }
            // Request transcription from AssemblyAI
            const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: ASSEMBLYAI_API_KEY,
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    language_code: 'en',
                }),
            });
            const transcriptResult = await transcriptResponse.json();
            const transcriptId = transcriptResult.id;
            if (!transcriptId) {
                throw new Error('Failed to start transcription');
            }
            // Poll for transcription endpoint until the transcription is complete
            let transcriptText = '';
            while (true) {
                const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                    headers: { authorization: ASSEMBLYAI_API_KEY },
                });
                const pollingResult = await pollResponse.json();
                if (pollingResult.status === 'completed') {
                    transcriptText = pollingResult.text;
                    break;
                } else if (pollingResult.status === 'error') {
                    throw new Error(pollingResult.error);
                }
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
            return transcriptText;
        } catch (error) {
            console.error('transcribeAudio error:', error);
            Alert.alert('Could not transcribe audio: ' + error.message);
            return null;
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
            style={[styles.button, (isTranscribing ? styles.recording : null)]}
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