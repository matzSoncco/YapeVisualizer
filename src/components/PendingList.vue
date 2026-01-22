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

<style scoped>
/* Estilos específicos para las tarjetas de "Bolsa Común" */
/* El resto viene del dashboard.css global */
.pending-section {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 2px solid #fbbf24; /* Borde amarillo para resaltar atención */
  box-shadow: 0 4px 20px rgba(251, 191, 36, 0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.badge-count {
  background: #fbbf24;
  color: #78350f;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: bold;
}

.pending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.pending-card {
  background: #fffbeb; /* Fondo amarillito suave */
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 1rem;
  transition: transform 0.2s;
  animation: popIn 0.3s ease-out;
}

.pending-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #92400e;
}

.amount {
  font-size: 1.2rem;
  color: #059669;
}

.sender {
  font-weight: 600;
  display: block;
  margin-bottom: 1rem;
  color: #333;
}

.btn-claim-full {
  width: 100%;
  background: #10b981;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.btn-claim-full:hover { background: #059669; }

@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>