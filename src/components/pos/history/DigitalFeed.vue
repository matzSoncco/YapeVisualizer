<template>
  <div class="feed-strip">
    
    <!-- CONTROLES DE MODO (VIVO / HISTORIAL) -->
    <div class="feed-controls">
      <!-- Etiqueta En Vivo (Clickeable para ir al historial) -->
      <div 
        v-if="modo === 'vivo'" 
        class="feed-label clickable" 
        @click="activarHistorial" 
        title="Ver historial de fechas anteriores"
      >
        <div class="pulse-dot"></div>
        <span>EN VIVO</span>
        <i class="pi pi-history toggle-icon"></i>
      </div>

      <!-- Etiqueta Historial (Con selector de fecha) -->
      <div v-else class="feed-label historial-mode">
        <i class="pi pi-calendar"></i>
        <input 
          type="date" 
          v-model="fechaHistorial" 
          class="date-input"
          @change="cargarHistorial"
        />
        <i 
          class="pi pi-times-circle close-icon" 
          @click="modo = 'vivo'" 
          title="Volver a En Vivo"
        ></i>
      </div>
    </div>

    <!-- LISTA DE PAGOS EN VIVO -->
    <template v-if="modo === 'vivo'">
      <div v-if="pagosDigitales.length === 0" class="feed-empty">
        <i class="pi pi-check-circle"></i>
        <span>Todo al día. Esperando pagos...</span>
      </div>

      <div v-else class="feed-items-wrapper">
        <div 
          v-for="pagoDigital in pagosDigitales" 
          :key="pagoDigital.id" 
          class="feed-chip"
          @click="$emit('pescar', pagoDigital)"
        >
          <div class="chip-icon" :style="{ color: getWalletColor(pagoDigital.wallet) }">
            <i class="pi pi-qrcode"></i>
          </div>
          <div class="chip-info">
            <span class="chip-sender">{{ pagoDigital.senderName }}</span>
            <span class="chip-time">{{ formatearHora(pagoDigital.timestamp) }}</span>
          </div>
          <div class="chip-amount">
            S/ {{ Number(pagoDigital.amount).toFixed(2) }}
          </div>
        </div>
      </div>
    </template>

    <!-- LISTA DE PAGOS HISTORIAL (Respaldo) -->
    <template v-else>
      <div v-if="cargandoHistorial" class="feed-empty">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Buscando respaldo...</span>
      </div>
      
      <div v-else-if="pagosHistorial.length === 0" class="feed-empty">
        <i class="pi pi-info-circle"></i>
        <span>No hay registros para la fecha seleccionada.</span>
      </div>

      <div v-else class="feed-items-wrapper">
        <div 
          v-for="pagoHistorial in pagosHistorial" 
          :key="pagoHistorial.id" 
          class="feed-chip"
          :class="{ 
            'chip-processed': pagoHistorial.status === 'PROCESSED',
            'history-chip': pagoHistorial.status === 'PROCESSED' 
          }"
          @click="pagoHistorial.status !== 'PROCESSED' ? $emit('pescar', pagoHistorial) : null"
        >
          <div class="chip-icon" :style="{ color: getWalletColor(pagoHistorial.wallet) }">
            <!-- Si está procesado muestra el Check, si no, el código QR normal -->
            <i :class="pagoHistorial.status === 'PROCESSED' ? 'pi pi-check-circle' : 'pi pi-qrcode'"></i>
          </div>
          <div class="chip-info">
            <span class="chip-sender">{{ pagoHistorial.senderName }}</span>
            <span class="chip-time">{{ formatearHora(pagoHistorial.timestamp) }}</span>
          </div>
          <div class="chip-amount">
            S/ {{ Number(pagoHistorial.amount).toFixed(2) }}
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { formatearHora } from '@/utils/dates';
import { useDigitalPayments } from '@/composables/operations/useDigitalPayments';

/**
 * Propiedades recibidas por el componente
 * @prop {Array} pagosDigitales - Lista de pagos digitales pendientes del turno actual
 */
defineProps({
  pagosDigitales: { type: Array, required: true }
});

