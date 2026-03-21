<template>
  <div 
    class="apk-status" 
    :class="statusClass" 
    v-tooltip.bottom="tooltipText"
  >
    <div class="status-indicator"></div>
    <span class="status-label" v-if="showLabel">
      <span class="status-title">{{ stateText }}</span>
      <span class="status-time"> • Últ. vez {{ formattedLastSeen }}</span>
    </span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '@/store';

const props = defineProps({
  showLabel: {
    type: Boolean,
    default: false
  }
});

// Refrescamos la vista cada 10 segundos para calcular la edad del latido
const now = ref(Date.now());
let interval = null;

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now();
  }, 10000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

// Zonas de tolerancia (en milisegundos) basadas en tiempo de latido
// App envía latido cada 5 minutos (300,000 ms)
const MINUTES_TO_MS = 60000;
const LIMIT_OK = 6 * MINUTES_TO_MS;       // 0 a 6 min (verde)
const LIMIT_WARNING = 10 * MINUTES_TO_MS; // 7 a 10 min (amarillo)

const connectionState = computed(() => {
  const { deviceOnline, lastHeartbeat } = store.userProfile;
  
  if (!deviceOnline) return 'offline'; // apagador directo
  if (!lastHeartbeat) return 'offline'; // estado inicial o vacio
  
  // lastHeartbeat es Date porque App.vue lo convierte usando .toDate()
  const age = now.value - lastHeartbeat.getTime();
  
  if (age <= LIMIT_OK) return 'online';
  if (age <= LIMIT_WARNING) return 'warning';
  return 'offline'; // Más de 10 min
});

const formattedLastSeen = computed(() => {
  const { lastHeartbeat } = store.userProfile;
  if (!lastHeartbeat) return 'Desconocida';
  
  const isToday = new Date().toDateString() === lastHeartbeat.toDateString();
  const timeString = lastHeartbeat.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `hoy a las ${timeString}`;
  }
  
  return `${lastHeartbeat.toLocaleDateString('es-PE')} a las ${timeString}`;
});

const statusClass = computed(() => `status-${connectionState.value}`);

const stateText = computed(() => {
  switch (connectionState.value) {
    case 'online': return 'APK Conectada';
    case 'warning': return 'Revisar celular';
    case 'offline': return 'APK Desconectada';
    default: return 'APK Desconectada';
  }
});

const tooltipText = computed(() => {
  switch (connectionState.value) {
    case 'online': 
      return '🟢 Todo está perfecto. La app se sincroniza correctamente.';
    case 'warning':
      return '🟡 Alerta: Se saltó un latido. Posible retardo por wifi o ahorro de energía en el celular.';
    case 'offline':
    default:
      return '🔴 Confirma que tu app de Android esté encendida con el permiso de notificaciones.';
  }
});
</script>

<style scoped>
.apk-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: help;
}

.status-title {
  font-weight: 700;
}

.status-time {
  font-weight: 500;
  opacity: 0.85;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

/* ONLINE (VERDE) */
.status-online {
  background: #ecfdf5;
  color: #059669;
}
.status-online .status-indicator {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s infinite;
}

/* WARNING (AMARILLO) */
.status-warning {
  background: #fefce8;
  color: #ca8a04;
}
.status-warning .status-indicator {
  background: #eab308;
  box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.2);
  animation: pulse-yellow 2s infinite;
}

/* OFFLINE (ROJO) */
.status-offline {
  background: #fef2f2;
  color: #dc2626;
}
.status-offline .status-indicator {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@keyframes pulse-yellow {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(234, 179, 8, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
}
</style>
