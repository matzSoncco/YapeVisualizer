<template>
  <header class="pos-navbar">
    <div class="navbar-left">
      <div class="brand-badge">
        <i class="pi pi-wallet"></i>
      </div>
      <div class="brand-info">
        <span class="brand-title">Monitor</span>
        <div class="location-context">
          <span class="location-name">{{ nombreSucursal }}</span>
          <span class="context-divider">|</span>
          <div class="cashier-tag">
            <i class="pi pi-user"></i>
            <span class="cashier-name">{{ nombreCajero }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="navbar-right">
      <div class="nav-group navigation">
        <Button
          v-if="isDev"
          label="Simular"
          icon="pi pi-bolt"
          @click="$emit('simular')"
          text
          class="nav-btn"
        />
        <Button
          label="Sede"
          icon="pi pi-sync"
          @click="$emit('cambiar-sucursal')"
          text class="nav-btn"
        />
        <Button
          label="Gasto"
          icon="pi pi-minus-circle"
          @click="$emit('abrir-gasto')"
          text
          class="nav-btn expense"
        />
      </div>

      <div class="nav-divider"></div>

      <div class="nav-group sessions">
        <Button
          label="Finalizar Turno"
          icon="pi pi-power-off"
          @click="$emit('finalizar-turno')"
          class="btn-exit"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  nombreSucursal: String,
  nombreCajero: String
})

defineEmits(['simular', 'cambiar-sucursal', 'abrir-gasto', 'finalizar-turno']);

const isDev = computed(() => {
    return import.meta.env.DEV && import.meta.env.VITE_ENABLE_SIMULATOR === 'true';
  }
)
</script>

<style scoped>
/* NAVBAR SUPERIOR: ESTILO COMMAND CENTER */
.pos-navbar {
  height: 65px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* LADO IZQUIERDO: LOGO Y SEDE */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-badge {
  width: 36px;
  height: 36px;
  background: #0f172a; /* Slate 900 */
  color: #facc15; /* Tu amarillo */
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
}

/* CONTEXTO DE UBICACIÓN Y CAJERO */
.location-context {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2px;
}

.context-divider {
  color: #cbd5e1; /* Slate 300 */
  font-size: 0.75rem;
  font-weight: 300;
}

.cashier-tag {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #f1f5f9; /* Slate 100 */
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.cashier-tag i {
  font-size: 0.65rem;
  color: #64748b;
}

.cashier-name {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569; /* Slate 600 */
  text-transform: capitalize;
}

/* Ajuste al nombre de la sede para que resalte un poco más */
.location-name {
  font-size: 0.75rem;
  color: #0f172a; /* Ahora un poco más oscuro */
  font-weight: 700;
}

/* LADO DERECHO: ACCIONES */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* BOTONES GHOST REFINADOS */
.nav-btn {
  color: #475569 !important; /* Slate 600 */
  font-weight: 700 !important;
  font-size: 0.8rem !important;
  padding: 0.5rem 0.75rem !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.nav-btn:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

/* Botón de Gasto con toque de alerta */
.nav-btn.expense:hover {
  color: #ef4444 !important;
  background: #fef2f2 !important;
}

/* DIVISOR VERTICAL */
.nav-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
  margin: 0 0.25rem;
}

/* BOTÓN DE CIERRE (El protagonista) */
.btn-exit {
  background: #fee2e2 !important; /* Rojo muy suave */
  border: 1px solid #fecaca !important;
  color: #dc2626 !important; /* Rojo intenso */
  font-weight: 800 !important;
  font-size: 0.8rem !important;
  padding: 0.5rem 1rem !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.btn-exit:hover {
  background: #dc2626 !important; /* Inversión de colores */
  color: white !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}
</style>