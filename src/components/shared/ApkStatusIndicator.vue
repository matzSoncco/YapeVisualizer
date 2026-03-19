<template>
  <div class="apk-status" :class="statusClass" :title="statusText">
    <div class="status-indicator"></div>
    <span class="status-label" v-if="showLabel">{{ statusText }}</span>
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

// 2.5 minutos de tolerancia máxima (150,000 ms)
const MAX_HEARTBEAT_AGE = 150000;

const isOnline = computed(() => {
  const { deviceOnline, lastHeartbeat } = store.userProfile;
  
  if (!deviceOnline) return false;
  if (!lastHeartbeat) return false;
  
  // lastHeartbeat es Date porque App.vue lo convierte usando .toDate()
  const age = now.value - lastHeartbeat.getTime();
  return age <= MAX_HEARTBEAT_AGE;
});

const statusClass = computed(() => isOnline.value ? 'status-online' : 'status-offline');
const statusText = computed(() => isOnline.value ? 'APK Conectada' : 'APK Desconectada');
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

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-online {
  background: #ecfdf5;
  color: #059669;
}
.status-online .status-indicator {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s infinite;
}

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
</style>
