<template>
  <div class="section-container history-section">
    <div class="section-header">
      <h3>💰 Mis Ventas Confirmadas</h3>
      <div class="total-badge">
        Total Hoy: <strong>S/ {{ total.toFixed(2) }}</strong>
      </div>
    </div>

    <div v-if="ventas.length === 0" class="empty-mini-state">
      <p>Aún no has validado ventas hoy.</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="modern-table">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="venta in ventas" :key="venta.id">
            <td>{{ formatTime(venta.timestamp) }}</td>
            <td>
              <span class="client-name">{{ venta.senderName }}</span>
            </td>
            <td class="amount-cell">
              S/ {{ Number(venta.amount).toFixed(2) }}
            </td>
            <td>
              <span class="status-badge">✅ En Caja</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

/**
 * Propiedades del componente
 * @prop {Array} ventas - Lista de ventas confirmadas
 */
const props = defineProps({
  ventas: { type: Array, required: true }
});

/**
 * Suma total de los montos de las ventas actuales
 * @type {import('vue').ComputedRef<number>}
 */
const total = computed(() => {
  return props.ventas.reduce((sum, item) => sum + Number(item.amount), 0);
});

/**
 * Formatea un timestap de Firebase o un Date estándar a una cadena de hora legible
 * @param {Object|data|string} ts - Timestamp de Firebase o Date
 * @returns {string} Hora formateada (HH:MM)
 */
const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
/* Solo estilos estructurales, el resto usa dashboard.css */
.history-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 1rem;
}

.total-badge {
  background: #d1fae5;
  color: #065f46;
  padding: 8px 16px;
  border-radius: 12px;
}
</style>