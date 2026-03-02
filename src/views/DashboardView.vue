<template>
  <div class="dashboard">
    <div v-if="globalLoading" class="loading-overlay-full">
        <ProgressSpinner strokeWidth="4" />
        <p>Sincronizando caja...</p>
    </div>
    <template v-else>
      <Dialog 
    v-model:visible="arqueoState.isOpen" 
    modal 
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
                  @input="(e) => arqueoState.monto = e.value"
                  @keyup.enter="confirmarCierre"
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
                @click="confirmarCierre" 
                :loading="arqueoState.loading"
                :disabled="arqueoState.monto === null || arqueoState.monto === undefined"
                class="btn-submit-arqueo" 
            />
        </div>
    </div>
</Dialog>
    <Dialog 
    v-model:visible="expenseState.isOpen" 
    modal 
    header="Registro de Gasto Operativo" 
    :style="{ width: '380px' }"
    class="expense-dialog"
>
    <div class="expense-form">
        <p class="expense-warning">
            <i class="pi pi-exclamation-triangle"></i>
            Este monto se restará del efectivo en caja.
        </p>

        <div class="field-group">
            <label>Descripción del Gasto</label>
            <InputText 
                v-model="expenseState.description" 
                placeholder="Ej. Pasajes, Almuerzo, Bolsas..." 
                class="w-full p-inputtext-sm" 
            />
        </div>

        <div class="field-group">
            <label>Monto a Retirar</label>
            <div class="price-input-wrapper expense-border">
                <span class="currency">S/</span>
                <InputNumber 
                    v-model="expenseState.amount"
                    mode="decimal" 
                    :minFractionDigits="2" 
                    placeholder="0.00" 
                    class="w-full"
                    inputClass="expense-input-inner"
                />
            </div>
        </div>

        <div class="expense-actions">
            <Button label="Cancelar" severity="secondary" text @click="showExpenseModal = false" class="flex-1" />
            <Button 
                label="REGISTRAR SALIDA" 
                severity="danger" 
                icon="pi pi-sign-out" 
                @click="guardarGastoUI"
                :loading="expenseState.loading"
                :disabled="!expenseState.description || !expenseState.amount"
                class="flex-1 btn-expense" 
            />
        </div>
    </div>
</Dialog>
    <Dialog 
        v-model:visible="matcherState.showModal" 
        modal 
        header="Validación de Pago" 
        :style="{ width: '400px' }"
        :closable="false"
        class="custom-confirm-dialog"
    >
        <div class="confirm-body">
            <header class="confirm-status">
                <i class="pi pi-check-circle pulse-green"></i>
                <h3>¡Pago Detectado!</h3>
                <span class="match-tag">
                  {{ matcherState.matchType === 'AUTO' ? 'Automático' :
                    matcherState.matchType === 'DIRECT' ? 'Venta Rápida' : 'Manual'}}</span> 
            </header>

            <div class="confirm-data-card">
                <div class="data-row">
                  <span class="lbl">Cliente:</span>
                  <span class="val">{{ matcherState.candidate?.senderName }}</span>
                </div>
                <div class="data-row total-row">
                  <span class="lbl">Monto:</span>
                  <span class="val-amount">S/ {{ Number(matcherState.candidate?.amount).toFixed(2) }}</span>
                </div>
            </div>

            <div class="confirm-btns">
                <Button label="DESCARTAR" severity="secondary" text @click="cancelarVinculo" class="flex-1" />
                <Button label="CONFIRMAR VENTA" @click="confirmarVinculo" icon="pi pi-bolt" class="flex-1 btn-confirm-digital-payment" />
            </div>
        </div>
    </Dialog>

    <div v-if="!sucursalActual">
      <SucursalSelector />
    </div>

    <div v-else class="pos-layout-wrapper">
      <ShiftOpen v-if="!isShiftOpen" />

      <div v-else class="pos-grid-container"> 
        <header class="pos-navbar">
  <div class="navbar-left">
    <div class="brand-badge">
      <i class="pi pi-wallet"></i>
    </div>
    <div class="brand-info">
      <span class="brand-title">Monitor</span>
      <div class="location-context">
        <span class="location-name">{{ nombreSucursalActual }}</span>
        <span class="context-divider">|</span>
        <div class="cashier-tag">
          <i class="pi pi-user"></i>
          <span class="cashier-name">{{ nombreCajero }}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="navbar-right">
    <div class="nav-group navigation">
      <Button v-if="showSimulator" label="Simular" icon="pi pi-bolt" @click="handleSimulacion" text class="nav-btn" />
      <Button label="Sede" icon="pi pi-sync" @click="cambiarSucursal" text class="nav-btn" />
      <Button label="Gasto" icon="pi pi-minus-circle" @click="expenseState.isOpen = true" text class="nav-btn expense" />
    </div>

    <div class="nav-divider"></div>

    <div class="nav-group sessions">
      <Button 
        label="Finalizar Turno" 
        icon="pi pi-power-off" 
        @click="handleCierreClick" 
        class="btn-exit"
      />
    </div>
  </div>
