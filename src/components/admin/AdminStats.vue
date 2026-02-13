<template>
  <div class="stats-grid">
    
    <Card class="stat-card sales">
      <template #content>
        <div class="stat-inner">
          <div class="stat-data">
            <span class="stat-label">Ventas Totales</span>
            <div class="stat-value">S/ {{ formatMoney(kpis.totalVentas) }}</div>
            <div class="stat-footer">En el periodo seleccionado</div>
          </div>
          <div class="stat-icon-box">
            <i class="pi pi-dollar"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card class="stat-card digital">
      <template #content>
        <div class="stat-inner">
          <div class="stat-data">
            <span class="stat-label">Digitalización (Yape)</span>
            <div class="stat-value">{{ kpis.porcentajeDigital.toFixed(1) }}%</div>
            <div class="stat-footer">
              <span class="highlight">S/ {{ formatMoney(kpis.totalYape) }}</span> por Yape
            </div>
          </div>
          <div class="stat-icon-box">
            <i class="pi pi-mobile"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card class="stat-card ticket">
      <template #content>
        <div class="stat-inner">
          <div class="stat-data">
            <span class="stat-label">Ticket Promedio</span>
            <div class="stat-value">S/ {{ formatMoney(kpis.ticketPromedio) }}</div>
            <div class="stat-footer">Promedio por cierre de caja</div>
          </div>
          <div class="stat-icon-box">
            <i class="pi pi-shopping-cart"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card 
      class="stat-card audit" 
      :class="kpis.diferenciaNeta < 0 ? 'is-negative' : 'is-positive'"
    >
      <template #content>
        <div class="stat-inner">
          <div class="stat-data">
            <span class="stat-label">Balance de Auditoría</span>
            <div class="stat-value">
              {{ kpis.diferenciaNeta > 0 ? '+' : '' }}S/ {{ formatMoney(kpis.diferenciaNeta) }}
            </div>
            <div class="stat-footer">Acumulado de descuadres</div>
          </div>
          <div class="stat-icon-box">
            <i :class="['pi', kpis.diferenciaNeta < 0 ? 'pi-exclamation-triangle' : 'pi-check-circle']"></i>
          </div>
        </div>
      </template>
    </Card>

  </div>
</template>

<script setup>
import Card from 'primevue/card';

const props = defineProps({
  kpis: {
    type: Object,
    required: true,
    default: () => ({
      totalVentas: 0,
      porcentajeDigital: 0,
      totalYape: 0,
      ticketPromedio: 0,
      diferenciaNeta: 0
    })
  }
});

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<style scoped>
/* GRID DE ESTADÍSTICAS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.stat-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
}

.stat-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.stat-data {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b; /* Slate 500 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0f172a; /* Slate 900 */
  margin: 0.4rem 0;
}

.stat-footer {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
}

.stat-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

/* COLORES POR CATEGORÍA */
.stat-card.sales .stat-icon-box { background: #f0fdf4; color: #22c55e; }
.stat-card.digital .stat-icon-box { background: #f5f3ff; color: #7c3aed; }
.stat-card.digital .highlight { color: #7c3aed; font-weight: 800; }
.stat-card.ticket .stat-icon-box { background: #eff6ff; color: #3b82f6; }

/* VARIACIONES DE AUDITORÍA */
.stat-card.audit.is-positive .stat-icon-box { background: #ecfdf5; color: #10b981; }
.stat-card.audit.is-positive .stat-value { color: #10b981; }

.stat-card.audit.is-negative .stat-icon-box { background: #fef2f2; color: #ef4444; }
.stat-card.audit.is-negative .stat-value { color: #ef4444; }

/* Eliminamos bordes izquierdos gruesos por algo más fino */
.stat-card {
  position: relative;
  overflow: hidden;
}
.stat-card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}
.sales::after { background: #22c55e; }
.digital::after { background: #7c3aed; }
.ticket::after { background: #3b82f6; }
.is-positive::after { background: #10b981; }
.is-negative::after { background: #ef4444; }
</style>