<template>
  <div class="history-container">
    <header class="history-header">
      <div class="header-info">
        <i class="pi pi-history"></i>
        <h3>Historial de Ventas</h3>
      </div>
      <div class="summary-badge">
        <span class="label">Ventas de Hoy</span>
        <span class="value">S/ {{ total.toFixed(2) }}</span>
      </div>
    </header>

    <div v-if="ventas.length === 0" class="empty-history">
      <div class="empty-visual">
        <i class="pi pi-database"></i>
        <p>Aún no hay movimientos registrados</p>
      </div>
    </div>

    <div v-else class="table-wrapper">
      <DataTable 
        :value="ventas" 
        :paginator="ventas.length > 12"
        :rows="12"
        responsiveLayout="scroll"
        class="p-datatable-sm custom-table"
      >
        <Column field="timestamp" header="Hora" class="col-time">
          <template #body="slotProps">
            <code class="time-text">{{ formatearHora(slotProps.data.timestamp) }}</code>
          </template>
        </Column>
        
        <Column header="Concepto / Cliente" class="col-client">
          <template #body="slotProps">
            <div v-if="slotProps.data.type === 'EXPENSE'" class="expense-label">
              <i class="pi pi-arrow-down-right"></i>
              <span>GASTO OPERATIVO</span>
            </div>
            <div v-else class="client-info">
              <span class="client-name">{{ slotProps.data.clientName || 'Cliente Eventual' }}</span>
            </div>
          </template>
        </Column>
        
        <Column header="Método" class="col-method">
          <template #body="slotProps">
            <div class="method-badges">
               <Tag v-if="slotProps.data.type === 'EXPENSE'" value="Egreso" severity="danger" rounded />
               <template v-else-if="obtenerBilletera(slotProps.data)">
                <Tag 
                  :value="obtenerBilletera(slotProps.data).label" 
                  :class="obtenerBilletera(slotProps.data).class" 
                  rounded 
                />
              </template>
               <Tag v-else value="Efectivo" class="tag-cash" rounded />
            </div>
          </template>
        </Column>

        <Column field="totalAmount" header="Monto" class="col-amount">
          <template #body="slotProps">
            <span class="amount-text" :class="{'is-expense': slotProps.data.type === 'EXPENSE'}">
              {{ slotProps.data.type === 'EXPENSE' ? '-' : '' }} S/ {{ Number(slotProps.data.totalAmount || slotProps.data.amount).toFixed(2) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { computed } from 'vue';
import { formatearHora } from '@/utils/dates';
import { store } from '@/store';

const props = defineProps({
  ventas: { type: Array, required: true }
});

/**
 * Cálculo del Total
 * TODO: Mover a un composable o utilitario si fuera necesario
 */
const total = computed(() => {
  const stats = store.currentShift?.stats;

  if (!stats) return 0;
  
  const cash = Number(stats.totalCashSales || 0);
  const digital = Number(stats.totalDigitalSales || 0);
  const expenses = Number(stats.totalExpenses || 0);

  return (cash + digital) - expenses;
});

/**
 * Extrae la metadata de la billetera del objeto de venta
 * @param {Object} data - Documento de la venta
 */
const obtenerBilletera = (data) => {
  if (!data.payments || data.payments.length === 0) return null;
  
  const pagoDigital = data.payments.find(p => p.method !== 'CASH');
  
  if (pagoDigital) {
      const walletRaw = pagoDigital.wallet || data.wallet || pagoDigital.method;
      const walletName = walletRaw.toUpperCase();

      return {
        label: walletName.charAt(0) + walletName.slice(1).toLowerCase(),
        class: walletName === 'PLIN' ? 'tag-plin' : 'tag-yape'
      };
  }
  
  return null;
};
</script>

<style scoped>
.history-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
}

/* HEADER: Estilo minimalista */
.history-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-primary);
}

.header-info i { font-size: 1.2rem; }
.header-info h3 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.01em;
}

.summary-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.summary-badge .label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.summary-badge .value {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-primary);
}

/* TABLA: Personalización profunda de PrimeVue */
.table-wrapper {
  flex: 1;
  overflow-y: auto;
}

:deep(.custom-table .p-datatable-thead > tr > th) {
  background: var(--bg-app) !important;
  color: var(--color-text-muted) !important;
  font-size: 0.7rem !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  padding: 0.75rem 1rem !important;
  border: none !important;
}

:deep(.custom-table .p-datatable-tbody > tr) {
  background: transparent !important;
  transition: background 0.2s;
}

:deep(.custom-table .p-datatable-tbody > tr:hover) {
  background: var(--bg-app) !important;
}

:deep(.custom-table .p-datatable-tbody > tr > td) {
  padding: 0.85rem 1rem !important;
  border-bottom: 1px solid var(--bg-surface) !important;
}

/* CELDAS ESPECÍFICAS */
.time-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.client-name {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 0.9rem;
}

.expense-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-weight: 800;
  font-size: 0.75rem;
}

.amount-text {
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--color-primary);
}

.amount-text.is-expense {
  color: #ef4444;
}

/* BADGES PERSONALIZADOS */
:deep(.p-tag) {
  font-size: 0.65rem !important;
  font-weight: 800 !important;
  padding: 0.2rem 0.6rem !important;
}

.tag-yape { 
  background: #f5f3ff !important; 
  color: #7c3aed !important; 
  border: 1px solid #ddd6fe !important; 
}

/* Color Cyan para Plin */
.tag-plin { 
  background: #ecfeff !important; 
  color: #0891b2 !important; 
  border: 1px solid #cffafe !important; 
}
.tag-cash {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border: 1px solid #bbf7d0 !important;
}

/* ESTADO VACÍO */
.empty-history {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-visual {
  text-align: center;
  opacity: 0.3;
  color: var(--color-text-muted);
}

.empty-visual i { font-size: 3.5rem; margin-bottom: 1rem; }
.empty-visual p { font-weight: 700; font-size: 0.9rem; }

.col-amount { text-align: right; }
</style>