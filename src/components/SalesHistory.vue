<template>
  <div class="history-section">
    <div class="section-header">
      <div class="section-title">
        <i class="pi pi-wallet" style="color: var(--antique-brass);"></i>
        <h3>Mis Ventas Confirmadas</h3>
      </div>
      <div class="total-badge">
        Total Hoy: <strong>S/ {{ total.toFixed(2) }}</strong>
      </div>
    </div>

    <div v-if="ventas.length === 0" class="empty-state">
      <i class="pi pi-shopping-cart" style="font-size: 3rem; color: var(--coffee); opacity: 0.3;"></i>
      <p>Aún no has validado ventas hoy.</p>
    </div>

    <Card v-else class="history-card">
      <template #content>
        <DataTable 
          :value="ventas" 
          :paginator="ventas.length > 10"
          :rows="10"
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="timestamp" header="Hora">
            <template #body="slotProps">
              <i class="pi pi-clock" style="margin-right: 0.5rem; color: var(--jet);"></i>
              {{ formatTime(slotProps.data.timestamp) }}
            </template>
          </Column>
          
          <Column field="senderName" header="Cliente">
            <template #body="slotProps">
              <span class="client-name">{{ slotProps.data.senderName }}</span>
            </template>
          </Column>
          
          <Column field="amount" header="Monto">
            <template #body="slotProps">
              <span class="amount-cell">
                S/ {{ Number(slotProps.data.amount).toFixed(2) }}
              </span>
            </template>
          </Column>
          
          <Column header="Estado">
            <template #body>
              <Tag value="En Caja" severity="success" icon="pi pi-check" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';

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