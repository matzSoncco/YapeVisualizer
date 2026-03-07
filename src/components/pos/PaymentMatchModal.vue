<template>
  <Dialog
    v-model:visible="matcherState.showModal"
    modal
    header="Validación de Pago"
    :style="{ width: '400px' }"
    :closable="false"
    class="custom-confirm-dialog"
  >
    <div class="confirm-body">
      <header class="confirm-status">
        <i class="pi pi-check-circle pulse-green"></i>
        <h3>¡Pago Detectado!</h3>
        <span class="match-tag">
          {{
            matcherState.matchType === 'AUTO'
              ? 'Automático'
              : matcherState.matchType === 'DIRECT'
                ? 'Venta Rápida'
                : 'Manual'
          }}
        </span>
      </header>

      <div class="confirm-data-card">
        <div class="data-row">
          <span class="lbl">Cliente:</span>
          <span class="val">{{ matcherState.candidate?.senderName }}</span>
        </div>
        <div class="data-row total-row">
          <span class="lbl">Monto:</span>
          <span class="val-amount">S/ {{ Number(matcherState.candidate?.amount).toFixed(2) }}</span>
        </div>
      </div>

      <div class="confirm-btns">
        <Button
          label="DESCARTAR"
          severity="secondary"
          text
          @click="$emit('descartar-pago')"
          class="flex-1"
        />
        <Button
          label="CONFIRMAR VENTA"
          @click="$emit('confirmar-vinculo')"
          icon="pi pi-bolt"
          :loading="matcherState.loading"
          :disabled="matcherState.loading"
          class="flex-1 btn-confirm-digital-payment"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useMatcher } from '@/composables/useMatcher'

const { matcherState } = useMatcher()

/**
 * Emits para confirmar o cancelar el proceso de vinculación manual
 */
defineEmits(['confirmar-vinculo', 'descartar-pago'])
</script>

<style scoped>
.confirm-body {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.confirm-status {
  text-align: center;
}

.confirm-status i {
  font-size: 3.5rem;
  color: #22c55e;
  margin-bottom: 0.5rem;
  display: block;
}

.confirm-status h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary);
}

.match-tag {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  background: var(--color-accent-soft);
  color: #854d0e;
  padding: 2px 10px;
  border-radius: 100px;
}

.confirm-data-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.data-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.total-row {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border);
}

.lbl {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
.val {
  font-weight: 700;
  color: var(--color-primary);
}
.val-amount {
  font-weight: 900;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.confirm-btns {
  display: flex;
  gap: 1rem;
}

.btn-confirm-digital-payment {
  background: var(--color-primary) !important;
  color: var(--color-accent) !important;
  border: none !important;
  font-weight: 800 !important;
}

.pulse-green {
  animation: pulse-border 2s infinite;
  border-radius: 50%;
}

@keyframes pulse-border {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.flex-1 {
  flex: 1;
}
</style>
