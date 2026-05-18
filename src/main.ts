import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Инициализация auth store (проверка токена)
import { useAuthStore } from './stores/authStore';
const authStore = useAuthStore();
authStore.checkAuth();

app.mount('#app');