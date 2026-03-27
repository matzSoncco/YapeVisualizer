<template>
  <div class="selector-container">
    <div class="selector-content">
      <header class="selector-header">
        <h1 class="selector-title">¿Dónde estás trabajando hoy?</h1>
        <p class="selector-subtitle">Selecciona tu sucursal para continuar</p>
      </header>

      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Cargando sucursales...</p>
      </div>

      <div v-else class="branches-grid">
        <div
          v-for="tienda in sucursales"
          :key="tienda.id"
          class="branch-card"
          @click="handleSelect(tienda.nombre)"
        >
          <span class="branch-emoji">{{ tienda.icono }}</span>
          <span class="branch-name">{{ tienda.nombre }}</span>
          <i class="pi pi-chevron-right arrow-icon"></i>
        </div>

        <div class="branch-card admin-card" @click="handleSelect('ADMIN')">
          <i class="pi pi-shield branch-emoji" style="font-size: 1.25rem"></i>
          <span class="branch-name">Panel administrador</span>
          <i class="pi pi-chevron-right arrow-icon"></i>
        </div>

        <p v-if="sucursales.length === 0" class="empty-message">
          No hay sucursales registradas. Ingresa como administrador para crear una.
        </p>
      </div>
    </div>

    <Dialog
      v-model:visible="showPinModal"
      modal
      header="Validación de seguridad"
      class="custom-pin-dialog"
      :style="{ width: '400px' }"
      :draggable="false"
    >
      <div class="pin-modal-content">
        <p class="pin-instructions">Ingresa tu PIN de administrador</p>
        <div class="pin-input-wrapper">
          <InputOtp v-model="pin" integerOnly :length="4" mask />
        </div>
        <div class="pin-actions">
          <Button label="Cancelar" severity="secondary" text @click="showPinModal = false" />
          <Button
            label="Acceder"
            :loading="loadingPin"
            :disabled="pin.length < 4"
            @click="verificarPin"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSucursal } from '../../composables/admin/useSucursal'
import { useToast } from 'primevue/usetoast'
import { setAdminAuth, store } from '@/store'

const router = useRouter()
const toast = useToast()
const { sucursales, seleccionar, loading } = useSucursal()

const showPinModal = ref(false)
const pin = ref('')
const loadingPin = ref(false)

const handleSelect = (valorSeleccionado) => {
  if (valorSeleccionado === 'ADMIN') {
    pin.value = ''
    showPinModal.value = true
    return
  }

  const tienda = sucursales.value.find((s) => s.nombre === valorSeleccionado)
  if (tienda) seleccionar(tienda.id)
}

const verificarPin = async () => {
  if (pin.value.length < 4) return

  loadingPin.value = true

  if (pin.value === String(store.userProfile.adminPin)) {
    setAdminAuth(true)
    seleccionar('ADMIN')
    showPinModal.value = false
    toast.add({ severity: 'success', summary: 'Acceso concedido', life: 2000 })
    router.push({ name: 'admin' })
  } else {
    toast.add({
      severity: 'error',
      summary: 'PIN incorrecto',
      detail: 'Verifica e intenta de nuevo',
      life: 3000,
    })
    pin.value = ''
  }

  loadingPin.value = false
}
</script>

<style scoped>
/* ── Contenedor ───────────────────────────────────────────── */
.selector-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  padding: 1.5rem;
}

.selector-content {
  width: 100%;
  max-width: 500px;
}

/* ── Header ───────────────────────────────────────────────── */
.selector-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.selector-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
}

.selector-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* ── Grid de sucursales ───────────────────────────────────── */
.branches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
  padding: 0.25rem;
}

.branches-grid::-webkit-scrollbar {
  width: 4px;
}
.branches-grid::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

/* ── Cards ────────────────────────────────────────────────── */
.branch-card {
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    transform 0.2s;
}

.branch-card:hover {
  border-color: var(--color-primary);
  transform: translateX(4px);
}

.branch-emoji {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.branch-name {
  flex: 1;
  font-weight: 700;
  color: var(--color-text-main);
}

.arrow-icon {
  font-size: 0.8rem;
  color: var(--color-border);
  transition: color 0.2s;
}

.branch-card:hover .arrow-icon {
  color: var(--color-primary);
}

/* ── Variante admin ───────────────────────────────────────── */
.admin-card {
  background: var(--color-primary);
  border-color: var(--color-primary);
  margin-top: 0.5rem;
}

.admin-card .branch-name,
.admin-card .branch-emoji {
  color: var(--color-accent);
}

.admin-card .arrow-icon {
  color: var(--color-accent);
  opacity: 0.6;
}

.admin-card:hover {
  border-color: var(--color-accent);
  transform: translateX(4px);
}

.admin-card:hover .arrow-icon {
  color: var(--color-accent);
  opacity: 1;
}

/* ── Estado vacío y carga ─────────────────────────────────── */
.empty-message {
  grid-column: 1 / -1;
  margin: 0;
  padding: 1rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: center;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.loading-state i {
  display: block;
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--color-accent);
}

/* ── Modal PIN ────────────────────────────────────────────── */
:deep(.custom-pin-dialog) {
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

:deep(.custom-pin-dialog .p-dialog-header) {
  background: var(--bg-surface);
  padding: 1.5rem 1.5rem 0.5rem;
  color: var(--color-primary);
  font-weight: 800;
  font-size: 1rem;
}

.pin-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
  padding: 0.5rem 0 0.5rem;
}

.pin-instructions {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

:deep(.p-inputotp) {
  gap: 0.75rem;
}

:deep(.p-inputotp-input) {
  width: 3.5rem;
  height: 4.5rem;
  font-size: 2rem;
  font-weight: 900;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--color-primary);
  transition:
    border-color 0.2s,
    transform 0.2s;
}

:deep(.p-inputotp-input:focus) {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 4px var(--color-accent-soft);
  transform: translateY(-2px);
}

.pin-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.pin-actions .p-button {
  flex: 1;
  height: 48px;
  border-radius: var(--radius-md);
  font-weight: 800;
}

:deep(.pin-actions .p-button:not(.p-button-secondary)) {
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
}

:deep(.pin-actions .p-button-secondary) {
  color: var(--color-text-muted);
}
</style>
