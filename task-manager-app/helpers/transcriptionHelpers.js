// Functions for converting a local audio file URI into a Blob,
// uploading the audio to AssemblyAI, requesting transcription, and polling for results
const ASSEMBLYAI_API_KEY = 'f67efaeeb1ea48c78a00eeab7b86384b';

// Convert a local file URI to a Blob
export async function fileUriToBlob(uri) {
    const response = await fetch(uri);
    return await response.blob();
}

// Upload the audio Blob to AssemblyAI
export async function uploadAudioToAssemblyAI(blob) {
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
    return audioUrl;
}

// Request a new transcription from AssemblyAI
export async function requestTranscription(audioUrl) {
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
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
    return transcriptId;
}

// Poll AssemblyAI for the transcription results
export async function pollTranscription(transcriptId) {
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
        // Wait 5 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    return transcriptText;
}

// Transcribe an audio file given its local URI
export async function transcribeAudio(uri) {
    // Convert the local file to a Blob
    const blob = await fileUriToBlob(uri);
    // Upload the audio to AssemblyAI
    const audioUrl = await uploadAudioToAssemblyAI(blob);
    // Request transcription and get the transcript ID
    const transcriptId = await requestTranscription(audioUrl);
    // Poll AssemblyAI until the transcription is complete
    const transcriptText = await pollTranscription(transcriptId);
    return transcriptText;
}