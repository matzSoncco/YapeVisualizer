<template>
  <div class="dashboard">
    <GlobalLoader v-if="globalLoading || store.loading" />
    <ArqueoModal />
    <ShiftSummaryModal />
    <ExpenseModal />
    <PaymentMatchModal @confirmar-vinculo="confirmarVinculo" @descartar-pago="cancelarVinculo" />
    <div v-if="!sucursalActual">
      <SucursalSelector />
    </div>

    <div v-else class="pos-layout-wrapper">
      <ShiftOpen v-if="!isShiftOpen" />

      <div v-else class="pos-grid-container">
        <POSNavbar
          :nombre-sucursal="nombreSucursalActual"
          :nombre-cajero="nombreCajero"
          @cambiar-sucursal="cambiarSucursal"
          @finalizar-turno="handleCierreClick"
          @abrir-gasto="expenseState.isOpen = true"
          @simular="handleSimulacion"
        />
        <section class="top-feed-bar">
          <DigitalFeed :pagos-digitales="pendientes" @pescar="handlePesca" />
        </section>

        <main class="pos-main-stage">
          <div class="stage-left">
            <POSPanel ref="posPanelRef" @transaction-completed="handleTransaccionCompletada" />
          </div>
          <div class="stage-right">
            <SalesHistory :ventas="movimientosTurno" />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import ShiftOpen from '@/components/pos/layout/ShiftOpen.vue'
import DigitalFeed from '@/components/pos/history/DigitalFeed.vue'
import SalesHistory from '@/components/pos/history/SalesHistory.vue'
import SucursalSelector from '@/components/shared/SucursalSelector.vue'
import POSPanel from '@/components/pos/POSPanel.vue'
import ShiftSummaryModal from '@/components/pos/modals/ShiftSummaryModal.vue'

import { useAuth } from '@/composables/core/useAuth'
import { useSucursal } from '@/composables/admin/useSucursal'
import { useShift } from '@/composables/operations/useShift'
import { useDigitalPayments } from '@/composables/operations/useDigitalPayments'
import { simularDatos } from '@/utils/devSimulator'
import { useMovements } from '@/composables/operations/useMovements'
import { useMatcher } from '@/composables/operations/useMatcher'

import '@/assets/dashboard.css'
import { store } from '@/store'
import POSNavbar from '@/components/pos/layout/POSNavbar.vue'
import ArqueoModal from '@/components/pos/modals/ArqueoModal.vue'
import ExpenseModal from '@/components/pos/modals/ExpenseModal.vue'
import PaymentMatchModal from '@/components/pos/modals/PaymentMatchModal.vue'
import GlobalLoader from '@/components/shared/GlobalLoader.vue'

const router = useRouter()
const toast = useToast()
const posPanelRef = ref(null)

const { user } = useAuth()
const { sucursalActual, nombreSucursalActual, limpiarSucursal } = useSucursal()

const { verificarTurnoActivo, isShiftOpen, currentShift, abrirArqueo } = useShift()

const { escucharPendientes, pendientes, detenerTodo } = useDigitalPayments()

const { escucharMovimientos, movimientosTurno, detenerEscuchaMovimientos, expenseState } =
  useMovements()

const { matcherState, vigilarEntrantes, validarSeleccionManual, resetMatcher, cancelarEspera } =
  useMatcher()

vigilarEntrantes(pendientes)

const globalLoading = ref(true)

const nombreCajero = computed(() => {
  return currentShift.value?.cajero || 'Cajero no asignado'
})

/**
 * Función principal para iniciar el dashboard
 * - Verifica el turno activo
 * - Si el turno ya estaba abierto, conecta los sockets para pendientes y ventas
 * - Maneja redirecciones según el estado del usuario y la sucursal
 */
const iniciarDashboard = async () => {
  if (!user.value) return

  globalLoading.value = true
  try {
    if (sucursalActual.value === 'ADMIN') {
      router.push('/admin')
      return
    }

    if (!sucursalActual.value) {
      globalLoading.value = false
      return
    }

    await verificarTurnoActivo()

    if (isShiftOpen.value) {
      escucharPendientes(user.value.email)
      escucharMovimientos()
    }
  } catch (error) {
    console.error('Error crítico en Dashboard:', error)
    toast.add({
      severity: 'error',
      summary: 'Error de conexión',
      detail: 'No se pudo sincronizar el estado de la caja.',
      life: 5000,
    })
  } finally {
    globalLoading.value = false
  }
}

const handleTransaccionCompletada = () => {
  resetMatcher()

  //TODO: Crear un método para poner el foco del cursor en el input de productos
}

/**
 * Iniciar el dashboard al montar el componente
 * Diferentes watchers para reiniciar el dashboard según cambios
 */
onMounted(iniciarDashboard)

watch([user, sucursalActual], () => {
  detenerTodo()
  iniciarDashboard()
})

watch(isShiftOpen, (estaAbierto) => {
  if (estaAbierto) {
    escucharPendientes(user.value.email)
    escucharMovimientos()
  } else {
    detenerEscuchaMovimientos()
  }
})

/**
 * Manejo de evento de cambio de sucursal
 */
const cambiarSucursal = () => {
  detenerTodo()
  limpiarSucursal()
}

/**
 * Maneja el clic en "Cerrar Turno" para cerrar el turno actual
 * TODO: Usar logica de cierre programado en useShift para cerrar correctamente con auditoría
 */
const handleCierreClick = async () => {
  const tieneProductos = posPanelRef.value?.cart?.length > 0
  if (tieneProductos) {
    toast.add({
      severity: 'error',
      summary: 'Acción bloqueada',
      detail:
        'No puedes cerrar turno con productos en el carrito. Finaliza la venta o limpia el carrito.',
      life: 5000,
    })

    posPanelRef.value?.$el.scrollIntoView({ behavior: 'smooth' })
    return
  }
  abrirArqueo()
}

/**
 * Utilitario de manejo de pesca de una transacción pendiente
 * @param {Object} pagoDigital - Objeto de transacción pendiente
 */
const handlePesca = (pagoDigital) => {
  if (!posPanelRef.value) return

  const totalCarrito = posPanelRef.value.totalGeneral || 0

  const resultado = validarSeleccionManual(pagoDigital, totalCarrito)

  if (!resultado.valid) {
    if (resultado.error === 'AMOUNT_MISMATCH') {
      toast.add({
        severity: 'error',
        summary: 'Monto Incorrecto',
        detail: `El Pago Digital es de S/ ${resultado.pagoDigitalAmount} pero el carrito espera S/ ${resultado.expected.toFixed(2)}`,
        life: 3000,
      })
    }
    return
  }
}

/**
 * Método para confirmar el match entre una transacción pendiente y una venta en POS
 */
const confirmarVinculo = async () => {
  if (matcherState.loading) return

  if (!posPanelRef.value || !matcherState.candidate) return

  matcherState.loading = true
  try {
    await posPanelRef.value.finalizarVentaDigitalConfirmada(matcherState.candidate)

    resetMatcher()
  } catch (error) {
    console.error('Error al confirmar vínculo:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 5000 })
  } finally {
    matcherState.loading = false
  }
}

/**
 * Método para cancelar el proceso de vinculación manual y volver al estado de espera
 */
const cancelarVinculo = () => {
  cancelarEspera()
  toast.add({
    severity: 'info',
    summary: 'Vínculo cancelado',
    detail: 'Botones de pago liberados.',
    life: 3000,
  })
}

/**
 * Utilitario para simular datos de transacciones
 */
const handleSimulacion = async () => {
  if (user.value?.uid) simularDatos(user.value.uid)
}
</script>
