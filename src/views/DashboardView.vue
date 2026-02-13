<template>
  <div class="dashboard">
    <Toast />
    <ConfirmDialog />
<Dialog 
    v-model:visible="showCloseModal" 
    modal 
    header="Finalizar Turno" 
    :style="{ width: '420px' }"
    class="arqueo-dialog"
    :closable="!loadingCierre"
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
                    v-model="montoArqueo" 
                    mode="decimal" 
                    :minFractionDigits="2" 
                    placeholder="0.00" 
                    class="display-input-comp" 
                    inputClass="display-input-raw"
                    :disabled="loadingCierre"
                    autofocus
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
                @click="showCloseModal = false" 
                :disabled="loadingCierre"
                class="btn-back"
            />
            <Button 
                label="CONFIRMAR Y CERRAR" 
                icon="pi pi-lock" 
                @click="confirmarCierre" 
                :loading="loadingCierre"
                :disabled="montoArqueo === null"
                class="btn-submit-arqueo" 
            />
        </div>
    </div>
</Dialog>
    <Dialog 
    v-model:visible="showExpenseModal" 
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
                v-model="expenseDesc" 
                placeholder="Ej. Pasajes, Almuerzo, Bolsas..." 
                class="w-full p-inputtext-sm" 
            />
        </div>

        <div class="field-group">
            <label>Monto a Retirar</label>
            <div class="price-input-wrapper expense-border">
                <span class="currency">S/</span>
                <InputNumber 
                    v-model="expenseAmount" 
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
                @click="guardarGasto" 
                :disabled="!expenseDesc || !expenseAmount"
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
                <span class="match-tag">{{ matcherState.matchType === 'AUTO' ? 'Automático' : 'Manual' }}</span>
            </header>

            <div class="confirm-data-card">
                <div class="data-row">
                  <span class="lbl">Cliente:</span>
                  <span class="val">{{ matcherState.candidateYape?.senderName }}</span>
                </div>
                <div class="data-row total-row">
                  <span class="lbl">Monto:</span>
                  <span class="val-amount">S/ {{ Number(matcherState.candidateYape?.amount).toFixed(2) }}</span>
                </div>
            </div>

            <div class="confirm-btns">
                <Button label="DESCARTAR" severity="secondary" text @click="cancelarVinculo" class="flex-1" />
                <Button label="CONFIRMAR VENTA" @click="confirmarVinculo" icon="pi pi-bolt" class="flex-1 btn-confirm-yape" />
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
      <Button label="Simular" icon="pi pi-bolt" @click="handleSimulacion" text class="nav-btn" />
      <Button label="Sede" icon="pi pi-sync" @click="cambiarSucursal" text class="nav-btn" />
      <Button label="Gasto" icon="pi pi-minus-circle" @click="showExpenseModal = true" text class="nav-btn expense" />
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
           <YapeFeed :yapes="yapesPendientes" @pescar="handlePesca" />
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
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import ShiftOpen from '@/components/pos/ShiftOpen.vue';
import YapeFeed from '@/components/pos/YapeFeed.vue'; 
import SalesHistory from '@/components/pos/SalesHistory.vue'; 
import SucursalSelector from '@/components/shared/SucursalSelector.vue';
import POSPanel from '@/components/pos/POSPanel.vue';
import Button from 'primevue/button';

import { useAuth } from '@/composables/useAuth';
import { useSucursal } from '@/composables/useSucursal';
import { useShift } from '@/composables/useShift'; 
import { useYape } from '@/composables/useYape';
import { simularDatos } from '@/utils/devSimulator';
import { useMovements } from '@/composables/useMovements';
import { useYapeMatcher } from '@/composables/useYapeMatcher';

import '@/assets/dashboard.css';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const posPanelRef = ref(null);

// --- ESTADO PARA EL CIERRE ---
const showCloseModal = ref(false);
const montoArqueo = ref(null);
const loadingCierre = ref(false);

// Agrega esto junto a tus otros refs (const activeTab, etc.)
const showExpenseModal = ref(false);
const expenseDesc = ref('');
const expenseAmount = ref(null);

const { user } = useAuth();
const { sucursalActual, nombreSucursalActual, limpiarSucursal } = useSucursal();
const { verificarTurnoActivo, cerrarTurno, isShiftOpen, currentShift } = useShift();
const {
  escucharPendientes,
  yapesPendientes,
  detenerTodo
} = useYape();
const { 
  escucharMovimientos,
  movimientosTurno,
  detenerEscuchaMovimientos
} = useMovements();
const { 
    matcherState, 
    vigilarYapesEntrantes, 
    validarSeleccionManual, 
    resetMatcher, 
    cancelarEspera 
} = useYapeMatcher();

