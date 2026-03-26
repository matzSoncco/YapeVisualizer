<template>
  <header class="pos-navbar">
    <div class="navbar-left">
      <div class="brand-badge">
        <i class="pi pi-shop"></i>
      </div>
      <div class="brand-info">
        
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
          text
          class="nav-btn"
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
.pos-navbar {
  height: 65px;
  background: var(--bg-app);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Efecto Glassmorphism (Usa variable para el rgba) */
@supports (backdrop-filter: blur(1px)) {
  .pos-navbar {
    background: var(--bg-glass, rgba(255, 255, 255, 0.7));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

/* Identidad Izquierda */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-badge {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: var(--color-accent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.location-context {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2px;
}

.location-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
}

.context-divider {
  color: var(--color-border);
  font-size: 0.75rem;
}

.cashier-tag {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-surface-alt);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.cashier-name {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-primary-mid);
  text-transform: capitalize;
}

/* Lado Derecho y Navegación */
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

.nav-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
}

/* Botones de Navegación con :deep */
:deep(.nav-btn.p-button) {
  color: var(--color-primary-mid);
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

:deep(.nav-btn.p-button:hover) {
  background: var(--bg-surface-alt);
  color: var(--color-primary);
}

/* Botón de Gasto con Hover sutil de error */
:deep(.nav-btn.expense:hover) {
  color: var(--color-error);
  background: var(--color-error-soft);
}

/* Botón Finalizar Turno (Sin !important) */
:deep(.btn-exit.p-button) {
  background: var(--color-error-soft);
  border: 1px solid var(--color-error-border);
  color: var(--color-error-dark);
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

:deep(.btn-exit.p-button:hover) {
  background: var(--color-error-dark);
  color: var(--bg-app); /* Reemplaza white por el fondo de la app */
  border-color: var(--color-error-dark);
  box-shadow: var(--shadow-interactive);
}
</style>