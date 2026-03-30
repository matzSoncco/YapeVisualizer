<template>
  <div class="profile-card business-card">

    <div class="card-header">
      <div class="card-header-title">
        <i class="pi pi-shop" />
        <h3>Datos del Negocio</h3>
      </div>
    </div>

    <div class="business-body">

      <!-- Logo -->
      <div class="logo-section">
        <div class="logo-preview" :class="{ 'has-logo': store.negocio.logoUrl }">
          <img v-if="store.negocio.logoUrl" :src="store.negocio.logoUrl" class="logo-img" alt="Logo del negocio" />
          <div v-else class="logo-placeholder">
            <i class="pi pi-image" />
            <span>Sin logo</span>
          </div>
        </div>

        <div class="logo-meta">
          <p class="logo-hint">JPG, PNG o WebP. Máx 2MB.</p>
          <label for="logo-upload" class="btn-upload">
            <i class="pi pi-upload" />
            {{ store.negocio.logoUrl ? 'Cambiar logo' : 'Subir logo' }}
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            class="input-hidden"
            @change="onLogoUpload"
          />
        </div>
      </div>

      <div class="business-divider" />

      <!-- Campos -->
      <div class="fields-block">
        <div v-if="negocio.sunatDisponible" class="field">
          <label class="field-label" for="field-ruc">RUC</label>
          <div class="field-ruc-row">
            <InputText
              id="field-ruc"
              v-model="form.ruc"
              maxlength="11"
              placeholder="20xxxxxxxxx"
              class="field-input"
            />
            <button
              class="btn-ruc"
              :disabled="negocio.loadingRuc.value"
              @click="handleRuc"
            >
              <i :class="negocio.loadingRuc.value ? 'pi pi-spinner pi-spin' : 'pi pi-search'" />
            </button>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="field-nombre">Nombre del negocio</label>
          <InputText
            id="field-nombre"
            v-model="form.nombre"
            placeholder="Ej. Pollería El Gordo"
            class="field-input"
          />
        </div>
      </div>

      <!-- Acción -->
      <div class="business-footer">
        <button
          class="btn-save"
          :class="{ 'is-loading': negocio.loading.value }"
          :disabled="negocio.loading.value"
          @click="save"
        >
          <i :class="negocio.loading.value ? 'pi pi-spinner pi-spin' : 'pi pi-check'" />
          {{ negocio.loading.value ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import InputText from 'primevue/inputtext'
import { useNegocio } from '@/composables/core/useNegocio'
import { store } from '@/store'
import { useToast } from 'primevue/usetoast'

const negocio = useNegocio()
const toast   = useToast()

const form = reactive({
  ruc:    store.negocio.ruc    || '',
  nombre: store.negocio.nombre || '',
})

const handleRuc = async () => {
  const nombre = await negocio.buscarRuc(form.ruc)
  if (nombre) form.nombre = nombre
}

const onLogoUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    await negocio.subirLogo(file)
    toast.add({ severity: 'success', summary: 'Logo actualizado', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message })
  }
}

const save = async () => {
  try {
    await negocio.guardarNegocio({ ...form, logoUrl: store.negocio.logoUrl })
    toast.add({ severity: 'success', summary: 'Guardado', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message })
  }
}
</script>

<style scoped>
.business-card {
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-flat);
  overflow: hidden;
}
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
}

.card-header-title i {
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.card-header-title h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-main);
}

/* -- Body -- */
.business-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* -- Logo section -- */
.logo-section {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.logo-preview {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  border: 1.5px dashed var(--color-border);
  background: var(--bg-surface-alt);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.logo-preview.has-logo {
  border-style: solid;
  border-color: var(--color-border);
}

.logo-preview:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.logo-placeholder i {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.logo-placeholder span {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.logo-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.logo-hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.input-hidden {
  display: none;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  user-select: none;
  width: fit-content;
}

.btn-upload:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-upload i { font-size: 0.8rem; }

/* -- Divider -- */
.business-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0;
}

/* -- Fields -- */
.fields-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Sobreescribimos PrimeVue InputText */
:deep(.field-input.p-inputtext) {
  width: 100%;
  min-width: 0;
  height: 38px;
  font-size: 0.875rem;
  border-color: var(--color-border);
  border-radius: var(--radius-md);
  background: var(--bg-surface-alt);
  color: var(--color-text-main);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.field-input.p-inputtext:hover) {
  border-color: var(--color-primary-mid);
}

:deep(.field-input.p-inputtext:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
  background: var(--bg-input-focus);
}

/* -- RUC row -- */
.field-ruc-row {
  display: flex;
  gap: 0.5rem;
}

.field-ruc-row :deep(.field-input.p-inputtext) {
  flex: 1;
  min-width: 0;
}

.btn-ruc {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ruc:hover:not(:disabled) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-accent);
}

.btn-ruc:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* -- Footer / Guardar -- */
.business-footer {
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.25rem;
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease, opacity 0.2s ease;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-save:disabled,
.btn-save.is-loading {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-save i { font-size: 0.85rem; }
</style>