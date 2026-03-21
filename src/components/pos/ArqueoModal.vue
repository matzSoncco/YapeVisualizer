<template>
  <Dialog
    v-model:visible="arqueoState.isOpen"
    modal
    append-to="body"
    :showHeader="false"
    :style="{ width: '420px', border: 'none' }"
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
      header: 'Confirmación de Caja',
      message:
        'Has declarado S/ 0.00 en efectivo. ¿Confirmas que no hubo ingresos físicos en este turno?',
      icon: 'pi pi-exclamation-circle',
      rejectLabel: 'REVISAR',
      acceptLabel: 'CONFIRMAR CIERRE EN CERO',
      acceptClass: 'p-button-danger p-button-sm', // Clase de PrimeVue
      rejectClass: 'p-button-secondary p-button-text p-button-sm',
      accept: () => ejecutarCierre(),
    })
  } else {
    await ejecutarCierre()
  }
}
</script>

<style scoped>
/* Limpieza de contenedores de PrimeVue */
:deep(.p-dialog-content) {
  padding: 0 !important;
  border-radius: 28px !important;
  overflow: hidden;
}

.arqueo-wrapper {
  padding: 1.5rem 1rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  gap: 0.5rem;
}

/* Hero Section */
.arqueo-hero {
  text-align: center;
}

.arqueo-badge {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
  color: #0f172a;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem auto;
  font-size: 1.75rem;
  box-shadow: 0 8px 20px rgba(234, 179, 8, 0.3);
  transform: rotate(-5deg); /* Un toque de diseño moderno */
}

.arqueo-hero h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.arqueo-hero p {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.5rem;
  line-height: 1.5;
  padding: 0 1rem;
}

/* El Visor "Dark Mode" */
.arqueo-display {
  background: #0f172a;
  border-radius: 24px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 4px solid #1e293b;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    inset 0 4px 12px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

/* Efecto de brillo de pantalla */
.arqueo-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
  pointer-events: none;
}

.display-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.15em;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.display-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.display-currency {
  color: #facc15;
  font-size: 2rem;
  font-weight: 900;
  opacity: 0.9;
}

/* Input Minimalista pero Gigante */
:deep(.display-input-raw) {
  font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace !important;
  font-size: 3rem !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  text-align: center !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  width: 100% !important;
  padding: 0 !important;
}

/* Footer de información */
.arqueo-footer-info {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
}

.arqueo-footer-info i {
  color: #ef4444; /* Rojo para denotar irreversibilidad */
  font-size: 1.1rem;
  margin-top: 2px;
}

.arqueo-footer-info span {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 500;
  line-height: 1.4;
}

/* Botones */
.arqueo-btns {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-back {
  flex: 1;
  font-weight: 700 !important;
  color: #94a3b8 !important;
  letter-spacing: 0.02em;
}

.btn-submit-arqueo {
  flex: 2;
  background: #0f172a !important;
  border: none !important;
  font-weight: 800 !important;
  height: 56px !important;
  border-radius: 18px !important;
  color: #ffffff !important;
  font-size: 0.95rem !important;
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.3) !important;
  transition: all 0.2s ease !important;
}

.btn-submit-arqueo:not(:disabled):hover {
  background: #1e293b !important;
  transform: translateY(-2px);
  box-shadow: 0 15px 20px -5px rgba(15, 23, 42, 0.4) !important;
}

.btn-submit-arqueo:not(:disabled):active {
  transform: translateY(0);
}
</style>
