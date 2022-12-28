declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

const audioCtx = new (window.AudioContext || window['webkitAudioContext'])();
let analyser = audioCtx.createAnalyser();

export const AudioContext = {
  getAudioContext(): AudioContext {
    return audioCtx;
  },

  startAnalyze(stream: MediaStream): void {
    const audioCtx = AudioContext.getAudioContext();
    audioCtx.resume().then(() => {
      const analyser = AudioContext.getAnalyser();
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
    });
  },

  pauseAnalyze(): void {
    const audioCtx = AudioContext.getAudioContext();
    void audioCtx.suspend();
  },

  resumeAnalyze(): void {
    const audioCtx = AudioContext.getAudioContext();
    void audioCtx.resume();
  },

  getAnalyser(): AnalyserNode {
    return analyser;
  },

  resetAnalyser(): void {
    analyser = audioCtx.createAnalyser();
  },
};
