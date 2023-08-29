declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

const audioCtx = new (window.AudioContext || window['webkitAudioContext'] as typeof AudioContext)();
let analyser = audioCtx.createAnalyser();

export const AudioContextUtil = {
  getAudioContext(): AudioContext {
    return audioCtx;
  },

  startAnalyze(stream: MediaStream): void {
    const audioCtx = AudioContextUtil.getAudioContext();
    audioCtx.resume().then(() => {
      const analyser = AudioContextUtil.getAnalyser();
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
    });
  },

  pauseAnalyze(): void {
    const audioCtx = AudioContextUtil.getAudioContext();
    void audioCtx.suspend();
  },

  resumeAnalyze(): void {
    const audioCtx = AudioContextUtil.getAudioContext();
    void audioCtx.resume();
  },

  getAnalyser(): AnalyserNode {
    return analyser;
  },

  resetAnalyser(): void {
    analyser = audioCtx.createAnalyser();
  },
};
