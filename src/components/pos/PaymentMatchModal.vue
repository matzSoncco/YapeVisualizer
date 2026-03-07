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
            <i
              :class="
                matcherState.candidate?.wallet === 'PLIN' ? 'pi pi-star-fill' : 'pi pi-wallet'
              "
            ></i>
            {{ matcherState.candidate?.wallet || 'Digital' }}
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
          <span class="data-value amount"
            >S/ {{ Number(matcherState.candidate?.amount).toFixed(2) }}</span
          >
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
          icon="pi pi-bolt"
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
import { useMatcher } from '@/composables/useMatcher'

const { matcherState } = useMatcher()

/**
 * Emits para confirmar o cancelar el proceso de vinculación manual
 */
defineEmits(['confirmar-vinculo', 'descartar-pago'])
</script>

<style scoped>
/* Reset de PrimeVue */
:deep(.p-dialog-content) {
  padding: 0 !important;
  border-radius: 32px !important;
  overflow: hidden;
  border: none !important;
}

.match-container {
  padding: 1.5rem 0.5rem 0.5rem 0.5rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

/* Animación de Pulso */
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
  background: #22c55e;
  color: white;
  border-radius: 100%;
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
  border-radius: 100%;
  background: #22c55e;
  animation: pulse-ring-geo 2s infinite;
  z-index: 1;
}

@keyframes pulse-ring-geo {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}

.match-title-group h3 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
}

/* Tags de Billeteras */
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
  background: #f1f5f9;
  color: #64748b;
}

.match-tag.yape { background: #7b2e9120; color: #7b2e91; }
.match-tag.plin { background: #00d1ce20; color: #00b5b2; }

/* Card de Datos */
.match-data-card {
  width: 100%;
  background: #f8fafc;
  border-radius: 24px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border: 1px solid #f1f5f9;
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
  color: #94a3b8;
  letter-spacing: 0.1em;
}

.data-value.name {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  text-transform: capitalize;
}

.data-value.amount {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 2.25rem;
  font-weight: 900;
  color: #10b981;
}

.data-divider {
  height: 1px;
  background: #e2e8f0;
  width: 60%;
  margin: 0 auto;
}

/* Botones */
.match-actions {
  display: flex;
  width: 100%;
  gap: 1rem;
}

.btn-discard {
  flex: 1;
  color: #94a3b8 !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
}

.btn-confirm-match {
  flex: 2;
  background: #0f172a !important;
  border: none !important;
  height: 56px !important;
  border-radius: 18px !important;
  font-weight: 800 !important;
  font-size: 1rem !important;
  box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3) !important;
}

:deep(*:focus) {
  outline: none !important;
  box-shadow: none !important;
}
</style>