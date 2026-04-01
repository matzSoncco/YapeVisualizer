<template>
  <div class="bento-grid">
    
    <div class="bento-card bento-main">
      <div class="card-header">
        <span class="bento-label">Ingresos Netos</span>
        <div class="icon-wrapper icon-wallet">
          <i class="pi pi-wallet"></i>
        </div>
      </div>
      <div class="bento-body">
        <h2 class="bento-value color-dark">S/ {{ formatMoney(kpis.totalVentas) }}</h2>
        <div class="bento-footer">
          <span class="color-danger fw-600">- S/ {{ formatMoney(kpis.totalGastos || 0) }}</span>
          <span class="color-muted spacing-left">en gastos</span>
        </div>
      </div>
    </div>

    <div class="bento-card bento-composition">
      <div class="card-header">
        <span class="bento-label">Composición de Ingresos</span>
      </div>
      <div class="bento-body">
        <div class="composition-bar-wrapper">
          <div class="composition-bar">
            <div class="bar-segment cash" :style="{ width: `${pctEfectivo}%` }" title="Efectivo"></div>
            <div class="bar-segment digital" :style="{ width: `${pctDigital}%` }" title="Digital (Yape/Tarjetas)"></div>
          </div>
          <div class="composition-legend">
            <div class="legend-item">
              <span class="dot cash-dot"></span>
              <div class="legend-text">
                <strong class="color-dark">{{ pctEfectivo }}% Efectivo</strong>
                <span class="color-muted fw-600">S/ {{ formatMoney(efectivoEstimado) }}</span>
              </div>
            </div>
            <div class="legend-item align-right">
              <div class="legend-text text-right">
                <strong class="color-dark">{{ pctDigital }}% Digital</strong>
                <span class="color-muted fw-600">S/ {{ formatMoney(kpis.totalDigital) }}</span>
              </div>
              <span class="dot digital-dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bento-card" :class="kpis.diferenciaNeta < 0 ? 'health-warn' : 'health-ok'">
      <div class="card-header">
        <span class="bento-label">Salud de Caja</span>
        <div class="icon-wrapper">
          <i :class="kpis.diferenciaNeta < 0 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
        </div>
      </div>
      <div class="bento-body">
        <h2 class="bento-value" :class="kpis.diferenciaNeta < 0 ? 'color-danger' : 'color-success'">
          {{ kpis.diferenciaNeta > 0 ? '+' : '' }}S/ {{ formatMoney(kpis.diferenciaNeta) }}
        </h2>
        <div class="bento-footer">
          <span class="color-muted">Descuadre acumulado</span>
        </div>
      </div>
    </div>

    <div class="bento-card">
      <div class="card-header">
        <span class="bento-label">Flujo de Clientes</span>
        <div class="icon-wrapper icon-users">
          <i class="pi pi-users"></i>
        </div>
      </div>
      <div class="bento-body">
        <h2 class="bento-value color-dark">{{ kpis.totalTransactions }}</h2>
        <div class="bento-footer">
          <span class="color-muted">Ventas realizadas</span>
        </div>
      </div>
    </div>

    <div class="bento-card">
      <div class="card-header">
        <span class="bento-label">Ticket Promedio</span>
        <div class="icon-wrapper icon-receipt">
          <i class="pi pi-receipt"></i>
        </div>
      </div>
      <div class="bento-body">
        <h2 class="bento-value color-dark">S/ {{ formatMoney(kpis.ticketPromedio) }}</h2>
        <div class="bento-footer">
          <span class="color-muted">Gasto medio por cliente</span>
        </div>
      </div>
    </div>

    <div class="bento-card bento-products">
      <div class="card-header">
        <span class="bento-label">Top Productos (Mayor Rotación)</span>
        <div class="status-badge">Próximamente</div>
      </div>
      <div class="bento-body empty-state-body">
        <i class="pi pi-box empty-icon"></i>
        <p class="empty-text">El módulo de inventario está en desarrollo.<br>Pronto verás aquí qué productos se venden más.</p>
      </div>
    </div>

    <div class="bento-card bento-branches">
      <div class="card-header">
        <span class="bento-label">Rendimiento por Sede</span>
      </div>
      <div class="bento-body wrapper-branches">
        <div class="branch-skeleton">
          <div class="bento-body empty-state-body">
            <i class="pi pi-box empty-icon"></i>
            <p class="empty-text">El módulo de rendimiento por sede está en desarrollo.<br>Pronto verás aquí el desempeño de cada sede.</p>
          </div>
          <div class="skel-line w-100"></div>
          <div class="skel-line w-80"></div>
          <div class="skel-line w-60"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  kpis: {
    type: Object,
    required: true,
    default: () => ({
      totalVentas: 0,
      totalDigital: 0,
      totalGastos: 0, 
      totalTransactions: 0,
      diferenciaNeta: 0,
      ticketPromedio: 0
    })
  }
});

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Cálculos para la barra de composición
const efectivoEstimado = computed(() => Math.max(0, props.kpis.totalVentas - props.kpis.totalDigital));

