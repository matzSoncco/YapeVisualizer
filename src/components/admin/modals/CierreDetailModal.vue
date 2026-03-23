<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="cierre-detail-drawer"
    header="Auditoría de Turno"
  >
    <div v-if="data" class="drawer-content">
      <header class="audit-header">
        <div class="branch-info">
          <span class="branch-name">{{ data.sedeNombre }}</span>
          <span class="audit-id">ID: {{ data.id?.slice(-6).toUpperCase() }}</span>
        </div>
        <div class="audit-date">
          <i class="pi pi-calendar"></i>
          {{ data.fecha?.toLocaleDateString('es-PE', { day: '2-digit', month: 'long' }) }}
        </div>
      </header>

      <section class="performance-card">
        <div class="perf-main">
          <span class="perf-label">Venta Total del Día</span>
          <h2 class="perf-amount">S/ {{ formatMonto(data.totalIngresosDia) }}</h2>
        </div>
        <div class="perf-stats">
          <div class="stat">
            <i class="pi pi-wallet"></i>
            <span>S/ {{ formatMonto(data.montoEfectivo) }}</span>
            <small>Efectivo</small>
          </div>
          <div class="stat">
            <i class="pi pi-mobile"></i>
            <span>S/ {{ formatMonto(data.montoDigital) }}</span>
            <small>Digital</small>
          </div>
        </div>
      </section>

      <div :class="['balance-strip', getDiffClass(data.diferencia)]">
        <div class="strip-content">
          <i :class="getDiffIcon(data.diferencia)"></i>
          <div class="strip-text">
            <span class="strip-label">Estado de Caja</span>
            <span class="strip-value">{{ getDiffLabel(data.diferencia) }}</span>
          </div>
        </div>
      </div>

      <section class="detail-section">
        <h4 class="section-title">Flujo de Caja Físico</h4>
        <div class="info-card">
          <div class="info-row">
            <span>Fondo Inicial (Apertura)</span>
            <span class="val">S/ {{ formatMonto(data.montoApertura) }}</span>
          </div>
          <div class="info-row">
            <span>(+) Ventas Efectivo</span>
            <span class="val text-success">S/ {{ formatMonto(data.montoEfectivo) }}</span>
          </div>
          <div class="info-row">
            <span>(-) Gastos / Salidas</span>
            <span class="val text-danger">S/ {{ formatMonto(data.totalGastos) }}</span>
          </div>
          <div class="info-row expected-row">
            <span>Efectivo Esperado</span>
            <span class="val">S/ {{ formatMonto(data.efectivoEsperado) }}</span>
          </div>
          <div class="info-row declared-row">
            <span>Efectivo Declarado</span>
            <span class="val">S/ {{ formatMonto(data.efectivoDeclarado) }}</span>
          </div>
        </div>
      </section>

      <section class="detail-section" v-if="data.productosTop?.length">
        <h4 class="section-title">Productos con mayor rotación</h4>
        <div class="product-list">
          <div v-for="(prod, idx) in data.productosTop" :key="idx" class="product-item">
            <div class="p-rank">{{ idx + 1 }}</div>
            <div class="p-info">
              <span class="p-name">{{ prod.nombre }}</span>
              <span class="p-qty">{{ prod.cantidad }} unidades vendidas</span>
            </div>
          </div>
        </div>
      </section>

      <footer class="audit-footer">
        <div class="responsible">
          <div class="user-avatar">
            {{ data.cajero?.charAt(0).toUpperCase() }}
          </div>
          <div class="user-meta">
            <span class="u-label">Cajero responsable</span>
            <span class="u-name">{{ data.cajero }}</span>
          </div>
        </div>
      </footer>
    </div>
  </Drawer>
</template>

<script setup>
import { formatMonto } from '@/utils/formatters'

defineProps({
  visible: Boolean,
  data: Object,
})

defineEmits(['update:visible'])

const getDiffClass = (v) => {
  if (v === 0) return 'state-ok'
  if (Math.abs(v) <= 1) return 'state-warn'
  return v < 0 ? 'state-error' : 'state-info'
}

const getDiffIcon = (v) => {
  if (v === 0) return 'pi pi-check-circle'
  if (v < 0) return 'pi pi-exclamation-circle'
  return 'pi pi-info-circle'
}

const getDiffLabel = (v) => {
  if (v === 0) return 'Caja Cuadrada'
  return `Diferencia de S/ ${v.toFixed(2)}`
}
</script>

<style scoped>
:deep(.cierre-detail-drawer) {
  width: 420px !important;
  background: #fcfcfd !important;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem;
}

/* HEADER */
.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}
.branch-name {
  display: block;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}
.audit-id {
  font-size: 0.65rem;
  color: #94a3b8;
  font-family: monospace;
}
.audit-date {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* PERFORMANCE CARD (La Venta Total) */
.performance-card {
  background: #0f172a;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 1.5rem;
  border-radius: 20px;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
}
.perf-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.7;
}
.perf-amount {
  font-size: 2.2rem;
  font-weight: 900;
  margin: 0.5rem 0;
  color: #fbbf24;
}
.perf-stats {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat i {
  font-size: 0.8rem;
  margin-bottom: 4px;
  opacity: 0.6;
}
.stat span {
  font-weight: 700;
  font-size: 0.9rem;
}
.stat small {
  font-size: 0.65rem;
  opacity: 0.5;
  text-transform: uppercase;
}

/* BALANCE STRIP */
.balance-strip {
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
}
.strip-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.strip-content i {
  font-size: 1.5rem;
}
.strip-text {
  display: flex;
  flex-direction: column;
}
.strip-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.8;
}
.strip-value {
  font-size: 0.95rem;
  font-weight: 800;
}

.state-ok {
  background: #ecfdf5;
  color: #059669;
}
.state-warn {
  background: #fffbeb;
  color: #d97706;
}
.state-error {
  background: #fef2f2;
  color: #dc2626;
}
.state-info {
  background: #f0f9ff;
  color: #0284c7;
}

/* SECCIONES DE INFO */
.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 800;
  margin-bottom: 0.75rem;
}
.info-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  font-size: 0.85rem;
  border-bottom: 1px solid #f8fafc;
}
.val {
  font-weight: 700;
  color: #1e293b;
}

.expected-row {
  margin-top: 0.5rem;
  border-top: 2px solid #f1f5f9;
  padding-top: 1rem !important;
  color: #64748b;
}
.declared-row {
  background: #f8fafc;
  margin: 0.5rem -1rem -1rem -1rem;
  padding: 1rem !important;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}
.declared-row .val {
  font-size: 1.1rem;
  color: #0f172a;
}

/* PRODUCTOS */
.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  margin-bottom: 8px;
}
.p-rank {
  width: 24px;
  height: 24px;
  background: #f1f5f9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 900;
  color: #64748b;
}
.p-info {
  display: flex;
  flex-direction: column;
}
.p-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}
.p-qty {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* FOOTER */
.audit-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e2e8f0;
}
.responsible {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-avatar {
  width: 36px;
  height: 36px;
  background: #e2e8f0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #475569;
}
.user-meta {
  display: flex;
  flex-direction: column;
}
.u-label {
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
}
.u-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.text-success {
  color: #10b981;
}
.text-danger {
  color: #ef4444;
}
</style>
