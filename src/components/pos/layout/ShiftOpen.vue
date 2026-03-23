<template>
  <div class="shift-open-container">
    <div class="shift-split-layout">
      <aside class="shift-info-side">
        <h1 class="shift-title">Apertura de Turno</h1>
        <p class="shift-subtitle">
          Bienvenido al sistema. Por favor, verifica el efectivo físico antes de declarar el fondo
          inicial.
        </p>

        <footer class="shift-footer">
          <div class="secure-badge">
            <i class="pi pi-shield"></i>
            <span>ENTORNO SEGURO</span>
          </div>
        </footer>
      </aside>

      <main class="shift-form-side">
        <div class="shift-card">
          <div class="input-group">
            <label for="cajero">Responsable del Turno</label>
            <InputText
              id="cajero"
              v-model="nombreCajero"
              placeholder="Nombre del cajero"
              class="custom-input"
            />
          </div>

          <div class="input-group">
            <label for="monto">Fondo Inicial</label>
            <div class="currency-display">
              <InputNumber
                id="monto"
                v-model="montoInicial"
                mode="decimal"
                :minFractionDigits="2"
                class="currency-input-field"
                inputClass="amount-input"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="shift-actions">
            <Button
              label="ABRIR CAJA"
              icon="pi pi-check"
              class="btn-open"
              @click="handleAbrirTurno"
              :loading="loading"
            />
            <Button
              label="CANCELAR Y VOLVER"
              icon="pi pi-arrow-left"
              text
              class="btn-back"
              @click="handleVolver"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useShift } from '@/composables/operations/useShift'
import { useToast } from 'primevue/usetoast'
import { useSucursal } from '@/composables/admin/useSucursal'

const { abrirTurno } = useShift()
const { limpiarSucursal } = useSucursal()
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
.shift-open-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  padding: 2rem;
}

.shift-split-layout {
  display: flex;
  width: 100%;
  max-width: 900px;
  background: var(--bg-app);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  overflow: hidden; /* Para que las esquinas del aside no se salgan */
  box-shadow: var(--shadow-pro);
}

/* PANEL IZQUIERDO (Oscuro y Sobrio) */
.shift-info-side {
  flex: 1;
  background-color: var(--color-primary);
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.shift-title {
  font-size: 2rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.shift-subtitle {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  font-size: 0.95rem;
}

.secure-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--color-accent);
  margin-top: 2rem;
  letter-spacing: 0.1em;
}

/* PANEL DERECHO (Limpio y Ágil) */
.shift-form-side {
  flex: 1.2;
  padding: 3.5rem;
  display: flex;
  align-items: center;
}

.shift-card {
  width: 100%;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.custom-input {
  width: 100%;
  border-radius: 8px !important;
  border: 1.5px solid var(--color-border) !important;
  padding: 0.75rem !important;
}

.currency-display {
  display: flex;
  align-items: center;
  /* Quitamos el borde total y dejamos solo una línea inferior elegante */
  border: none;
  border-bottom: 2px solid var(--color-border);
  padding: 0.25rem 0;
  transition: border-color 0.3s ease;
}

.currency-display:hover,
.currency-display:focus-within {
  border-bottom-color: var(--color-primary);
}

:deep(.amount-input) {
  border: none !important;
  background: transparent !important;
  font-size: 2.2rem !important; /* Bajamos un pelín para que respire */
  font-weight: 800 !important;
  color: var(--color-primary) !important;
  padding: 0 !important;
  box-shadow: none !important; /* Adiós al resplandor azul de PrimeVue */
  outline: none !important;
}

/* 2. Suavizar los inputs normales (Responsable) */
.custom-input {
  width: 100%;
  border-radius: 8px !important;
  border: 1px solid var(--color-border) !important; /* Línea más fina (1px) */
  padding: 0.75rem !important;
  transition: all 0.2s ease !important;
  background: var(--bg-app) !important;
}

/* Hover casi invisible, solo cambia sutilmente el tono del borde */
.custom-input:hover {
  border-color: var(--color-text-muted) !important;
}

/* Focus elegante: sin grosor extra, solo cambia el color */
.custom-input:focus {
  border-color: var(--color-primary) !important;
  box-shadow: none !important; /* Importante para que no se vea tosco */
  outline: none !important;
}

.shift-actions {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 3. Ajuste de los botones para que no se vean pesados */
.btn-open {
  background: var(--color-primary) !important;
  color: var(--color-accent) !important;
  border: none !important;
  font-weight: 800 !important;
  padding: 1rem !important;
  border-radius: 8px !important;
  transition: opacity 0.2s !important;
}

.btn-open:hover {
  opacity: 0.9; /* En lugar de cambiar color o borde, solo bajamos opacidad */
}

.btn-back {
  font-weight: 700 !important;
  color: var(--color-text-muted) !important;
  margin-top: 0.5rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .shift-split-layout {
    flex-direction: column;
    margin: 1rem;
  }
  .shift-info-side {
    padding: 2rem;
  }
  .shift-form-side {
    padding: 2rem;
  }
}
</style>
