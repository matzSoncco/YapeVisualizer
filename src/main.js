import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Lara from '@primeuix/themes/lara'
import { definePreset } from '@primeuix/themes'

import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import Card from 'primevue/card'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Select from 'primevue/select'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'

import 'primeicons/primeicons.css'

import './assets/app.css'

/**
 * Preset para Monitor Yape usando colores inspirados Lara Dark
 */
const MonitorYapePreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#e8eaeb',
      100: '#d1d5d7',
      200: '#a3abad',
      300: '#758184',
      400: '#47575a',
      500: '#162127', // Dark Jungle Green como primario
      600: '#121a1f',
      700: '#0e1417',
      800: '#0a0d10',
      900: '#060708',
      950: '#000000'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fafbfc',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
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
            darkModeSelector: 'dark-mode',
            cssLayer: false
        }
    },
    ripple: true
})
app.use(ToastService)
app.use(ConfirmationService)
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Badge', Badge);
app.component('Tag', Tag);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Toast', Toast);
app.component('Card', Card)
app.component('Button', Button)
app.component('Calendar', Calendar)
app.component('Select', Select)
app.component('Avatar', Avatar)
app.component('Menu', Menu)
app.component('InputText', InputText)
app.component('Dialog', Dialog)

app.mount('#app')
