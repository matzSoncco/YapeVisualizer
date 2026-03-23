<template>
  <DataTable
    :value="data"
    :loading="loading"
    :paginator="data.length > 10"
    :rows="10"
    scrollable 
    scrollHeight="flex" 
    class="admin-datatable report-table-card"
  >
    <Column header="Operación" class="col-identity">
      <template #body="{ data }">
        <div class="identity-cell">
          <span class="branch-text">{{ data.sedeNombre }}</span>
          <span class="cashier-text">Cajero: {{ data.cajero || '---' }}</span>
        </div>
      </template>
    </Column>

    <Column header="Fecha / Hora" sortable field="fecha" class="col-date">
      <template #body="{ data }">
        <div class="date-wrapper">
          <span class="date-main">{{ formatearFecha(data.fecha) }}</span>
          <span class="date-sub">{{ formatearHora(data.fecha) }}</span>
        </div>
      </template>
    </Column>

    <Column header="Venta Total" class="col-amount">
      <template #body="{ data }">
        <span class="total-amount-hero">S/ {{ Number(data.totalIngresosDia || 0).toFixed(2) }}</span>
      </template>
    </Column>

    <Column header="Estado de Caja" class="col-status">
      <template #body="{ data }">
        <div :class="['status-pill', getDiffClass(data.diferencia)]">
          <i :class="getDiffIcon(data.diferencia)"></i>
          <span>{{ getDiffLabel(data.diferencia) }}</span>
        </div>
      </template>
    </Column>

    <Column header="Acciones" class="col-action">
      <template #body="{ data }">
        <Button
          icon="pi pi-eye"
          label="Detalles"
          text
          class="btn-view-more"
          @click="$emit('ver-detalle', data)"
        />
      </template>
    </Column>

    <template #empty>
      <div class="empty-container">
        <div class="empty-icon-circle">
          <i class="pi pi-search-plus"></i>
        </div>
        <div class="empty-text">
          <h3>No se encontraron cierres</h3>
          <p>Prueba ajustando los filtros de fecha o seleccionando otra sede.</p>
        </div>
      </div>
    </template>
  </DataTable>
</template>

<script setup>
import { formatearFecha, formatearHora } from '@/utils/dates';

defineProps({
  data: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

defineEmits(['ver-detalle']);

const getDiffClass = (v) => {
  if (v === 0) return 'pill-ok';
  if (Math.abs(v) <= 1) return 'pill-warn';
  return v < 0 ? 'pill-error' : 'pill-info';
};

const getDiffIcon = (v) => {
  if (v === 0) return 'pi pi-check-circle';
  if (v < 0) return 'pi pi-minus-circle';
  return 'pi pi-plus-circle';
};

const getDiffLabel = (v) => {
  if (v === 0) return 'Cuadrado';
  return `S/ ${v.toFixed(2)}`;
};
</script>

<style scoped>
.report-table-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  min-height: 0;
  padding: 1rem;
}

/* CELDA DE IDENTIDAD (Doble línea) */
.identity-cell { display: flex; flex-direction: column; gap: 2px; }
.branch-text { font-weight: 800; color: #0f172a; font-size: 0.9rem; }
.cashier-text { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: capitalize; }

/* CELDA DE FECHA */
.date-wrapper { display: flex; flex-direction: column; }
.date-main { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #334155; font-size: 0.85rem; }
.date-sub { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

/* MONTO PRINCIPAL */
.total-amount-hero {
  font-size: 1.1rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
}

/* PILLS DE ESTADO (Modernas) */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.pill-ok { background: #d1fae5; color: #065f46; }
.pill-error { background: #fee2e2; color: #991b1b; }
.pill-warn { background: #fffbeb; color: #92400e; }
.pill-info { background: #e0f2fe; color: #075985; }

/* BOTÓN DETALLES */
.btn-view-more {
  font-weight: 800 !important;
  font-size: 0.8rem !important;
  color: #3b82f6 !important;
}

:deep(.p-datatable-thead > tr > th) {
  background: #f8fafc !important;
  font-size: 0.7rem !important;
  letter-spacing: 0.05em;
  padding: 1.25rem 1rem !important;
}

.col-amount { text-align: right; }

/* Eliminamos el estilo por defecto de la celda de "no data" */
:deep(.p-datatable-emptymessage td) {
  padding: 0 !important;
  background: #f8fafc !important; /* Un gris muy tenue para diferenciarlo de las filas */
  border: none !important;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem;
  gap: 1.5rem;
}

.empty-icon-circle {
  width: 70px;
  height: 70px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.empty-icon-circle i {
  font-size: 2rem;
  color: #94a3b8;
}

.empty-text {
  text-align: center;
}

.empty-text h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.empty-text p {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #64748b;
  max-width: 300px;
  line-height: 1.4;
}
</style>