const pctEfectivo = computed(() => {
  if (props.kpis.totalVentas === 0) return 0;
  return Math.round((efectivoEstimado.value / props.kpis.totalVentas) * 100);
});

const pctDigital = computed(() => {
  if (props.kpis.totalVentas === 0) return 0;
  return 100 - pctEfectivo.value;
});
</script>

<style scoped>
/* ── CLASES UTILITARIAS PURAS ── */
.color-dark { color: #0f172a; }
.color-muted { color: #94a3b8; }
.color-danger { color: #ef4444; }
.color-success { color: #10b981; }
.fw-600 { font-weight: 600; }
.spacing-left { margin-left: 0.35rem; }
.text-right { text-align: right; }
.align-right { align-items: flex-end !important; }

.w-100 { width: 100%; }
.w-80 { width: 80%; }
.w-60 { width: 60%; }

/* ── GRÁFICA TIPO BENTO BOX ── */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.25rem;
}

.bento-card {
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  grid-column: span 4;
}

.bento-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* Modificadores de ancho y alto para que se vean bien */
.bento-main { grid-column: span 4; }
.bento-composition { grid-column: span 8; }
.bento-products { grid-column: span 8; min-height: 220px; }
.bento-branches { grid-column: span 4; min-height: 220px; }

/* ── ELEMENTOS INTERNOS ── */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

/* El body debe estirarse para llenar el resto de la tarjeta */
.bento-body {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1; 
}

.bento-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

/* Colores personalizados de iconos */
.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.icon-wallet { background: #f1f5f9; color: #64748b; }
.icon-users { background: #eff6ff; color: #3b82f6; }
.icon-receipt { background: #faf5ff; color: #a855f7; }

.bento-value {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 0.25rem 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.bento-footer {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
}

/* ── BARRA DE COMPOSICIÓN ── */
.composition-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: auto;
}

.composition-bar {
  width: 100%;
  height: 24px;
  background: #f1f5f9;
  border-radius: 999px;
  display: flex;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.bar-segment {
  height: 100%;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.bar-segment.cash { background: #10b981; border-right: 2px solid #fff; }
.bar-segment.digital { background: #6366f1; }

.composition-legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.legend-text {
  display: flex;
  flex-direction: column;
}

.legend-text strong { font-size: 0.95rem; }
.legend-text span { font-size: 0.75rem; }

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
}
.cash-dot { background: #10b981; }
.digital-dot { background: #6366f1; }

/* ── VARIACIONES DE SALUD ── */
.health-ok .icon-wrapper { background: #ecfdf5; color: #10b981; }
.health-warn { border-color: #fca5a5; background: #fef2f2; }
.health-warn .icon-wrapper { background: #fee2e2; color: #ef4444; }

/* Badge para próximos features (Reemplaza a Tag de PrimeVue para más control) */
.status-badge {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── EMPTY STATES ── */
.empty-state-body {
  align-items: center;
  justify-content: center !important;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  padding: 1.5rem;
}

.empty-icon {
  font-size: 2.5rem;
  color: #cbd5e1;
  margin-bottom: 0.75rem;
}

.empty-text {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
}

.wrapper-branches {
  justify-content: flex-end;
}

.branch-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skel-line {
  height: 32px;
  background: #f1f5f9;
  border-radius: 8px;
}

/* ── RESPONSIVE ── */
@media (max-width: 1200px) {
  .bento-products { grid-column: span 12; }
  .bento-branches { grid-column: span 12; }
}

@media (max-width: 1024px) {
  .bento-main { grid-column: span 6; }
  .bento-composition { grid-column: span 12; order: -1; }
  .bento-card { grid-column: span 6; }
}

@media (max-width: 768px) {
  .bento-card { grid-column: span 12 !important; }
}
</style>