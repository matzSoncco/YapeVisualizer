<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Actualizar PIN de Seguridad"
    class="custom-pin-dialog"
    :style="{ width: '380px' }"
    :draggable="false"
  >
    <div class="pin-form-content">
      <p class="pin-description">Ingresa tu PIN actual y define uno nuevo de 4 dígitos.</p>

      <div class="pin-field-group">
        <label class="field-label">PIN Actual</label>
        <div class="otp-container">
          <InputOtp v-model="pinForm.current" :length="4" mask />
        </div>
      </div>

      <div class="pin-field-group">
        <label class="field-label">Nuevo PIN</label>
        <div class="otp-container">
          <InputOtp v-model="pinForm.new" :length="4" mask />
        </div>
      </div>

      <div class="dialog-actions">
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="visible = false"
          class="btn-cancel"
        />
        <Button
          label="Guardar Nuevo PIN"
          @click="handlePinUpdate"
          :loading="loadingAuth"
          :disabled="pinForm.new.length < 4 || pinForm.current.length < 4"
          class="btn-save"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '@/composables/core/useAuth'
import { useToast } from 'primevue/usetoast'

// Asegúrate de importar los componentes de PrimeVue si no los tienes globales
import Dialog from 'primevue/dialog'
import InputOtp from 'primevue/inputotp'
import Button from 'primevue/button'

const { updateAdminPin, loading: loadingAuth } = useAuth()
const toast = useToast()

const visible = ref(false)
const pinForm = reactive({ current: '', new: '' })

const handlePinUpdate = async () => {
  if (pinForm.current === pinForm.new) {
    toast.add({
      severity: 'warn',
      summary: 'Sin cambios',
      detail: 'El nuevo PIN es igual al actual.',
      life: 3000,
    })
    return
  }

  try {
    await updateAdminPin(pinForm.current, pinForm.new)

    toast.add({
      severity: 'success',
      summary: 'Seguridad Actualizada',
      detail: 'Tu nuevo PIN ha sido guardado.',
      life: 2000,
    })

    visible.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error de Seguridad', detail: e.message, life: 5000 })
  }
}

const open = () => {
  pinForm.current = ''
  pinForm.new = ''
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped>
/* ── CONTENIDO DEL MODAL ── */
.pin-form-content {
  display: flex;
  flex-direction: column;
  padding-top: 0.5rem;
}

.pin-description {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
  text-align: center;
}

/* ── GRUPOS DE CAMPOS ── */
.pin-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  text-align: center;
}

/* ── CONTENEDOR OTP ── */
.otp-container {
  display: flex;
  justify-content: center;
}

/* ── MAGIA CSS PARA EL INPUT OTP DE PRIMEVUE ── */
:deep(.p-inputotp) {
  gap: 0.75rem; /* Separación entre los cuadritos */
}

:deep(.p-inputotp-input) {
  width: 3.5rem !important;
  height: 4rem !important;
  font-size: 1.75rem !important;
  font-weight: 900 !important;
  text-align: center;
  border: 2px solid var(--color-border) !important;
  border-radius: var(--radius-md) !important;
  background: var(--bg-surface-alt) !important;
  color: var(--color-text-main) !important;
  transition: all 0.2s ease !important;
}

/* Efecto Hover */
:deep(.p-inputotp-input:hover) {
  border-color: var(--color-primary-mid) !important;
}

/* Efecto Focus (Cuando el usuario está escribiendo) */
:deep(.p-inputotp-input:focus) {
  border-color: var(--color-primary) !important;
  background: var(--bg-input-focus) !important;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08) !important;
  outline: none !important;
  transform: translateY(-2px); /* Pequeño salto para indicar el foco actual */
}

/* ── ACCIONES (FOOTER) ── */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

/* Botón Guardar */
.btn-save {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-accent) !important;
  font-weight: 700 !important;
  padding: 0.6rem 1.25rem !important;
  border-radius: var(--radius-md) !important;
  transition: all 0.2s ease !important;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-hover) !important;
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

/* Botón Cancelar */
.btn-cancel {
  color: var(--color-text-muted) !important;
  font-weight: 600 !important;
}

.btn-cancel:hover {
  background: var(--color-error-soft) !important;
  color: var(--color-error-dark) !important;
}
</style>
