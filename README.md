<div align="center">
  <img src="https://github.com/TheCoderDream/ngx-mic-recorder/blob/main/projects/ngx-mic-recorder/misc/documentation-assets/ngx-voice-recording.gif?raw=true" alt="Angular Microphone Recorder">
  <br>
  <h1>vue-voice-recording</h1>
  <br>
  <a href="https://www.npmjs.org/package/ngx-toastr">
    <img src="https://badge.fury.io/js/vue-voice-recording.svg" alt="npm">
  </a>
  <br>
  <br>
</div>


## Features

- Audio recording visualization.
- Start, stop, pause and resume audio recording.
- Fully customizable and configurable.
- Fully documented.

## Dependencies

| vue-voice-recording | Vue    | lamejstmp |
|---------------------|--------|-----------|
| 1.0.0               | => 3.x | ^1.0.1    |


## Install

```bash
npm install vue-voice-recorder --save
```

## Setup

**Option 1:** Import the component and register globally

```ts
import { VueVoiceRecording } from 'vue-voice-recording';
import 'vue-voice-recording/dist/style.css'; // import it if you want to use the default template.
```

**Option 2:** Import the hook and use with your own template and styling

```ts
import { useRecorder } from 'vue-voice-recording';

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
    afterStartRecording: () => console.log('After microphone starts recording'),
    afterStopRecording: (blob) => console.log('After microphone stops recording'),
    afterPauseRecording: () => console.log('After microphone pauses recording'),
    afterResumeRecording: () => console.log('After microphone resumes recording'),
    getAsMp3: ({data, url}) => console.log('After microphone stops recording and audio encoded to mp3'),
});
```

## Use

**Basic usage:**

```html
<VueVoiceRecording
  @getAsMp3="saveAsMp3"
></VueVoiceRecording>
```

**With all options:**
```html
<VueVoiceRecording
  @afterStartRecording="afterStart"
  @afterStopRecording="afterStop"
  @afterPauseRecording="afterPause"
  @afterResumeRecording="afterResume"
  @getAsMp3="saveAsMp3"
  :showVisualization="true"
  visualizationType="SineWave"
  :visualizationOptions="{
        width: 300,
        height: 150,
        strokeColor: '#212121',
        backgroundColor: 'white',
    }"
></VueVoiceRecording>
```

## Props

| Option               | Type                                                  | Default                             | Description                           |
|----------------------|-------------------------------------------------------|-------------------------------------|---------------------------------------|
| showVisualization    | number                                                | true                                | Whether to show the visualization     |
| visualizationType    | ``SineWave``, ``FrequencyBars``, ``FrequencyCircles`` | SineWave                            | Audio Recording visualization type    |
| visualizationOptions | object                                                | [see below](#visualization-options) | Audio Recording visualization options |

##### Visualization options

```typescript
const defaultVisualizationOptions = {
  width: 300,
  height: 150,
  strokeColor: '#212121',
  backgroundColor: 'white',
}
```

## Events

| Event                | Value                        | Description                                          |
|----------------------|------------------------------|------------------------------------------------------|
| afterStartRecording  | void                         | After microphone start recording                     |
| afterStopRecording   | Blob                         | After microphone stop recording  with recorded audio |
| afterPauseRecording  | void                         | When microphone pauses recording                     |
| afterResumeRecording | void                         | When microphone resumes recording                    |
| getAsMp3             | `{ data: Blob, url: string}` | Get recorded audio as encoded to MP3                 |


## Slots

```html

<VueVoiceRecording
        v-slot="{
           isRecording,
           isPaused,
           recordingTime,
           recordingState,
           toggleStartAndStop,
           togglePauseAndResume,
           startRecording,
           resumeRecording
        }"
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
                        <path fill="currentColor"
                              d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14Zm-1 7v-3.075q-2.6-.35-4.3-2.325Q5 13.625 5 11h2q0 2.075 1.463 3.537Q9.925 16 12 16t3.538-1.463Q17 13.075 17 11h2q0 2.625-1.7 4.6q-1.7 1.975-4.3 2.325V21Z"></path>
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
</VueVoiceRecording>
```
