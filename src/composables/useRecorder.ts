import { computed, ref, Ref } from 'vue';
import { MP3Encoder, AudioContext } from '../utils';

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
    const audioContext = new (window.AudioContext ||
        window['webkitAudioContext'])();
    const mic = ref<MediaStreamAudioSourceNode>();
    const processor = ref<ScriptProcessorNode>();
    const activeStream = ref<MediaStream>();
    const encoder = new MP3Encoder();
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

    const startRecording: () => void = () => {
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
                processor.value = audioContext.createScriptProcessor(0, 1, 1);
                mic.value.connect(processor.value);
                processor.value.connect(audioContext.destination);

                processor.value.onaudioprocess = (event) => {
                    encoder.encode(event.inputBuffer.getChannelData(0));
                };

                if (afterStartRecording) afterStartRecording();

                recorder.addEventListener('dataavailable', (event: BlobEvent) => {
                    recordingBlob.value = event.data;
                    recorder.stream.getTracks().forEach((t) => t.stop());
                    mediaRecorder.value = null;
                    if (afterStopRecording) afterStopRecording(event.data);
                    if (getAsMp3) {
                        getMp3().then((data) => getAsMp3({data, url: URL.createObjectURL(data)}));
                    }
                });
                AudioContext.startAnalyze(stream);
            })
            .catch((err) => console.log(err));
    };

    const getMp3 = (): Promise<Blob> => {
        const finalBuffer = encoder.finish();

        return new Promise((resolve, reject) => {
            if (finalBuffer.length === 0) {
                reject(new Error('No buffer to send'));
            } else {
                resolve(new Blob(finalBuffer, { type: 'audio/mp3' }));
                encoder.clearBuffer();
            }
        });
    };

    const stopRecording: () => void = () => {
        mediaRecorder.value?.stop();
        _stopTimer();
        _recordingTime.value = 0;
        isRecording.value = false;
        isPaused.value = false;
        recordingState.value = 'inactive';
        AudioContext.resetAnalyser();

        if (processor.value && mic.value) {
            mic.value.disconnect();
            processor.value.disconnect();
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
            }
            processor.value.onaudioprocess = null;

            activeStream.value?.getAudioTracks().forEach((track) => track.stop());
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
        AudioContext.pauseAnalyze();
        mediaRecorder.value?.pause();
        audioContext.suspend();
        _stopTimer();
        if (afterPauseRecording) afterPauseRecording();
    }

    const resumeRecording: () => void = () => {
        isPaused.value = false;
        mediaRecorder.value?.resume();
        recordingState.value = 'recording';
        AudioContext.resumeAnalyze();
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
