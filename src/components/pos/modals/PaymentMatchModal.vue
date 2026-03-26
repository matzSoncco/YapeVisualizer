<template>
  <Dialog
    v-model:visible="matcherState.showModal"
    modal
    :showHeader="false"
    appendTo="body"
    :style="{ width: '380px', border: 'none' }"
    :closable="false"
    class="payment-match-dialog"
  >
    <div class="match-container">
      <header class="match-header">
        <div class="success-icon-wrapper">
          <i class="pi pi-check"></i>
          <div class="pulse-ring"></div>
        </div>
        <div class="match-title-group">
          <h3>¡Pago Detectado!</h3>
          <span class="match-tag" :class="matcherState.candidate?.wallet?.toLowerCase()">
            <i class="pi pi-qrcode"></i>
          </span>
        </div>
      </header>

      <div class="match-data-card">
        <div class="data-item">
          <span class="data-label">EMISOR</span>
          <span class="data-value name">{{
            matcherState.candidate?.senderName || 'Usuario Desconocido'
          }}</span>
        </div>

        <div class="data-divider"></div>

        <div class="data-item">
          <span class="data-label">MONTO RECIBIDO</span>
          <span class="data-value amount">
            S/ {{ Number(matcherState.candidate?.amount).toFixed(2) }}
          </span>
        </div>
      </div>

      <footer class="match-actions">
        <Button
          label="DESCARTAR"
          text
          @click="$emit('descartar-pago')"
          class="btn-discard"
          :disabled="matcherState.loading"
        />
        <Button
          label="CONFIRMAR VENTA"
          @click="$emit('confirmar-vinculo')"
          :loading="matcherState.loading"
          class="btn-confirm-match"
        />
      </footer>
    </div>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useMatcher } from '@/composables/operations/useMatcher'

const { matcherState } = useMatcher()

/**
 * Emits para confirmar o cancelar el proceso de vinculación manual
 */
defineEmits(['confirmar-vinculo', 'descartar-pago'])
</script>

<style scoped>
/* Reset profundo de PrimeVue Dialog */
:deep(.p-dialog-content) {
  padding: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: none;
  background: var(--bg-app);
}

.match-container {
  padding: 1.5rem 1rem 1rem 1rem;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
}

/* Encabezado y Animación de Éxito */
.match-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.success-icon-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
  background: var(--color-success);
  color: var(--bg-app);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  z-index: 2;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse-ring-geo 2s infinite;
  z-index: 1;
}

@keyframes pulse-ring-geo {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}

.match-title-group h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-primary);
  letter-spacing: -0.03em;
}

/* Tags de Billeteras dinámicos */
.match-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-top: 0.5rem;
  background: var(--bg-surface-alt);
  color: var(--color-text-muted);
}

.match-tag.yape {
  background: var(--color-yape-soft);
  color: var(--color-yape);
}

.match-tag.plin {
  background: var(--color-plin-soft);
  color: var(--color-plin);
}

/* Card de Información del Pago */
.match-data-card {
  width: 100%;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border: 1px solid var(--color-border);
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.data-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
}

.data-value.name {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text-main);
  text-transform: capitalize;
}

.data-value.amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--color-success);
}

.data-divider {
  height: 1px;
  background: var(--color-border);
  width: 40%;
  margin: 0 auto;
}

/* Acciones */
.match-actions {
  display: flex;
  width: 100%;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

:deep(.btn-discard.p-button) {
  flex: 1;
  color: var(--color-text-muted);
  font-weight: 700;
  font-size: 0.85rem;
}

:deep(.btn-confirm-match.p-button) {
  flex: 2;
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  height: 54px;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

:deep(.btn-confirm-match.p-button:hover) {
  background: var(--color-primary-mid);
  box-shadow: var(--shadow-interactive);
}

/* Reset de focus global para el modal */
:deep(.p-button:focus) {
  box-shadow: none;
  outline: none;
}
</style>