</header>

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
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import ShiftOpen from '@/components/pos/ShiftOpen.vue';
import DigitalFeed from '@/components/pos/DigitalFeed.vue'; 
import SalesHistory from '@/components/pos/SalesHistory.vue'; 
import SucursalSelector from '@/components/shared/SucursalSelector.vue';
import POSPanel from '@/components/pos/POSPanel.vue';
import Button from 'primevue/button';

import { useAuth } from '@/composables/useAuth';
import { useSucursal } from '@/composables/useSucursal';
import { useShift } from '@/composables/useShift'; 
import { useDigitalPayments } from '@/composables/useDigitalPayments';
import { simularDatos } from '@/utils/devSimulator';
import { useMovements } from '@/composables/useMovements';
import { useMatcher } from '@/composables/useMatcher';

import '@/assets/dashboard.css';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const posPanelRef = ref(null);

const { user } = useAuth();
const {
  sucursalActual,
  nombreSucursalActual,
  limpiarSucursal
} = useSucursal();

const {
  verificarTurnoActivo,
  cerrarTurno,
  isShiftOpen,
  currentShift,
  arqueoState,
  abrirArqueo
} = useShift();

const {
  escucharPendientes,
  pendientes,
  detenerTodo
} = useDigitalPayments();

const { 
  escucharMovimientos,
  movimientosTurno,
  detenerEscuchaMovimientos,
  expenseState,
  registrarGasto
} = useMovements();

const { 
    matcherState, 
    vigilarEntrantes, 
    validarSeleccionManual, 
    resetMatcher, 
    cancelarEspera 
} = useMatcher();

vigilarEntrantes(pendientes);

const globalLoading = ref(true);

const nombreCajero = computed(() => {
  return currentShift.value?.cajero || 'Cajero no asignado';
});

/**
 * Función principal para iniciar el dashboard
 * - Verifica el turno activo
 * - Si el turno ya estaba abierto, conecta los sockets para pendientes y ventas
 * - Maneja redirecciones según el estado del usuario y la sucursal
 */
const iniciarDashboard = async () => {
    if (!user.value) return;
    
    globalLoading.value = true;
    try {
      if (sucursalActual.value === 'ADMIN') {
        router.push('/admin');
        return;
      }

      if (!sucursalActual.value) {
        globalLoading.value = false;
        return;
      }

      await verificarTurnoActivo();
      
      if (isShiftOpen.value) {
        escucharPendientes(user.value.email);
        escucharMovimientos();
      }

  } catch (error) {
    console.error("Error crítico en Dashboard:", error);
    toast.add({ 
      severity: 'error', 
      summary: 'Error de conexión', 
      detail: 'No se pudo sincronizar el estado de la caja.',
      life: 5000
    });
  } finally {
    globalLoading.value = false;
  }
};

const handleTransaccionCompletada = () => {
  resetMatcher();

  //TODO: Crear un método para poner el foco del cursor en el input de productos
}

const showSimulator = computed(() => {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_SIMULATOR === 'true';
})
/**
 * Iniciar el dashboard al montar el componente
 * Diferentes watchers para reiniciar el dashboard según cambios
 */
onMounted(iniciarDashboard);

watch([user, sucursalActual], () => {
    detenerTodo();
    iniciarDashboard();
});

watch(isShiftOpen, (estaAbierto) => {
    if (estaAbierto) {
        escucharPendientes(user.value.email);
        escucharMovimientos();
    } else {
        detenerEscuchaMovimientos();
    }
});

/**
 * Manejo de evento de cambio de sucursal
 */
const cambiarSucursal = () => {
    detenerTodo();
    limpiarSucursal();
};

/**
 * Maneja el clic en "Cerrar Turno" para cerrar el turno actual
 * TODO: Usar logica de cierre programado en useShift para cerrar correctamente con auditoría
 */
