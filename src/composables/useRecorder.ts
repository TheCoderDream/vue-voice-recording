import { computed, ref, Ref } from 'vue';
import { AudioContextUtil } from '../utils';

export interface RecorderControls {
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    togglePauseAndResume: () => void;
    toggleStartAndStop: () => void;
    recordingBlob?: Ref<Blob | undefined>;
    isRecording: Ref<boolean>;
    isPaused: Ref<boolean>;
    recordingTime: Ref<string>;
    recordingState: Ref<RecordingState>;
}

export interface RecorderEvents {
    afterStartRecording: () => void;
    afterStopRecording: (data: Blob) => void;
    afterPauseRecording: () => void;
    afterResumeRecording: () => void;
    getAsMp3: (value: { data: Blob, url: string}) => void;
}

const toHHMMSS = (seconds: number): string =>  {
    return new Date(seconds * 1000).toISOString().slice(11, 19)
}

export const useRecorder: (options?: Partial<RecorderEvents>) => RecorderControls = (
    { afterStartRecording, afterStopRecording, afterPauseRecording, afterResumeRecording, getAsMp3 } = {}
) => {
    const isRecording = ref(false);
    const isPaused = ref(false);
    const mediaRecorder = ref<MediaRecorder | null>();
    const timerInterval = ref<any>(null);
    const recordingBlob = ref<Blob>();
    const recordingState = ref<RecordingState>('inactive');
    
    let audioContext = null;

    let audioContextInitializationPromise: Promise<void> | null = null;

    const initializeAudioContext = (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            try {
                //console.log("Creating Audio Context..."); 
                const ctx = new (window.AudioContext || window['webkitAudioContext'] as typeof AudioContext)();
                
                //console.log("Adding module to Audio Context...");
                const moduleURL = new URL('./mp3-encoder-processor.es.js', import.meta.url).href;
                await ctx.audioWorklet.addModule(moduleURL);

                audioContext = ctx;
                //console.log("Audio Context initialized successfully!");
                resolve();
            } catch (error) {
                console.error("Error in initializeAudioContext:", error);
                reject(error);
            }
        });
    };


    const ensureAudioContextInitialized = async () => {
        try {

            if (!audioContext || !(audioContext instanceof BaseAudioContext)) {
                await initializeAudioContext();
            }

        } catch (error) {
            console.error("Error initializing audio context:", error);
        }
    };

    const encodedDataBuffer = <any>[];

    const mic = ref<MediaStreamAudioSourceNode>();
    let mp3EncoderNode = null;
    const activeStream = ref<MediaStream>();
    const _recordingTime = ref(0);
    const recordingTime = computed(() => {
        return toHHMMSS(_recordingTime.value);
    })

    const _startTimer: () => void = () => {
        timerInterval.value = setInterval(() => {
            _recordingTime.value = _recordingTime.value + 1;
        }, 1000);
    };

    const _stopTimer: () => void = () => {
        timerInterval.value != null && clearInterval(timerInterval.value);
        timerInterval.value = null;
    };

    const toggleStartAndStop: () => void = () => {
        if (isRecording.value) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    const startRecording: () => void = async () => {
        // Clear encoded data buffer
        encodedDataBuffer.length = 0;
/*
        if (audioContext && audioContext.state !== "running") {
            console.error("AudioContext is not running");
            return;
        }
*/

        await ensureAudioContextInitialized();

        if (timerInterval.value !== null) return;

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                activeStream.value = stream;
                isRecording.value = true;
                const recorder: MediaRecorder = new MediaRecorder(stream);
                mediaRecorder.value = recorder;
                recorder.start();
                _startTimer();
                recordingState.value = 'recording';
                mic.value = audioContext.createMediaStreamSource(stream);



                mp3EncoderNode = new AudioWorkletNode(audioContext!, 'mp3-encoder-processor');
                mp3EncoderNode.port.onmessage = (event) => {
                    if (event.data.type === "encodedData") {
                        // Append the received encoded data to the buffer.
                        encodedDataBuffer.push(...event.data.data);
                    }
                };
                mic.value.connect(mp3EncoderNode);


                if (afterStartRecording) afterStartRecording();

                AudioContextUtil.startAnalyze(stream);
            })
            .catch((err) => console.log(err));
    };

    const getMp3 = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            if (encodedDataBuffer.length === 0) {
                reject(new Error('No buffer to send'));
            } else {
                resolve(new Blob(encodedDataBuffer, { type: 'audio/mp3' }));
                encodedDataBuffer.length = 0; // Clear the buffer
            }
        });
    };

    const stopRecording: () => void = () => {

        // Stop the MediaRecorder
        mediaRecorder.value?.stop();
        _stopTimer();
        _recordingTime.value = 0;
        isRecording.value = false;
        isPaused.value = false;
        recordingState.value = 'inactive';
        AudioContextUtil.resetAnalyser();

        // Generate MP3 blob from the buffer
        if (encodedDataBuffer.length > 0) {
            const blob = new Blob(encodedDataBuffer, { type: 'audio/mp3' });
            recordingBlob.value = blob;
            if (afterStopRecording) {
                afterStopRecording(blob);
            }
            if (getAsMp3) {
                const eventData = { data: blob, url: URL.createObjectURL(blob) };
                getAsMp3(eventData);
            }
        }

        // Disconnect and close the audio context
        if (audioContext) {
            if (mic.value) {
                mic.value.disconnect();
            }

            // Disconnect mp3EncoderNode when stopping recording
            if (mp3EncoderNode) {
                mp3EncoderNode.disconnect();
            }

            //audioContext.close();

            if (activeStream.value) {
                activeStream.value.getAudioTracks().forEach((track) => track.stop());
            }
        }

    };



    const togglePauseAndResume: () => void = () => {
        if (isPaused.value) {
            resumeRecording();
        } else {
            pauseRecording();
        }
    };

    const pauseRecording: () => void = () =>  {
        isPaused.value = true;
        recordingState.value = 'paused';
        AudioContextUtil.pauseAnalyze();
        mediaRecorder.value?.pause();
        audioContext.suspend();
        _stopTimer();
        if (afterPauseRecording) afterPauseRecording();
    }

    const resumeRecording: () => void = () => {
        isPaused.value = false;
        mediaRecorder.value?.resume();
        recordingState.value = 'recording';
        AudioContextUtil.resumeAnalyze();
        audioContext.resume();
        _startTimer();
        if (afterResumeRecording) afterResumeRecording();
    }

    return {
        startRecording,
        stopRecording,
        togglePauseAndResume,
        pauseRecording,
        resumeRecording,
        toggleStartAndStop,
        recordingBlob,
        isRecording,
        isPaused,
        recordingTime,
        recordingState,
    };
};
