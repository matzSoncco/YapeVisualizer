<template>
  <Card class="profile-card security-card" :class="{ 'highlight-focus': isDefault }">
    <template #header>
      <div class="card-header">
        <div class="card-header-title">
          <i class="pi pi-shield" />
          <h3>Seguridad</h3>
        </div>
        <div class="security-status-dot" :class="isDefault ? 'dot-warn' : 'dot-ok'" />
      </div>
    </template>

    <template #content>
      <div class="security-body">
        <p class="security-description">Control de acceso administrativo</p>

        <div class="pin-status-row">
          <div class="pin-info">
            <span class="pin-label">PIN de administrador</span>
            <span class="pin-dots">● ● ● ●</span>
          </div>
          <Tag
            :value="isDefault ? 'Inseguro' : 'Seguro'"
            :severity="isDefault ? 'danger' : 'success'"
            rounded
            class="pin-tag"
          />
        </div>

        <Transition name="fade-slide">
          <div v-if="isDefault" class="pin-warning-box">
            <i class="pi pi-exclamation-triangle" />
            <span>Estás usando el PIN por defecto <strong>(1234)</strong>. Cámbialo para proteger el acceso.</span>
          </div>
        </Transition>

        <Button
          label="Cambiar PIN"
          icon="pi pi-key"
          severity="secondary"
          outlined
          class="w-full change-pin-btn"
          @click="$emit('change-pin')"
        />
      </div>
    </template>
  </Card>
</template>

<script setup>
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Card from 'primevue/card'

defineProps({
  isDefault: {
    type: Boolean,
    default: false
  }
})

defineEmits(['change-pin'])
</script>

<style scoped>
/* -- Header -- */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-main);
}

.card-header-title i {
  color: var(--color-primary);
  font-size: 1rem;
}

.card-header-title h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
}

/* -- Dot indicador de estado -- */
.security-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-ok   { background: var(--color-success); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
.dot-warn { background: var(--color-warning); box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); animation: pulse-dot 2s infinite; }

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
  50%       { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.05); }
}

/* -- Body -- */
.security-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.25rem 0;
}

.security-description {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* -- PIN status row -- */
.pin-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-surface-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.pin-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.pin-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.pin-dots {
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  color: var(--color-primary);
  font-weight: 700;
}

/* -- Warning box -- */
.pin-warning-box {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: var(--color-error-soft);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  font-size: 0.78rem;
  color: var(--color-error-dark);
  line-height: 1.45;
}

.pin-warning-box i {
  font-size: 0.9rem;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--color-error);
}

/* -- Botón -- */
:deep(.change-pin-btn) {
  font-size: 0.85rem;
  font-weight: 700;
  border-color: var(--color-border) !important;
  color: var(--color-primary) !important;
  transition: all 0.2s ease;
}

:deep(.change-pin-btn:hover) {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-accent) !important;
}

/* -- Transición del warning -- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>