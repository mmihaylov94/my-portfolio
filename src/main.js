import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura';
import router from './router'
import './assets/main.css'
import Button from 'primevue/button'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

const app = createApp(App)
app.use(PrimeVue, { theme: { preset: Aura } })
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)
app.component('Button', Button)
app.mount('#app')