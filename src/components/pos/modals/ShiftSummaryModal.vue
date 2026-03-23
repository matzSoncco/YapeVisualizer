<template>
  <Dialog
    v-model:visible="arqueoState.summaryVisible"
    modal
    :style="{ width: '90vw', maxWidth: '420px' }"
    :closable="false"
    :showHeader="false"
    class="compact-report-dialog"
  >
    <div v-if="arqueoState.summaryData" class="report-wrapper">
      <div class="report-top-bar">
        <span class="report-date">
          <i class="pi pi-calendar"></i>
          {{ formatearFecha(arqueoState.summaryData.fechaCierre) }} -
          {{ formatearHora(arqueoState.summaryData.fechaCierre) }}
        </span>
      </div>

      <div class="report-header">
        <i :class="['status-icon', statusIconClass]"></i>
        <h2 :class="['status-title', statusTextClass]">{{ statusMessage }}</h2>

        <div class="fund-row">
          <span class="fund-text"
            >Efectivo Inicial: S/ {{ arqueoState.summaryData.audit.fund.toFixed(2) }}</span
          >
          <div :class="['variation-badge', differenceBoxClass]">
            <i :class="diffIconClass"></i>
            <span>{{ diffText }}</span>
          </div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card highlight-card">
          <span class="metric-label">Ventas del Día</span>
          <span class="metric-value text-primary"
            >S/ {{ arqueoState.summaryData.totalIngresosDia.toFixed(2) }}</span
          >
          <span class="metric-subtext">{{ totalTransacciones }} ventas en total</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Yape / Plin</span>
          <span class="metric-value">S/ {{ arqueoState.summaryData.totalDigital.toFixed(2) }}</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Efectivo en Caja</span>
          <span class="metric-value"
            >S/ {{ arqueoState.summaryData.totalEfectivoFinal.toFixed(2) }}</span
          >
        </div>

        <div class="metric-card">
          <span class="metric-label">Gastos</span>
          <span class="metric-value color-error">S/ {{ totalGastos.toFixed(2) }}</span>
        </div>
      </div>

      <Button
        label="Entendido, Cerrar Sesión"
        icon="pi pi-sign-out"
        class="btn-exit-report"
        @click="cerrarTodo"
      />
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useShift } from '@/composables/operations/useShift'
import { formatearFecha, formatearHora } from '@/utils/dates'

const { arqueoState, finalizarCierrePorCompleto } = useShift()

const diff = computed(() => arqueoState.summaryData?.audit?.difference || 0)
const totalTransacciones = computed(() => arqueoState.summaryData?.totalTransacciones || 0)
const totalGastos = computed(() => arqueoState.summaryData?.totalGastos || 0)

/**
 * Lógica para determinar el mensaje de estado
 * el ícono y las clases CSS basados en la diferencia del arqueo
 * - Si diff es 0: Caja Cuadrada (icono check, color success)
 * - Si diff es negativo: Faltante de Efectivo (icono times, color error)
 * - Si diff es positivo: Sobrante de Efectivo (icono info, color info)
 */
const statusMessage = computed(() => {
  if (diff.value === 0) return 'Caja Cuadrada'
  if (diff.value < 0) return 'Faltante de Efectivo'
  return 'Sobrante de Efectivo'
})

const statusIconClass = computed(() => {
  if (diff.value === 0) return 'pi pi-check-circle icon-success'
  if (diff.value < 0) return 'pi pi-times-circle icon-error'
  return 'pi pi-info-circle icon-info'
})

const statusTextClass = computed(() => {
  if (diff.value === 0) return 'text-success'
  if (diff.value < 0) return 'text-error'
  return 'text-warning'
})

const diffIconClass = computed(() => {
  if (diff.value === 0) return 'pi pi-check'
  if (diff.value < 0) return 'pi pi-arrow-down'
  return 'pi pi-arrow-up'
})

const diffText = computed(() => {
  if (diff.value === 0) return 'Exacto (S/ 0.00)'
  if (diff.value < 0) return `Falta S/ ${Math.abs(diff.value).toFixed(2)}`
  return `Sobra S/ ${diff.value.toFixed(2)}`
})

const differenceBoxClass = computed(() => {
  if (diff.value === 0) return 'badge-success'
  if (diff.value < 0) return 'badge-error'
  return 'badge-info'
})

const cerrarTodo = () => {
  arqueoState.summaryVisible = false
  finalizarCierrePorCompleto()
}
</script>

<style scoped>
:deep(.compact-report-dialog .p-dialog-content) {
  padding: 1.5rem !important;
  overflow-y: hidden !important;
  border-radius: var(--radius-lg);
}

.report-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* 1. FECHA (TOP BAR) */
.report-top-bar {
  display: flex;
  justify-content: center;
  margin-bottom: -0.5rem;
}

.report-date {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-text-muted);
  background: var(--bg-surface);
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  letter-spacing: 0.02em;
}

/* 2. CABECERA VISUAL */
.report-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.status-icon {
  font-size: 2.8rem;
  margin-bottom: 0.25rem;
}

.status-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

/* COLORES SEMÁNTICOS */
.icon-success,
.text-success {
  color: var(--color-success);
}
.icon-error,
.text-error {
  color: var(--color-error);
}
.icon-info,
.text-info {
  color: #0284c7;
}
.badge-info {
  background-color: #e0f2fe;
  color: #0369a1;
  border-color: #bae6fd;
}
.text-primary {
  color: var(--color-primary) !important;
}

/* BASE Y VARIACIÓN */
.fund-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--bg-surface);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  width: 100%;
}

.fund-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 800;
}

.variation-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 900;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}
.badge-error {
  background: #fee2e2;
  color: #991b1b;
}
.badge-warning {
  background: #fef3c7;
  color: #b45309;
}

/* GRILLAS CON METRICAS */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.metric-card {
  background-color: var(--bg-app);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: var(--shadow-flat);
}

.highlight-card {
  background-color: var(--bg-surface);
  border-color: var(--color-text-muted);
}

.metric-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-text-main);
  font-family: 'Nunito', sans-serif;
  letter-spacing: -0.02em;
}

.metric-subtext {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
  margin-top: 0.2rem;
}

.color-error {
  color: var(--color-error);
}

/* 4. BOTÓN */
.btn-exit-report {
  width: 100%;
  height: 44px;
  font-weight: 800;
  font-size: 0.95rem;
  border-radius: 8px;
  background-color: var(--color-primary);
  border: none;
  color: white;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: all 0.2s;
}

.btn-exit-report:hover {
  background-color: #1e293b;
  transform: translateY(-1px);
}
</style>
