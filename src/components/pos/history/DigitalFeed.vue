<template>
  <div class="feed-strip">
    <div class="feed-label">
      <div class="pulse-dot"></div>
      <span>EN VIVO</span>
    </div>

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
  </div>
</template>

<script setup>
import { formatearHora } from '@/utils/dates';
/**
 * Propiedades recibidas por el componente
 * @prop {Array} pagosDigitales - Lista de pagos digitales pendientes de validar (pendientes)
 */
defineProps({
  pagosDigitales: { type: Array, required: true }
});

/**
 * Retorna la variable CSS correspondiente al color de la billetera.
 * @param {string} wallet - El nombre de la billetera (YAPE, PLIN, etc.)
 */
const getWalletColor = (wallet) => {
  if (!wallet) return 'var(--color-text-muted)';
  
  const walletMap = {
    'YAPE': 'var(--color-yape)',
    'PLIN': 'var(--color-plin)',
    // Puedes seguir agregando aquí: 'TUNKI': 'var(--color-tunki)'
  };

  return walletMap[wallet.toUpperCase()] || 'var(--color-text-muted)';
};

/**
 * Eventos personalizados emitidos por el componente
 * @event pescar - Evento emitido al reclamar una transaccion
 * @property {Object} pagoDigital - Objeto de la transacción digital reclamada
 */
defineEmits(['pescar']);
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

/* Indicador de estado con separador visual */
.feed-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--color-text-muted);
  border-right: 1px solid var(--color-border);
  padding-right: 1rem;
  height: 60%;
  user-select: none;
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