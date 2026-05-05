import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import JsonEditorVue from 'json-editor-vue'
import 'jsoneditor/dist/jsoneditor.min.css' // стили

// после создания app:

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
app.use(JsonEditorVue)
