<template>
  <div class="section-container pending-section">
    <div class="section-header">
      <h3>🔔 Bolsa Común (Por Validar)</h3>
      <span class="badge-count">{{ yapes.length }}</span>
    </div>

    <div v-if="yapes.length === 0" class="empty-mini-state">
      <p>Esperando nuevos yapeos...</p>
      </div>

    <div v-else class="pending-grid">
      <div v-for="yape in yapes" :key="yape.id" class="pending-card bounce-in">
        <div class="card-top">
          <span class="time">{{ formatTime(yape.timestamp) }}</span>
          <strong class="amount">S/ {{ Number(yape.amount).toFixed(2) }}</strong>
        </div>
        <div class="card-mid">
          <span class="sender">{{ yape.senderName }}</span>
        </div>
        <button @click="$emit('pescar', yape)" class="btn-claim-full">
          ¡ES MÍO! 🙋‍♂️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
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

/**
 * Convierte un formato de fecha/timestamp a una hora local de 24 horas
 * @param {Object|Date|string} ts - Marca de tiempo (Firestore Timestamp, Date o ISO String)
 * @returns {string} Hora formateada en español
 */
const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};
</script>