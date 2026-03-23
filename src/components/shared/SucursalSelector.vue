<template>
  <div class="selector-container">
    <div class="selector-content">
      <header class="selector-header">
        <div class="selector-icon">
          <i class="pi pi-map-marker"></i>
        </div>
        <h1 class="selector-title">¿Dónde estás trabajando hoy?</h1>
        <p class="selector-subtitle">Selecciona tu ubicación para filtrar las ventas</p>
      </header>

      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Cargando tiendas...</p>
      </div>

      <div v-else class="branches-wrapper">
        <div class="branches-grid">
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

          <div class="branch-card admin-variant" @click="handleSelect('ADMIN')">
            <span class="branch-name">PANEL ADMINISTRADOR</span>
            <i class="pi pi-shield arrow-icon"></i>
          </div>
        </div>

        <p v-if="sucursales.length === 0" class="empty-message">
          No hay tiendas registradas. Ingresa como ADMIN para crear una.
        </p>
      </div>
    </div>

    <Dialog
      v-model:visible="showPinModal"
      modal
      header="Validación de Seguridad"
      class="custom-pin-dialog"
      :style="{ width: '400px' }"
      :draggable="false"
    >
      <div class="pin-modal-content">
        <p class="pin-instructions">Ingresa tu PIN de acceso</p>
        <div class="pin-input-wrapper">
          <InputOtp v-model="pin" integerOnly :length="4" mask />
        </div>
        <div class="pin-actions">
          <Button label="Cancelar" severity="secondary" text @click="showPinModal = false" />
          <Button
            label="Acceder"
            @click="verificarPin"
            :loading="loadingPin"
            :disabled="pin.length < 4"
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

/**
 * Maneja la selección de una sucursal
 * @param {String} valorSeleccionado - uid o 'ADMIN' seleccionado
 */
const handleSelect = (valorSeleccionado) => {
  if (valorSeleccionado === 'ADMIN') {
    pin.value = ''
    showPinModal.value = true
    return
  }

  const existe = sucursales.value.find((s) => s.nombre === valorSeleccionado)
  if (existe) {
    seleccionar(existe.id)
  }
}

const verificarPin = async () => {
  if (pin.value.length < 4) return
  loadingPin.value = true
  await new Promise((r) => setTimeout(r, 600))

  const pinCorrecto = store.userProfile.adminPin

  if (pin.value === String(pinCorrecto)) {
    setAdminAuth(true)
    seleccionar('ADMIN')
    showPinModal.value = false
    toast.add({ severity: 'success', summary: 'Acceso Concedido', life: 2000 })
    router.push({ name: 'admin' })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Acceso Denegado',
      detail: 'PIN Incorrecto',
      life: 3000,
    })
    pin.value = ''
  }
  loadingPin.value = false
}
</script>

<style scoped>
/* SELECTOR DE SUCURSAL - ADN MINIMALISTA & LÍNEAS */

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

.selector-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.selector-icon {
  color: var(--color-accent);
  font-size: 2rem;
  margin-bottom: 1rem;
}

.selector-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.selector-subtitle {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* GRID DE SUCURSALES (Priorizando líneas finas) */
.branches-grid {
  display: grid;
  /* Esto es magia: crea columnas de mínimo 220px y máximo lo que sobre.
     Si no caben dos, se pone una sola automáticamente. */
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  max-height: 60vh; /* Si hay demasiadas, el contenedor scrollea, no toda la página */
  overflow-y: auto;
  padding: 0.5rem; /* Espacio para que la sombra no se corte */
}

/* Estilizamos el scrollbar para que sea minimalista */
.branches-grid::-webkit-scrollbar {
  width: 6px;
}
.branches-grid::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 10px;
}

.branch-card {
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.branch-card:hover {
  border-color: var(--color-primary);
  transform: translateX(4px);
  box-shadow: var(--shadow-flat);
}

.branch-emoji {
  font-size: 1.5rem;
}

.branch-name {
  font-weight: 700;
  color: var(--color-text-main);
  flex-grow: 1;
  letter-spacing: 0.01em;
}

.arrow-icon {
  font-size: 0.8rem;
  color: var(--color-border);
  transition: color 0.2s;
}

.branch-card:hover .arrow-icon {
  color: var(--color-primary);
}

/* Variante Admin */
.admin-variant {
  margin-top: 1rem;
  background-color: var(--color-primary) !important;
  border-color: var(--color-primary);
}

.admin-variant .branch-name {
  color: var(--color-accent);
}

.admin-variant .arrow-icon {
  color: var(--color-accent) !important;
  opacity: 1;
}

.admin-variant:hover {
  border-color: var(--color-accent);
  /* Un brillo sutil amarillo al pasar el mouse sobre la de Admin */
  box-shadow: 0 0 15px rgba(250, 204, 21, 0.2);
}

/* MODAL DE SEGURIDAD (PIN) */
:deep(.custom-pin-dialog) {
  border-radius: 16px !important;
  border: none !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

:deep(.custom-pin-dialog .p-dialog-header) {
  background: var(--bg-surface);
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
  color: var(--color-primary);
  font-weight: 800;
  font-size: 1rem;
}

.pin-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 1rem 0;
}

.pin-instructions {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 600;
  margin: 0;
}

/* Estilo para el InputOtp de PrimeVue */
.pin-input-wrapper {
  padding: 0.5rem;
}

:deep(.p-inputotp) {
  gap: 0.75rem;
}

:deep(.p-inputotp-input) {
  width: 3.5rem !important;
  height: 4.5rem !important;
  font-size: 2rem !important;
  font-weight: 900 !important;
  border: 2px solid var(--color-border) !important;
  border-radius: 12px !important;
  background: var(--bg-surface) !important;
  color: var(--color-primary) !important;
  transition: all 0.2s ease;
}

:deep(.p-inputotp-input:focus) {
  border-color: var(--color-accent) !important; /* El toque amarillo de seguridad */
  box-shadow: 0 0 0 4px var(--color-accent-soft) !important;
  transform: translateY(-2px);
}

.pin-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
}

.pin-actions .p-button {
  flex: 1;
  font-weight: 800 !important;
  height: 48px;
  border-radius: 10px;
}

/* Botón principal con el color de la app */
.pin-actions .p-button:not(.p-button-secondary) {
  background: var(--color-primary) !important;
  color: var(--color-accent) !important;
  border: none !important;
}

.pin-actions .p-button-secondary {
  color: var(--color-text-muted) !important;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.loading-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
  color: var(--color-accent);
}
</style>
