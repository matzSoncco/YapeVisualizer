import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

const app = createApp(App)

app.use(router)
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
