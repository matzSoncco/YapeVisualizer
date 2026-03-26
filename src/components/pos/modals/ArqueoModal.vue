<template>
  <Dialog
    v-model:visible="arqueoState.isOpen"
    modal
    append-to="body"
    :showHeader="false"
    :style="{ width: '400px', border: 'none' }"
    class="arqueo-dialog"
    :closable="!arqueoState.loading"
  >
    <div class="arqueo-wrapper">
      <header class="arqueo-hero">
        <div class="arqueo-badge">
          <i class="pi pi-lock"></i>
        </div>
        <h3 class="arqueo-title">Cierre de Auditoría</h3>
        <p class="arqueo-description">
          Verifica el efectivo físico en caja y decláralo para finalizar el turno.
        </p>
      </header>

      <div class="arqueo-display">
        <span class="display-label">EFECTIVO FÍSICO</span>
        <div class="display-input-group">
          <span class="display-currency">S/</span>
          <InputNumber
            v-model="arqueoState.monto"
            mode="decimal"
            :minFractionDigits="2"
            placeholder="0.00"
            class="display-input-comp"
            inputClass="display-input-raw"
            :disabled="arqueoState.loading"
            autofocus
            @keyup.enter="confirmarCierreUI"
          />
        </div>
      </div>

      <div class="arqueo-info-banner">
        <i class="pi pi-info-circle"></i>
        <span>Este proceso es irreversible y cerrará tu sesión actual.</span>
      </div>

      <footer class="arqueo-btns">
        <Button
          label="VOLVER"
          text
          @click="arqueoState.isOpen = false"
          :disabled="arqueoState.loading"
          class="btn-back"
        />
        <Button
          label="FINALIZAR TURNO"
          @click="confirmarCierreUI"
          :loading="arqueoState.loading"
          :disabled="arqueoState.monto === null"
          class="btn-submit-arqueo"
        />
      </footer>
    </div>
  </Dialog>

  <ConfirmDialog group="mini" class="mini-confirm">
    <template #message="slotProps">
      <div class="mini-confirm-body">
        <i :class="slotProps.message.icon"></i>
        <p>{{ slotProps.message.message }}</p>
      </div>
    </template>
  </ConfirmDialog>
</template>

<script setup>
import { useShift } from '@/composables/operations/useShift'
import { useDigitalPayments } from '@/composables/operations/useDigitalPayments'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const { arqueoState, cerrarTurno } = useShift()
const { detenerTodo } = useDigitalPayments()

/**
 * Método para registrar el cierre, arqueo y finalización del turno
 */
const ejecutarCierre = async () => {
  try {
    await cerrarTurno()
    detenerTodo()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error al cerrar',
      detail: e.message,
      life: 5000,
    })
  }
}

const confirmarCierreUI = async () => {
  if (arqueoState.monto === null || arqueoState.monto === undefined) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debes ingresar un monto.' })
    return
  }

  if (Number(arqueoState.monto) === 0) {
    confirm.require({
      group: 'mini',
      header: 'Caja en cero',
      message: '¿Confirmas que no hay efectivo físico?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'SÍ, CERRAR',
      rejectLabel: 'REVISAR',
      acceptClass: 'btn-mini-accept', 
      rejectClass: 'btn-mini-reject',
      accept: () => ejecutarCierre(),
    })
  } else {
    await ejecutarCierre()
  }
}
</script>

<style scoped>
/* =========================================
   1. DIÁLOGO PRINCIPAL (ARQUEO)
========================================= */
:deep(.p-dialog-content) {
  padding: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-app);
  border: none;
}

.arqueo-wrapper {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Cabecera / Hero */
.arqueo-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.arqueo-badge {
  width: 48px;
  height: 48px;
  background: var(--color-accent);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: var(--shadow-interactive);
}

.arqueo-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.arqueo-description {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.4;
  font-weight: 500;
  padding: 0 1rem;
}

/* Visor de Monto */
.arqueo-display {
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--color-primary-mid);
  box-shadow: var(--shadow-card);
}

.display-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
  opacity: 0.7;
}

.display-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
}

.display-currency {
  color: var(--color-accent);
  font-size: 1.5rem;
  font-weight: 900;
}

/* InputNumber de PrimeVue (Limpieza visual) */
:deep(.p-inputnumber.display-input-comp) {
  width: auto;
}

:deep(.display-input-raw.p-inputtext) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--bg-app);
  text-align: center;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  outline: none;
  width: 100%;
}

:deep(.display-input-raw.p-inputtext:focus) {
  border: none;
  box-shadow: none;
  outline: none;
}

/* Banner de Información */
.arqueo-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--bg-surface);
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.arqueo-info-banner i {
  color: var(--color-error);
  font-size: 1rem;
  margin-top: 2px;
}

.arqueo-info-banner span {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
  line-height: 1.4;
}

/* Botones principales */
.arqueo-btns {
  display: flex;
  gap: 0.75rem;
}

:deep(.btn-back.p-button) {
  flex: 1;
  font-weight: 700;
  color: var(--color-text-muted);
}

:deep(.btn-submit-arqueo.p-button) {
  flex: 2;
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  height: 50px;
  border-radius: var(--radius-md);
  font-weight: 800;
  transition: background-color 0.2s ease;
}

:deep(.btn-submit-arqueo.p-button:not(:disabled):hover) {
  background: var(--color-primary-mid);
}

/* =========================================
   2. CONFIRM DIALOG "MINI" (ESTRUCTURA)
========================================= */
:deep(.mini-confirm.p-dialog) {
  width: 320px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

:deep(.mini-confirm .p-dialog-header) {
  padding: 1.25rem 1.25rem 0.5rem 1.25rem;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-primary);
  border: none;
}

:deep(.mini-confirm .p-dialog-content) {
  padding: 0.5rem 1.25rem 1rem 1.25rem;
  background: var(--bg-app);
}

.mini-confirm-body {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mini-confirm-body i {
  font-size: 1.5rem;
  color: var(--color-warning);
}

.mini-confirm-body p {
  font-size: 0.85rem;
  color: var(--color-text-main);
  margin: 0;
  line-height: 1.4;
  font-weight: 600;
}

:deep(.mini-confirm .p-dialog-footer) {
  padding: 0 1.25rem 1.25rem 1.25rem;
  display: flex;
  gap: 0.5rem;
  border: none;
}
</style>

<style>
/* =========================================
   3. ESTILOS GLOBALES PARA BOTONES TELEPORTADOS
========================================= */
.mini-confirm .btn-mini-reject {
  background-color: var(--color-primary) !important;
  color: var(--color-accent) !important;
  border: none !important;
  flex: 1;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.6rem;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.mini-confirm .btn-mini-reject:hover {
  background-color: var(--color-primary-mid) !important;
  box-shadow: var(--shadow-interactive) !important;
}

.mini-confirm .btn-mini-accept {
  background-color: var(--bg-surface-alt) !important;
  color: var(--color-text-muted) !important;
  border: none !important;
  flex: 1;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.6rem;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.mini-confirm .btn-mini-accept:hover {
  background-color: var(--color-border) !important;
}

.mini-confirm .btn-mini-accept:focus,
.mini-confirm .btn-mini-reject:focus {
  box-shadow: none !important;
  outline: none !important;
}
</style>