vigilarYapesEntrantes(yapesPendientes);

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
    
    if (sucursalActual.value === 'ADMIN') {
        router.push('/admin');
        return;
    }

    if (!sucursalActual.value) {
        globalLoading.value = false;
        return;
    }

    globalLoading.value = true;
    try {
        await verificarTurnoActivo();
        
        if (isShiftOpen.value) {
            escucharPendientes(user.value.email);
            escucharMovimientos();
        }
    } catch (error) {
      console.error("Error dashboard:", error);
    } finally {
      globalLoading.value = false;
    }
};

const handleTransaccionCompletada = () => { console.log("Transacción OK"); };

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

// Función para procesar el gasto
const guardarGasto = async () => {
    // 1. Validaciones básicas
    if (!expenseDesc.value || !expenseAmount.value) {
        toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingresa descripción y monto', life: 3000 });
        return;
    }

    try {
        // AQUÍ VA TU LÓGICA DE BACKEND O STORE
        // Por ejemplo: await transactionStore.addExpense({ desc: expenseDesc.value, amount: expenseAmount.value });
        
        // Simulación de éxito
        console.log("Registrando gasto:", expenseDesc.value, expenseAmount.value);
        
        toast.add({ 
            severity: 'error', // Rojo porque es salida de dinero
            summary: 'Gasto Registrado', 
            detail: `Se retiraron S/ ${expenseAmount.value} de caja`, 
            life: 3000 
        });

        // 2. Limpiar y Cerrar
        expenseDesc.value = '';
        expenseAmount.value = null;
        showExpenseModal.value = false;

    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el gasto' });
    }
};

/**
 * Maneja el clic en "Cerrar Turno" para cerrar el turno actual
 * TODO: Usar logica de cierre programado en useShift para cerrar correctamente con auditoría
 */
const handleCierreClick = async () => {
  montoArqueo.value = null; // Reiniciar valor
  showCloseModal.value = true;
};

// 2. Ejecuta el cierre (Conectado al botón del modal)
const confirmarCierre = async () => {
    if (montoArqueo.value === null) return;

    // Opcional: Una última confirmación de seguridad si el monto es 0 o muy raro
    // Si prefieres directo, borra este bloque confirm.require
    if (montoArqueo.value === 0) {
        confirm.require({
            message: 'Estás declarando S/ 0.00 en caja. ¿Es correcto?',
            header: 'Advertencia de Arqueo',
            icon: 'pi pi-exclamation-triangle',
            acceptClass: 'p-button-danger',
            accept: () => ejecutarCierreReal()
        });
    } else {
        await ejecutarCierreReal();
    }
};

// 3. La lógica dura (Tu llamada a la API)
const ejecutarCierreReal = async () => {
    loadingCierre.value = true;
    try {
        await cerrarTurno(Number(montoArqueo.value), nombreSucursalActual.value);
        
        // Éxito
        showCloseModal.value = false;
        detenerTodo(); // Detiene workers de Yape, etc.
        toast.add({ severity: 'success', summary: 'Turno Cerrado', detail: 'El sistema ha registrado el arqueo.' });
        
        // Redirigir o limpiar estado si es necesario
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error en Cierre', detail: e.message });
    } finally {
        loadingCierre.value = false;
    }
};

/**
 * Utilitario de manejo de pesca de una transacción pendiente
 * @param {Object} yape - Objeto de transacción pendiente
 */
const handlePesca = (yape) => {
  if (!posPanelRef.value) return;

  const totalCarrito = posPanelRef.value.totalGeneral || 0;

  const resultado = validarSeleccionManual(yape, totalCarrito);

  if (resultado.valid && resultado.action === 'PRELLENAR') {
    posPanelRef.value.prellenarCarrito(yape.amount);
  }
};

/**
 * Método para confirmar el match entre una transacción pendiente y una venta en POS
 */
const confirmarVinculo = async () => {
    if (!posPanelRef.value || !matcherState.candidateYape) return;
    
    await posPanelRef.value.finalizarVentaYapeConfirmada(matcherState.candidateYape);
    
    resetMatcher();
};

/**
 * Método para cancelar el proceso de vinculación manual y volver al estado de espera
 */
const cancelarVinculo = () => {
    cancelarEspera();
    toast.add({ severity: 'info', summary: 'Vínculo cancelado', detail: 'Botones de pago liberados.' });
};

/**
 * Utilitario para simular datos de transacciones
 */
const handleSimulacion = () => {
    if (user.value?.email) simularDatos(user.value.email);
};
</script>

<style scoped>
/* Estilos específicos del Modal de Confirmación para que no rompa el ADN */
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

.btn-confirm-yape {
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