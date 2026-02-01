<template>
  <div class="pending-section">
    <div class="section-header">
      <div class="section-title">
        <i class="pi pi-bell" style="color: var(--antique-brass);"></i>
        <h3>Pagos por Validar</h3>
      </div>
      <Badge :value="yapes.length" severity="warning" size="large" />
    </div>

    <div v-if="yapes.length === 0" class="empty-state">
      <i class="pi pi-inbox" style="font-size: 3rem; color: var(--coffee); opacity: 0.3;"></i>
      <p>Esperando nuevos yapeos...</p>
    </div>

    <div v-else class="pending-grid">
      <Card 
        v-for="yape in yapes" 
        :key="yape.id" 
        class="pending-card"
      >
        <template #content>
          <div class="pending-card-top">
            <span class="pending-time">
              <i class="pi pi-clock"></i>
              {{ formatTime(yape.timestamp) }}
            </span>
            <span class="pending-amount">S/ {{ Number(yape.amount).toFixed(2) }}</span>
          </div>
          <div class="pending-sender">
            <i class="pi pi-user"></i>
            {{ yape.senderName }}
          </div>
          <Button
            label="¡ES MÍO!"
            icon="pi pi-check"
            @click="$emit('pescar', yape)"
            class="w-full"
            style="margin-top: 0.75rem;"
          />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import Badge from 'primevue/badge';
import Card from 'primevue/card';
import Button from 'primevue/button';

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