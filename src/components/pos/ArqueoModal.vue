<template>
  <Dialog
    v-model:visible="arqueoState.isOpen"
    modal
    append-to="body"
    header="Finalizar Turno"
    :style="{ width: '420px' }"
    class="arqueo-dialog"
    :closable="!arqueoState.loading"
  >
    <div class="arqueo-wrapper">
      <div class="arqueo-hero">
        <div class="arqueo-badge">
          <i class="pi pi-verified"></i>
        </div>
        <h3>Cierre de Auditoría</h3>
        <p>Ingresa el efectivo total presente en caja para validar contra el sistema.</p>
      </div>

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
            @input="(e) => (arqueoState.monto = e.value)"
            @keyup.enter="confirmarCierreUI"
          />
        </div>
      </div>

      <div class="arqueo-footer-info">
        <i class="pi pi-info-circle"></i>
        <span>Este proceso es irreversible y cerrará tu sesión actual.</span>
      </div>

      <div class="arqueo-btns">
        <Button
          label="VOLVER"
          text
          @click="arqueoState.isOpen = false"
          :disabled="arqueoState.loading"
          class="btn-back"
        />
        <Button
          label="CONFIRMAR Y CERRAR"
          icon="pi pi-lock"
          @click="confirmarCierreUI"
          :loading="arqueoState.loading"
          :disabled="arqueoState.monto === null || arqueoState.monto === undefined"
          class="btn-submit-arqueo"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useShift } from '@/composables/useShift'
import { useDigitalPayments } from '@/composables/useDigitalPayments'
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
    toast.add({
      severity: 'success',
      summary: 'Turno Cerrado',
      detail: 'Arqueo registrado correctamente.',
      life: 3000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message,
      life: 5000,
    })
  }
}

/**
 * Validación previa al cierre
 */
const confirmarCierreUI = async () => {
  if (arqueoState.monto === null || arqueoState.monto === undefined) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debes ingresar un monto.' })
    return
  }

  if (Number(arqueoState.monto) === 0) {
    confirm.require({
      message: 'Ingresaste 0.00 en efectivo hoy. ¿Deseas declararlo y cerrar caja?',
      header: 'Advertencia',
      icon: 'pi pi-exclamation-triangle',
      accept: () => ejecutarCierre(),
    })
  } else {
    await ejecutarCierre()
  }
}
</script>

<style scoped>
.arqueo-dialog .p-dialog-header {
  display: none;
}

.arqueo-wrapper {
  padding: 1.5rem 0.5rem 0.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.arqueo-hero {
  text-align: center;
}

.arqueo-badge {
  width: 50px;
  height: 50px;
  background: #facc15;
  color: #0f172a;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
}

.arqueo-hero h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.arqueo-hero p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.arqueo-display {
  background: #0f172a;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #1e293b;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
}

.display-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.display-input-group {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.display-currency {
  color: #facc15;
  font-size: 1.75rem;
  font-weight: 900;
}

.display-input-comp .p-inputnumber-input {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.display-input-raw {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(2rem, 8vw, 3.5rem) !important;
  font-weight: 900 !important;
  color: #ffffff !important;
  text-align: left !important;
  width: 100% !important;
  min-width: 200px;
}

/* INFO FOOTER */
.arqueo-footer-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f1f5f9;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
}

.arqueo-footer-info i {
  color: #94a3b8;
  font-size: 1rem;
}

.arqueo-btns {
  display: flex;
  gap: 0.5rem;
}

.btn-back {
  flex: 1;
  font-weight: 700 !important;
  color: #64748b !important;
}

.btn-submit-arqueo {
  flex: 2;
  background: #0f172a !important;
  border: none !important;
  font-weight: 800 !important;
  height: 48px !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2) !important;
}
</style>
