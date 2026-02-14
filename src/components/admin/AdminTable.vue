<template>
  <Card class="report-table-card">
    <template #content>
      <DataTable
        :value="data"
        :loading="loading"
        :paginator="data.length > 10"
        :rows="10"
        responsiveLayout="scroll"
        class="admin-datatable"
      >
        <Column field="fecha" header="Fecha" sortable class="col-date">
          <template #body="{ data }">
            <span class="date-cell">{{ formatearFecha(data.fecha) }}</span>
          </template>
        </Column>

        <Column field="sedeNombre" header="Sede" sortable>
          <template #body="{ data }">
            <span class="branch-cell">{{ data.sedeNombre }}</span>
          </template>
        </Column>

        <Column field="cajero" header="Cajero">
          <template #body="{ data }">
            <span class="cashier-cell">{{ data.cajero || '---' }}</span>
          </template>
        </Column>

        <Column field="totalIngresosDia" header="Ingreso Total" class="col-amount">
          <template #body="{ data }">
            <span class="total-amount">S/ {{ Number(data.totalIngresosDia || 0).toFixed(2) }}</span>
          </template>
        </Column>

        <Column field="montoYape" header="Total Yape" class="col-amount">
          <template #body="{ data }">
            <span class="yape-amount">S/ {{ Number(data.montoYape || 0).toFixed(2) }}</span>
          </template>
        </Column>

        <Column field="montoEfectivo" header="Efectivo" class="col-amount">
          <template #body="{ data }">
            <span class="cash-amount">S/ {{ Number(data.montoEfectivo || 0).toFixed(2) }}</span>
          </template>
        </Column>

        <Column field="diferencia" header="Diferencia" class="col-amount">
          <template #body="{ data }">
            <span :class="['diff-badge', getDiffClass(data.diferencia)]">
              {{ data.diferencia > 0 ? '+' : '' }}S/ {{ Number(data.diferencia || 0).toFixed(2) }}
            </span>
          </template>
        </Column>

        <Column field="estado" header="Auditoría" class="col-status">
          <template #body="{ data }">
            <Tag 
              :value="data.estado"
              :severity="data.estado === 'Cuadrado' ? 'success' : 'danger'"
              rounded
              class="status-tag"
            />
          </template>
        </Column>

        <Column header="Acción" class="col-action">
          <template #body="{ data }">
            <Button
              icon="pi pi-search-plus"
              text
              rounded
              class="btn-detail"
              @click="$emit('ver-detalle', data)"
            />
          </template>
        </Column>

        <template #empty>
          <div class="empty-table-state">
            <i class="pi pi-filter-slash"></i>
            <p>No hay cierres registrados en este rango.</p>
          </div>
        </template>
      </DataTable>
    </template>
  </Card>
</template>

<script setup>
import { formatearFecha } from '@/utils/dates';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Card from 'primevue/card';

/**
 * Componente AdminTable
 * - Recibe un array de datos y un estado de carga
 */
defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

/**
 * Emite un evento 'ver-detalle' cuando se hace clic en el botón de acción
 * TODO: Implementar la lógica para mostrar el detalle del cierre seleccionado en una vista o modal aparte
 */
defineEmits(['ver-detalle']);

const getDiffClass = (val) => {
  if (val < -0.5) return 'diff-negative';
  if (val > 0.5) return 'diff-positive';
  return 'diff-neutral';
};
</script>

<style scoped>
/* TABLA DE REPORTES */
.report-table-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
  overflow: hidden;
}

:deep(.admin-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc !important;
  color: #64748b !important;
  font-size: 0.75rem !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  padding: 1rem !important;
  border-bottom: 2px solid #e2e8f0 !important;
}

:deep(.admin-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem !important;
  border-bottom: 1px solid #f1f5f9 !important;
  font-size: 0.875rem !important;
}

/* CELDAS ESTILIZADAS */
.date-cell { color: #64748b; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
.branch-cell { font-weight: 800; color: #0f172a; }
.cashier-cell { text-transform: capitalize; color: #475569; }

.total-amount { font-weight: 800; color: #0f172a; }
.yape-amount { font-weight: 800; color: #7c3aed; }
.cash-amount { font-weight: 600; color: #334155; }

/* BADGES DE DIFERENCIA */
.diff-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.8rem;
}
.diff-negative { background: #fef2f2; color: #ef4444; }
.diff-positive { background: #eff6ff; color: #3b82f6; }
.diff-neutral { background: #f0fdf4; color: #22c55e; }

.status-tag { font-weight: 800 !important; font-size: 0.7rem !important; }

.btn-detail { color: #64748b !important; }
.btn-detail:hover { background: #f1f5f9 !important; color: #0f172a !important; }

.empty-table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  color: #94a3b8;
}
.empty-table-state i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }

.col-amount { text-align: right; }
</style>