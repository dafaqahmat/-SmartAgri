import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Vue3Toastify, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const app = createApp(App)
app.use(router)
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: toast.POSITION.TOP_RIGHT,
})
app.mount('#app')
