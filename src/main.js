import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadSession } from './session'
import Icon from './components/Icon.vue'
import { ensureSample } from './mock/sample'
import './styles/main.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

ensureSample()
loadSession().then(() => createApp(App).component('Icon', Icon).use(router).mount('#app'))