/**
 * Eventos personalizados emitidos por el componente
 * @event pescar - Evento emitido al reclamar una transaccion
 */
defineEmits(['pescar']);

// --- LÓGICA DE HISTORIAL ---
const { fetchHistorial } = useDigitalPayments();

const modo = ref('vivo'); // 'vivo' | 'historial'
const fechaHistorial = ref('');
const pagosHistorial = ref([]);
const cargandoHistorial = ref(false);

const activarHistorial = async () => {
  modo.value = 'historial';
  // Si no hay fecha, seteamos la de hoy por defecto
  if (!fechaHistorial.value) {
    fechaHistorial.value = new Date().toISOString().split('T')[0];
  }
  await cargarHistorial();
};

const cargarHistorial = async () => {
  if (!fechaHistorial.value) return;
  cargandoHistorial.value = true;
  try {
    pagosHistorial.value = await fetchHistorial(fechaHistorial.value);
  } catch (error) {
    console.error("Error al cargar historial", error);
  } finally {
    cargandoHistorial.value = false;
  }
};

/**
 * Retorna la variable CSS correspondiente al color de la billetera.
 * @param {string} wallet - El nombre de la billetera (YAPE, PLIN, etc.)
 */
const getWalletColor = (wallet) => {
  if (!wallet) return 'var(--color-text-muted)';
  
  const walletMap = {
    'YAPE': 'var(--color-yape)',
    'PLIN': 'var(--color-plin)',
  };

  return walletMap[wallet.toUpperCase()] || 'var(--color-text-muted)';
};
</script>

<style scoped>
/* Contenedor principal alineado al flujo del layout */
.feed-strip {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 0 0 1rem;
  background: var(--bg-app);
}

/* Área de controles (Izquierda) */
.feed-controls {
  height: 60%;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--color-border);
  padding-right: 1rem;
}

/* Indicador de estado con separador visual */
.feed-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--color-text-muted);
  user-select: none;
}

.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.clickable:hover {
  color: var(--color-primary);
}

.toggle-icon {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Modo Historial Específico */
.historial-mode {
  color: var(--color-primary);
}

.date-input {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.7rem;
  color: var(--color-text-main);
  outline: none;
  cursor: pointer;
}

.close-icon {
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-danger, #ef4444);
  margin-left: 0.25rem;
}

/* Animación de pulso utilizando la variable de éxito */
.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: var(--color-success);
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* Estado vacío - Coherencia con color muted */
.feed-empty {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 1rem;
  opacity: 0.7;
}

/* Área de scroll horizontal */
.feed-items-wrapper {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  overflow-y: visible;
  padding: 8px 1rem 8px 0.75rem; 
  flex: 1;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Scrollbar minimalista */
.feed-items-wrapper::-webkit-scrollbar { height: 4px; }
.feed-items-wrapper::-webkit-scrollbar-track { background: transparent; }
.feed-items-wrapper::-webkit-scrollbar-thumb { 
  background: var(--color-border); 
  border-radius: var(--radius-md); 
}

/* Elemento de pago (Chip) */
.feed-chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  padding: 0.4rem 0.5rem 0.4rem 0.75rem;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: max-content;
  box-shadow: var(--shadow-flat);
}

.feed-chip:hover {
  border-color: var(--color-primary-mid);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Estilos para chips del historial */
.history-chip {
  cursor: default; /* No se "pescan" los del historial si ya están procesados */
}

.history-chip:hover {
  transform: none;
  box-shadow: var(--shadow-flat);
  border-color: var(--color-border);
}

/* Opacidad para diferenciar los que ya fueron cobrados */
.chip-processed {
  opacity: 0.6;
  background: var(--bg-surface);
}

/* Icono con identidad visual Yape */
.chip-icon {
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.chip-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.chip-sender { 
  font-weight: 700; 
  font-size: 0.8rem; 
  color: var(--color-text-main); 
}

.chip-time { 
  font-size: 0.65rem; 
  color: var(--color-text-muted); 
}

/* Resalte de monto con superficie secundaria */
.chip-amount {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--color-primary);
  background: var(--bg-surface-alt);
  padding: 2px 8px;
  border-radius: var(--radius-md);
}
</style>