const handleCierreClick = async () => {
  const tieneProductos = posPanelRef.value?.cart?.length > 0;
  if (tieneProductos) {
    toast.add({ 
      severity: 'error', 
      summary: 'Acción bloqueada', 
      detail: 'No puedes cerrar turno con productos en el carrito. Finaliza la venta o limpia el carrito.', 
      life: 5000 
    });
    
    posPanelRef.value?.$el.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  abrirArqueo();
};

/**
 * Confirma el cierre del turno con el monto declarado en caja
 */
const confirmarCierre = async () => {
  if (arqueoState.monto === null || arqueoState.monto === undefined) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debes ingresar un monto.' });
    return;
  }

  if (Number(arqueoState.monto) === 0) {
    confirm.require({
      message: 'Ingresaste 0.00 en efectivo hoy. ¿Deseas declararlo y cerrar caja?',
      header: 'Advertencia',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => ejecutarCierre()
    });
  } else {
    await ejecutarCierre();
  }
};

/**
 * Método para registrar el cierre, arqueo y finalización del turno
 */
const ejecutarCierre = async () => {
  try {
    await cerrarTurno();
    detenerTodo();
    toast.add({ severity: 'success', summary: 'Turno Cerrado', detail: 'Arqueo registrado correctamente.', life: 3000});
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000});
  }
};

/**
 * Método que maneja el registro de un gasto operativo desde la UI
 * Muestra notificaciones según el resultado del registro del gasto
 */
const guardarGastoUI = async () => {
  try {
    await registrarGasto();
    toast.add({ severity: 'warn', summary: 'Gasto Registrado', detail: 'Actualizado en caja.', life: 3000 });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000});
  }
};

/**
 * Utilitario de manejo de pesca de una transacción pendiente
 * @param {Object} pagoDigital - Objeto de transacción pendiente
 */
const handlePesca = (pagoDigital) => {
  if (!posPanelRef.value) return;

  const totalCarrito = posPanelRef.value.totalGeneral || 0;

  const resultado = validarSeleccionManual(pagoDigital, totalCarrito);

  if (!resultado.valid) {
    if (resultado.error === 'AMOUNT_MISMATCH') {
      toast.add({ 
        severity: 'error', 
        summary: 'Monto Incorrecto', 
        detail: `El Pago Digital es de S/ ${resultado.pagoDigitalAmount} pero el carrito espera S/ ${resultado.expected.toFixed(2)}`,
        life: 3000
      });
    }
    return;
  }
};

/**
 * Método para confirmar el match entre una transacción pendiente y una venta en POS
 */
const confirmarVinculo = async () => {
    if (!posPanelRef.value || !matcherState.candidate) return;
    
    await posPanelRef.value.finalizarVentaDigitalConfirmada(matcherState.candidate);
    
    resetMatcher();
};

/**
 * Método para cancelar el proceso de vinculación manual y volver al estado de espera
 */
const cancelarVinculo = () => {
    cancelarEspera();
    toast.add({ severity: 'info', summary: 'Vínculo cancelado', detail: 'Botones de pago liberados.', life: 3000});
};

/**
 * Utilitario para simular datos de transacciones
 */
const handleSimulacion = async () => {
  if (showSimulator.value && user.value?.uid) {
    simularDatos(user.value.uid);
  }
};
</script>

<style scoped>
/* Estilos específicos del Modal de Confirmación */
.confirm-body {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.confirm-status {
  text-align: center;
}

.confirm-status i {
  font-size: 3.5rem;
  color: #22c55e;
  margin-bottom: 0.5rem;
  display: block;
}

.confirm-status h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary);
}

.match-tag {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  background: var(--color-accent-soft);
  color: #854d0e;
  padding: 2px 10px;
  border-radius: 100px;
}

.confirm-data-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.data-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.total-row {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border);
}

.lbl { color: var(--color-text-muted); font-size: 0.9rem; }
.val { font-weight: 700; color: var(--color-primary); }
.val-amount { font-weight: 900; font-size: 1.5rem; color: var(--color-primary); }

.confirm-btns {
  display: flex;
  gap: 1rem;
}

.btn-confirm-digital-payment {
  background: var(--color-primary) !important;
  color: var(--color-accent) !important;
  border: none !important;
  font-weight: 800 !important;
}

.pulse-green {
  animation: pulse-border 2s infinite;
  border-radius: 50%;
}

@keyframes pulse-border {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.flex-1 { flex: 1; }
</style>