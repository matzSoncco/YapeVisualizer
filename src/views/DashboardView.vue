<template>
  <div class="dashboard">
    <Toast />
    <ConfirmDialog />

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
           <div class="brand-area">
             <i class="pi pi-wallet"></i>
             <span class="brand-text">Monitor</span>
             <div class="divider"></div>
             <span class="location-tag">{{ nombreSucursalActual }}</span>
           </div>
           
           <div class="actions-area">
             <Button label="Simular" icon="pi pi-bolt" @click="handleSimulacion" text size="small" class="btn-nav-ghost" />
             <Button label="Sede" icon="pi pi-sync" @click="cambiarSucursal" text size="small" class="btn-nav-ghost" />
             <div class="divider"></div>
             <Button label="Cerrar Turno" icon="pi pi-power-off" @click="handleCierreClick" text severity="danger" size="small" class="btn-nav-danger" />
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
import { ref, onMounted, watch } from 'vue';
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
import { formatearHora } from '@/utils/dates';

import '@/assets/dashboard.css';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const posPanelRef = ref(null);

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

/**
 * Maneja el clic en "Cerrar Turno" para cerrar el turno actual
 * TODO: Usar logica de cierre programado en useShift para cerrar correctamente con auditoría
 */
const handleCierreClick = async () => {
    const montoDeclarado = prompt("Cierre de Caja: ¿Cuánto efectivo físico hay en caja?");
    
    if (montoDeclarado === null) return;

    confirm.require({
        message: `Estás declarando S/ ${montoDeclarado}. ¿Confirmas el cierre de turno?`,
        header: 'Confirmar Arqueo',
        accept: async () => {
             try {
                await cerrarTurno(Number(montoDeclarado), nombreSucursalActual.value);
                detenerTodo();
                toast.add({ severity: 'success', summary: 'Turno Cerrado Correctamente' });
             } catch (e) {
                toast.add({ severity: 'error', summary: 'Error', detail: e.message });
             }
        }
    });
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