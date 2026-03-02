<template>
  <div class="feed-strip">
    
    <div class="feed-label">
      <div class="pulse-dot"></div>
      <span>EN VIVO</span>
    </div>

    <div v-if="yapes.length === 0" class="feed-empty">
      <i class="pi pi-check-circle"></i>
      <span>Todo al día. Esperando pagos...</span>
    </div>

    <div v-else class="feed-items-wrapper">
      <div 
        v-for="yape in yapes" 
        :key="yape.id" 
        class="feed-chip"
        @click="$emit('pescar', yape)"
      >
        <div class="chip-icon">
          <i class="pi pi-qrcode"></i>
        </div>
        <div class="chip-info">
          <span class="chip-sender">{{ yape.senderName }}</span>
          <span class="chip-time">{{ formatearHora(yape.timestamp) }}</span>
        </div>
        <div class="chip-amount">
          S/ {{ Number(yape.amount).toFixed(2) }}
        </div>
        <div class="chip-action">
           <i class="pi pi-plus"></i>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { formatearHora } from '@/utils/dates';
/**
 * Propiedades recibidas por el componente
 * @prop {Array} yapes - Lista de yapes pendientes de validar (pendientes)
 */
defineProps({
  yapes: { type: Array, required: true }
});

/**
 * Eventos personalizados emitidos por el componente
 * @event pescar - Evento emitido al reclamar una transaccion
 * @property {Object} yape - Objeto de la transacción reclamada
 */
defineEmits(['pescar']);
</script>

<style scoped>
.feed-strip {
  height: 100%;
  display: flex;
  align-items: center;
  /* Quitamos padding horizontal del contenedor principal */
  padding: 0 0 0 1rem; 
}

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
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: var(--color-success); /* Verde = Sistema OK */
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.feed-empty {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.7;
}

/* WRAPPER HORIZONTAL */
.feed-items-wrapper {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto; /* Scroll horizontal nativo */
  overflow-y: visible; /* IMPORTANTE: Permite que el hover y shadow se salgan */
  
  /* Padding generoso para que el hover no se corte */
  padding: 10px 1rem 10px 0.5rem; 
  
  flex: 1;
  /* Scroll suave */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Estilo del Scrollbar (Fino y discreto) */
.feed-items-wrapper::-webkit-scrollbar { height: 6px; }
.feed-items-wrapper::-webkit-scrollbar-track { background: transparent; }
.feed-items-wrapper::-webkit-scrollbar-thumb { 
    background: rgba(0,0,0,0.1); 
    border-radius: 10px; 
}
.feed-items-wrapper::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }

/* TARJETA TIPO CHIP */
.feed-chip {
  flex-shrink: 0; /* Evita que se aplasten */
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid var(--color-border);
  padding: 0.4rem 0.5rem 0.4rem 0.75rem;
  border-radius: 100px; /* Forma de píldora completa */
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: max-content;
  box-shadow: var(--shadow-flat);
}

.feed-chip:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-pro);
}

.chip-icon {
  color: #7c3aed; /* Morado Yape sutil */
}

.chip-info {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.chip-sender { font-weight: 700; font-size: 0.8rem; color: var(--color-primary); }
.chip-time { font-size: 0.65rem; color: var(--color-text-muted); }

.chip-amount {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--color-primary);
  background: var(--bg-surface);
  padding: 2px 8px;
  border-radius: 4px;
}

.chip-action {
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  color: var(--color-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  opacity: 0; /* Oculto por defecto */
  transform: scale(0.8);
  transition: all 0.2s;
}

.feed-chip:hover .chip-action {
  opacity: 1;
  transform: scale(1);
}
</style>