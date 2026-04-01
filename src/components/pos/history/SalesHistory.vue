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
        <i class="pi pi-objects-column"></i>
        <p>Aún no hay movimientos registrados</p>
      </div>
    </div>

    <div v-else class="table-wrapper">
      <DataTable
        :value="ventas"
        scrollable
        scrollHeight="flex"
        class="custom-table"
        dataKey="id"
      >
        <Column field="timestamp" header="Hora" class="col-time">
          <template #body="slotProps">
            <code class="time-text">{{ formatearHora(slotProps.data.timestamp) }}</code>
          </template>
        </Column>
        <Column header="Concepto / Cliente" class="col-client">
          <template #body="slotProps">
            <div v-if="slotProps.data.type === 'EXPENSE'" class="expense-row-info">
              <span>GASTO OPERATIVO</span>
            </div>
            <div v-else class="client-info">
              <span class="client-name">{{ slotProps.data.clientName || 'Cliente Eventual' }}</span>
              <span v-if="slotProps.data.ticketNumber" class="ticket-ref">
                {{ slotProps.data.ticketNumber }}
              </span>
            </div>
          </template>
        </Column>
        <Column header="Método" class="col-method">
          <template #body="slotProps">
            <div class="method-badges">
              <Tag
                v-if="slotProps.data.type === 'EXPENSE'"
                value="Egreso"
                severity="danger"
                rounded
              />
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

        <Column header="Monto" class="col-amount">
          <template #body="slotProps">
            <span class="amount-text" :class="{ 'is-expense': slotProps.data.type === 'EXPENSE' }">
              {{ slotProps.data.type === 'EXPENSE' ? '-' : '' }} S/
              {{ Number(slotProps.data.totalAmount || slotProps.data.amount).toFixed(2) }}
            </span>
          </template>
        </Column>
        <Column header="Acciones" class="col-actions">
          <template #body="slotProps">
            <div class="actions-group">
              <Button
                icon="pi pi-info-circle"
                text
                rounded
                @click="detalleRef?.open(slotProps.data)"
                v-tooltip.top="'Ver Detalle'"
                class="btn-action-info"
              />
              <Button
                v-if="slotProps.data.type !== 'EXPENSE'"
                icon="pi pi-print"
                text
                rounded
                severity="success"
                @click="imprimirTicket(slotProps.data)"
                v-tooltip.top="'Imprimir Ticket'"
                class="btn-action-print"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    <SaleDetailModal ref="detalleRef" />
  </div>
</template>

<script setup>
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { ref, computed } from 'vue'
import { formatearHora } from '@/utils/dates'
import { store } from '@/store'
import { usePrintTicket } from '@/composables/operations/usePrintTicket'

import SaleDetailModal from './SaleDetailModal.vue'

const props = defineProps({
  ventas: { type: Array, required: true },
})

const detalleRef = ref(null)
const { imprimirTicket: printTicket } = usePrintTicket()

/**
 * Cálculo del Total
 * TODO: Mover a un composable o utilitario si fuera necesario
 */
const total = computed(() => {
  const stats = store.currentShift?.stats

  if (!stats) return 0

  const cash = Number(stats.totalCashSales || 0)
  const digital = Number(stats.totalDigitalSales || 0)
  const expenses = Number(stats.totalExpenses || 0)

  return cash + digital - expenses
})

/**
 * Extrae la metadata de la billetera del objeto de venta
 * @param {Object} data - Documento de la venta
 */
const obtenerBilletera = (data) => {
  if (!data.payments || data.payments.length === 0) return null

  const pagoDigital = data.payments.find((p) => p.method !== 'CASH')

  if (pagoDigital) {
    const walletRaw = pagoDigital.wallet || data.wallet || pagoDigital.method
    const walletName = walletRaw.toUpperCase()

    return {
      label: walletName.charAt(0) + walletName.slice(1).toLowerCase(),
      class: walletName === 'PLIN' ? 'tag-plin' : 'tag-yape',
    }
  }

  return null
}

/**
 * nota de venta usando el composable de impresión
 * @param data - Documento de venta para extraer información relevante para la impresión
 */
const imprimirTicket = (data) => {
  const sucursalInfo = store.sucursales.find((s) => s.id === store.sucursalActual) || {}

  printTicket(data, {
    nombreNegocio: store.negocio.nombre || sucursalInfo.nombre || 'MI NEGOCIO',
    ruc: store.negocio.ruc || '',
    logoUrl: store.negocio.logoUrl || '',
    cajero: store.currentShift?.cajero || '',

    direccion: sucursalInfo.direccion || '',
    telefono: sucursalInfo.telefono || '',
  })
}
</script>

<style scoped>
/* Layout y Contenedor Principal */
.history-container {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
}

.history-header {
  padding: 1rem 1.5rem;
  background: var(--bg-app);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-primary);
}

.header-info h3 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
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

/* Tabla: Personalización mediante especificidad de clases */
.table-wrapper {
  flex: 1;
  min-height: 0;
  width: 100%;
}

:deep(.p-datatable.custom-table) {
  /* Cabecera de tabla */
  .p-datatable-thead > tr > th {
    background: var(--bg-surface);
    color: var(--color-text-muted);
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    padding: 0.75rem 1rem;
    border: none;
  }

  /* Filas y Celdas */
  .p-datatable-tbody > tr {
    background: transparent;
    transition: background 0.2s ease;

    &:hover {
      background: var(--bg-surface);
    }

    /* Fila de Gasto: Usamos la clase para teñir el fondo */
    &:has(.is-expense) {
      background-color: var(--color-error-soft);
    }

    > td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--color-border);
    }
  }

  /* Etiquetas (Tags) dentro de la tabla */
  .p-tag {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
  }
}

/* Tipografía y Estados de Celda */
.time-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.client-name {
  font-weight: 700;
  color: var(--color-text-main);
  font-size: 0.9rem;
}

.ticket-ref {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

.expense-row-info {
  color: var(--color-error-dark);
  font-weight: 800;
  font-size: 0.75rem;
}

.amount-text {
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--color-primary);

  &.is-expense {
    color: var(--color-error-dark);
  }
}

/* Control de Anchos de Columna */
.col-time { width: 90px; }
.col-amount { text-align: right; width: 110px; }
.col-actions { width: 90px; }

/* Botones de Acción Refactorizados con :deep */
.actions-group {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

:deep(.p-button.btn-action-info) {
  color: var(--color-text-muted);
}

:deep(.p-button.btn-action-print) {
  color: var(--color-success);
}

:deep(.p-button.btn-action-info:hover) {
  background: var(--bg-surface-alt);
}

:deep(.p-button.btn-action-print:hover) {
  background: var(--color-cash-soft);
}

/* Badges de Métodos (Clases Dinámicas) */
:deep(.p-tag.tag-yape) {
  background: var(--color-yape-soft);
  color: var(--color-yape);
  border: 1px solid var(--color-border);
}

:deep(.p-tag.tag-plin) {
  background: var(--color-plin-soft);
  color: var(--color-plin);
  border: 1px solid var(--color-border);
}

:deep(.p-tag.tag-cash) {
  background: var(--color-cash-soft);
  color: var(--color-cash);
  border: 1px solid var(--color-border);
}

/* Estado Vacío */
.empty-history {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-visual {
  text-align: center;
  color: var(--color-text-muted);
  opacity: 0.6;

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  p {
    font-weight: 700;
    font-size: 0.9rem;
  }
}
</style>