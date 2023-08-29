import { App } from 'vue'
import * as components from './components'

function install (app: App) {
  for (const key in components) {
    app.component(key, components[key])
  }
}

import './assets/main.scss'

export default { install }

export * from './components';
export * from './utils';
export * from './composables';
