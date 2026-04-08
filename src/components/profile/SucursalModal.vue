<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'"
    modal
    class="custom-sucursal-dialog"
    :style="{ width: '450px' }"
    :draggable="false"
  >
    <div class="modal-form-content">
      <div class="form-group">
        <label for="nombre" class="field-label">Nombre de la Sede</label>
        <InputText
          id="nombre"
          v-model="form.nombre"
          placeholder="Ej. Sede Yanahuara"
          autofocus
          class="custom-input"
        />
      </div>

      <div class="form-group">
        <label for="icono" class="field-label">Icono (Emoji)</label>
        <InputText
          id="icono"
          v-model="form.icono"
          placeholder="Ej. 🏪"
          class="custom-input icon-input"
        />
      </div>

      <div class="form-group">
        <label for="direccion" class="field-label">Dirección</label>
        <InputText
          id="direccion"
          v-model="form.direccion"
          placeholder="Ej. Av. Ejército 123"
          class="custom-input"
        />
      </div>

      <div class="form-group">
        <label for="telefono" class="field-label">Teléfono</label>
        <InputText
          id="telefono"
          v-model="form.telefono"
          placeholder="Ej. 958..."
          class="custom-input"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="serie" class="field-label">Serie (Ticket)</label>
          <InputText
            id="serie"
            v-model="form.serie"
            placeholder="NV01"
            class="custom-input uppercase-input"
          />
        </div>
        <div class="form-group">
          <label for="corr" class="field-label">Correlativo Inicial</label>
          <InputNumber
            id="corr"
            v-model="form.proximoCorrelativo"
            :min="1"
            class="custom-input-number"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          text
          @click="visible = false"
          class="btn-cancel"
        />
        <Button
          label="Guardar"
          :icon="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
          @click="handleSave"
          :disabled="!form.nombre || saving"
          class="btn-save"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useSucursal } from '@/composables/admin/useSucursal'
import { useToast } from 'primevue/usetoast'

// Importaciones de PrimeVue (por si no son globales)
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const { addSucursal, updateSucursal } = useSucursal()
const toast = useToast()

const visible = ref(false)
const isEditing = ref(false)
const saving = ref(false)

const form = reactive({
  id: null,
  nombre: '',
  icono: '',
  direccion: '',
  telefono: '',
  serie: 'NV01',
  proximoCorrelativo: 1,
})

const handleSave = async () => {
  if (!form.nombre.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'El nombre es obligatorio',
      life: 3000,
    })
    return
  }

  if (saving.value) return
  saving.value = true

  try {
    if (isEditing.value) {
      await updateSucursal(form.id, form)
      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Sucursal actualizada correctamente',
        life: 3000,
      })
    } else {
      await addSucursal(form)
      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Sucursal creada correctamente',
        life: 3000,
      })
    }
    visible.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}

const open = (data = null) => {
  if (data) {
    isEditing.value = true
    Object.assign(form, data)
  } else {
    isEditing.value = false
    Object.assign(form, {
      id: null,
      nombre: '',
      icono: '',
      direccion: '',
      telefono: '',
      serie: 'NV001',
      proximoCorrelativo: 1,
    })
  }
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped>
/* ── CONTENEDOR PRINCIPAL ── */
.modal-form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

/* ── LAYOUT DE CAMPOS ── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── ETIQUETAS (LABELS) ── */
.field-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

/* ── INPUTS GENÉRICOS ── */
.custom-input,
:deep(.custom-input-number .p-inputtext) {
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--bg-surface-alt);
  color: var(--color-text-main);
  transition: all 0.2s ease;
}

.custom-input:hover,
:deep(.custom-input-number .p-inputtext:hover) {
  border-color: var(--color-primary-mid);
}

.custom-input:focus,
:deep(.custom-input-number .p-inputtext:focus) {
  border-color: var(--color-primary);
  background: var(--bg-input-focus);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
  outline: none;
}

/* Modificadores específicos */
.icon-input {
  font-size: 1.2rem;
}

.uppercase-input {
  text-transform: uppercase;
  font-family: monospace;
  font-weight: 600;
  letter-spacing: 1px;
}

/* ── ACCIONES (FOOTER) ── */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
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
</style>
