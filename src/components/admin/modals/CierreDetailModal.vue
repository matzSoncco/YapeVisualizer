<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="cierre-detail-drawer"
    header="Detalle de Auditoría"
  >
    <div v-if="data" class="drawer-content">
      <header class="cierre-header">
        <div class="branch-pill">{{ data.sedeNombre }}</div>
        <span class="cierre-date">{{ data.fecha?.toLocaleDateString() }}</span>
      </header>

      <div :class="['balance-card', getDiffClass(data.diferencia)]">
        <div class="balance-main">
          <span class="label">Diferencia Final</span>
          <h2 class="amount">
            {{ data.diferencia > 0 ? '+' : '' }}S/ {{ data.diferencia.toFixed(2) }}
          </h2>
        </div>
        <div class="balance-icon">
          <i
            :class="data.diferencia === 0 ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"
          ></i>
        </div>
      </div>

      <section class="info-group">
        <h4 class="group-title">Flujo de Efectivo</h4>
        <div class="info-card">
          <div class="info-row">
            <span>Apertura de Caja</span>
            <strong>S/ {{ formatMonto(data.montoApertura) }}</strong>
          </div>
          <div class="info-row">
            <span>Ventas en Efectivo</span>
            <strong class="text-success">+ S/ {{ formatMonto(data.montoEfectivo) }}</strong>
          </div>
          <div class="info-row">
            <span>Gastos / Salidas</span>
            <strong class="text-danger">- S/ {{ formatMonto(data.totalGastos) }}</strong>
          </div>
          <div class="info-row footer">
            <span>Efectivo Esperado</span>
            <span class="total">S/ {{ formatMonto(data.efectivoEsperado) }}</span>
          </div>
        </div>
      </section>

      <section class="info-group">
        <h4 class="group-title">Pagos Digitales</h4>
        <div class="info-card digital-highlight">
          <i class="pi pi-mobile"></i>
          <div class="digital-data">
            <span>Total Yape / Plin</span>
            <span class="digital-amount">S/ {{ formatMonto(data.montoDigital) }}</span>
          </div>
        </div>
      </section>

      <section class="info-group" v-if="data.productosTop?.length">
        <h4 class="group-title">Top 3 Productos</h4>
        <div class="product-grid">
          <div v-for="(prod, idx) in data.productosTop" :key="idx" class="product-badge">
            <span class="p-rank">{{ idx + 1 }}</span>
            <span class="p-name">{{ prod.nombre }}</span>
            <span class="p-qty">{{ prod.cantidad }}</span>
          </div>
        </div>
      </section>

      <footer class="drawer-footer">
        <div class="user-info">
          <i class="pi pi-user"></i>
          <span
            >Cajero: <strong>{{ data.cajero }}</strong></span
          >
        </div>
        <div class="shift-id">ID de Turno: {{ data.id }}</div>
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

const getDiffClass = (val) => {
  if (val === 0) return 'diff-ok'
  return val < 0 ? 'diff-error' : 'diff-warn'
}
</script>

<style scoped>
/* Estenedor del Drawer */
:deep(.cierre-detail-drawer) {
  width: 400px !important;
  border-left: 1px solid #e2e8f0;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

/* HEADER */
.cierre-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.branch-pill {
  background: #0f172a;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* CARDS PRINCIPALES */
.balance-card {
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.balance-main .label { font-size: 0.8rem; opacity: 0.8; font-weight: 600; }
.balance-main .amount { font-size: 1.8rem; font-weight: 900; margin: 0; }
.balance-icon i { font-size: 2.5rem; opacity: 0.2; }

/* Estados de Balance */
.diff-ok { background: #d1fae5; color: #065f46; }
.diff-error { background: #fee2e2; color: #991b1b; }
.diff-warn { background: #fffbeb; color: #92400e; }

/* GRUPOS DE INFO */
.group-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 0.75rem;
  letter-spacing: 0.05em;
}

.info-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #f1f5f9;
}
.info-row.footer {
  border-bottom: none;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 2px solid #f1f5f9;
}
.info-row .total { font-weight: 900; font-size: 1rem; color: #0f172a; }

/* HIGHLIGHT DIGITAL */
.digital-highlight {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f0f9ff;
  border-color: #bae6fd;
}
.digital-highlight i { font-size: 1.5rem; color: #0284c7; }
.digital-data { display: flex; flex-direction: column; }
.digital-amount { font-size: 1.2rem; font-weight: 800; color: #0369a1; }

/* PRODUCTOS */
.product-grid { display: flex; flex-direction: column; gap: 8px; }
.product-badge {
  display: flex;
  align-items: center;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  gap: 10px;
}
.p-rank { font-weight: 900; color: #cbd5e1; }
.p-name { flex: 1; font-weight: 700; font-size: 0.85rem; }
.p-qty { font-weight: 800; color: #0f172a; background: white; padding: 2px 8px; border-radius: 4px; }

/* FOOTER */
.drawer-footer {
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px dashed #cbd5e1;
}
.user-info { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #475569; }
.shift-id { font-size: 0.65rem; color: #94a3b8; margin-top: 4px; font-family: monospace; }
</style>