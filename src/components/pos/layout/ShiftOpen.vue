<template>
  <div class="shift-open-container">
    <main class="shift-card">
      
      <header class="card-header">
        <div class="brand-dot"></div>
        <div class="header-text">
          <h1 class="shift-title">Apertura de Turno</h1>
          <p class="shift-location">{{ nombreSucursalActual }}</p>
        </div>
      </header>

      <section class="card-body">
        <div class="input-group">
          <label for="cajero">Responsable</label>
          <InputText
            id="cajero"
            v-model="nombreCajero"
            placeholder="Nombre del responsable"
            class="custom-input"
          />
        </div>

        <div class="input-group amount-group">
          <label for="monto">Fondo Inicial de Caja</label>
          <div class="currency-wrapper">
            <span class="currency-prefix">S/</span>
            <InputNumber
              id="monto"
              v-model="montoInicial"
              mode="decimal"
              :minFractionDigits="2"
              inputClass="hero-amount-input"
              placeholder="0.00"
              autofocus
            />
          </div>
        </div>
      </section>

      <footer class="card-actions">
        <Button
          label="INICIAR JORNADA"
          icon="pi pi-play"
          class="btn-primary-action"
          @click="handleAbrirTurno"
          :loading="loading"
        />
        <Button
          label="Volver al panel"
          icon="pi pi-arrow-left"
          text
          class="btn-secondary-action"
          @click="handleVolver"
        />
      </footer>

    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useShift } from '@/composables/operations/useShift'
import { useToast } from 'primevue/usetoast'
import { useSucursal } from '@/composables/admin/useSucursal'

const { abrirTurno } = useShift()
const { limpiarSucursal, nombreSucursalActual } = useSucursal()

const toast = useToast()

const nombreCajero = ref('')
const montoInicial = ref(0)
const loading = ref(false)
const error = ref(false)

/**
 * Maneja la apertura del turno al hacer clic en "ABRIR TURNO"
 */
const handleAbrirTurno = async () => {
  if (!nombreCajero.value.trim()) {
    error.value = true
    toast.add({
      severity: 'warn',
      summary: 'Falta información',
      detail: 'Ingresa el nombre del responsable',
      life: 3000,
    })
    return
  }

  loading.value = true
  try {
    const monto = montoInicial.value || 0
    await abrirTurno(monto, nombreCajero.value)

    toast.add({
      severity: 'success',
      summary: 'Turno Abierto',
      detail: 'Ya puedes registrar ventas',
      life: 3000,
    })
  } catch (e) {
    console.error(e)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo abrir el turno. Revisa tu conexión.',
      life: 5000,
    })
  } finally {
    loading.value = false
  }
}

/**
 * Maneja el clic en "VOLVER" para regresar a la selección de sucursal
 */
const handleVolver = () => {
  limpiarSucursal()
}
</script>

<style scoped>
/* Contenedor Base */
.shift-open-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  padding: 1rem;
}

.shift-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-app);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  padding: 2.5rem;
}

/* Encabezado */
.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.brand-dot {
  width: 10px;
  height: 10px;
  background: var(--color-accent);
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--color-accent-soft);
}

.shift-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
}

.shift-location {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0.2rem 0 0 0;
}

/* Cuerpo y Formulario */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
}

/* InputText: Hover y Focus sutiles */
.custom-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.7rem;
  background: var(--bg-app);
  transition: border-color 0.2s ease;
}

.custom-input:hover {
  border-color: var(--color-text-muted);
}

.custom-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

/* Sección de Monto */
.amount-group {
  background: var(--bg-surface);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.currency-wrapper {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.currency-prefix {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-primary-mid);
}

:deep(.hero-amount-input) {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--color-primary);
  padding: 0;
  outline: none;
  box-shadow: none;
}

/* Botones con :deep y Hovers refinados */
.card-actions {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Primario: Cambio de tono suave, sin movimientos bruscos */
:deep(.btn-primary-action.p-button) {
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  font-weight: 800;
  padding: 1rem;
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.btn-primary-action.p-button:not(:disabled):hover) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-interactive);
}

/* Secundario: Simple cambio de fondo */
:deep(.btn-secondary-action.p-button) {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  transition: background-color 0.2s ease;
}

:deep(.btn-secondary-action.p-button:hover) {
  background: var(--bg-surface-alt);
}
</style>