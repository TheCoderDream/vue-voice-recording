<template>
  <slot
      :isRecording="isRecording"
      :isPaused="isPaused"
      :recordingTime="recordingTime"
      :recordingState="recordingState"
      :toggleStartAndStop="toggleStartAndStop"
      :togglePauseAndResume="togglePauseAndResume"
      :startRecording="startRecording"
      :stopRecording="stopRecording"
      :pauseRecording="pauseRecording"
      :resumeRecording="resumeRecording"
  >
    <div class="vue-voice-recorder">
      <div class="vue-voice-recorder__container">
        <div class="vue-voice-recorder__start-and-stop" @click="toggleStartAndStop">
          <div class="vue-voice-recorder__state">
            <span v-if="isRecording" class="vue-voice-recorder__stop"></span>
            <svg v-if="!isRecording" class="vue-voice-recorder__start"
                 xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                 aria-hidden="true"
                 preserveAspectRatio="xMidYMid meet"
                 viewBox="0 0 24 24"
            >
              <path fill="currentColor" d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14Zm-1 7v-3.075q-2.6-.35-4.3-2.325Q5 13.625 5 11h2q0 2.075 1.463 3.537Q9.925 16 12 16t3.538-1.463Q17 13.075 17 11h2q0 2.625-1.7 4.6q-1.7 1.975-4.3 2.325V21Z"></path>
            </svg>
          </div>
        </div>
        <template v-if="isRecording">
          <div class="vue-voice-recorder__recording-time">
            {{ recordingTime }}
          </div>
          <div class="vue-voice-recorder__pause-and-resume" @click="togglePauseAndResume">
            <span :class="[!isPaused && 'vue-voice-recorder--blink']"></span>
            <p>{{ recordingState }}</p>
          </div>
        </template>
      </div>
      <canvas v-if="props.showVisualization" :class="[!isRecording && 'visualization--hidden']" ref="canvas"></canvas>
    </div>
  </slot>
</template>

<script lang="ts" setup>
import { useRecorder } from '../composables';
import { defineEmits, onMounted, PropType, ref } from 'vue';
import { AudioVisualizationType, AudioVisualizationOptions, AudioVisualizer } from '../utils';

const canvas = ref<HTMLCanvasElement>();

const props = defineProps({
  showVisualization: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
  visualizationType: {
    type: String as PropType<AudioVisualizationType>,
    default: 'SineWave',
  },
  visualizationOptions: {
    type: Object as PropType<Omit<AudioVisualizationOptions, 'canvas'>>,
    default: {}
  }
});

export interface RecorderEvents {
  afterStartRecording: () => void;
  afterStopRecording: (data: Blob) => void;
  afterPauseRecording: () => void;
  afterResumeRecording: () => void;
  getAsMp3(): (data: Blob) => void;
}

const emits = defineEmits([
    'afterStartRecording',
    'afterStopRecording',
    'afterPauseRecording',
    'afterResumeRecording',
    'getAsMp3'
]);

const {
  isRecording,
  recordingTime,
  isPaused,
  recordingState,
  toggleStartAndStop,
  togglePauseAndResume,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording
} = useRecorder({
  afterStartRecording: () => emits('afterStartRecording'),
  afterStopRecording: (blob) => emits('afterStartRecording', blob),
  afterPauseRecording: () => emits('afterPauseRecording'),
  afterResumeRecording: () => emits('afterResumeRecording'),
  getAsMp3: () => emits('getAsMp3'),
});

onMounted(() => {
  if (props.showVisualization && canvas.value) {
    AudioVisualizer.visualize(props.visualizationType, {
      canvas: canvas.value,
      ...props.visualizationOptions
    })
  }
})
</script>

<style lang="scss">
.vue-voice-recorder {
  width: 400px;

  &__container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &  * {
    box-sizing: border-box;
  }

  & > canvas {
    width: 100%;
  }

  &__recording-time {
    color: #282828;
    font-size: 24px;
    font-weight: bold;
  }

  &__state {
    width: 24px;
    height: 24px;
  }

  &__start-and-stop {
    padding: 16px;
    background-color: #282828;
    border-radius: 50px;
    border: 4px solid #CFCFCF;
    cursor: pointer;

    & .vue-voice-recorder__stop {
      background-color: #CFCFCF;
      border-radius: 4px;
      width: 100%;
      height: 100%;
      display: block;
    }

    & .vue-voice-recorder__start {
      color: #CFCFCF;
      width: 100%;
      height: 100%;
    }
  }

  &__pause-and-resume {
    padding: 16px 48px;
    background-color: #282828;
    border-radius: 50px;
    border: 4px solid #CFCFCF;
    cursor: pointer;
    color: #CFCFCF;
    display: flex;
    align-items: center;

    & > span {
      background-color: #D40100;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: block;
      margin-inline-end: 8px;
    }

    & > p {
      margin: 0;
      width: 60px;
      text-transform: capitalize;
    }
  }
}

.visualization--hidden {
  visibility: hidden;
}

.vue-voice-recorder--blink {
  animation-name: blink;
  animation-duration: 1s;
  animation-iteration-count: infinite;
}

@keyframes blink {
  0%   {opacity: 1;}
  50%  {opacity: 0.3;}
  100% {opacity: 1;}
}

</style>
