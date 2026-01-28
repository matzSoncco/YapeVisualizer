import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Lara from '@primeuix/themes/lara'
import { definePreset } from '@primeuix/themes'

import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import 'primeicons/primeicons.css'

import './assets/app.css'

const MonitorYapePreset = definePreset(Lara, {
    semantic: {
        primary: {
        50: '#fdf6f0',
        100: '#f9e9dc',
        200: '#f3d1b8',
        300: '#e9b38f',
        400: '#dd8f64',
        500: '#cf9d7b', // Antique Brass
        600: '#b87d5e',
        700: '#9a6449',
        800: '#7d5139',
        900: '#67442f',
        950: '#372318'
        },
        colorScheme: {
            light: {
                surface: {
                0: '#ffffff',
                50: '#fdfaf7',
                100: '#f5efe8',
                200: '#e8ddd1',
                300: '#d4c3b3',
                400: '#b8a08b',
                500: '#8f7461',
                600: '#724b39', // Coffee
                700: '#3a3534', // Jet
                800: '#162127', // Dark Jungle Green
                900: '#0c1519', // Chinese Black
                950: '#000000'
                }
            }
        }
    }
})

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: MonitorYapePreset,
        options: {
        darkModeSelector: false
        }
    },
    ripple: true
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
