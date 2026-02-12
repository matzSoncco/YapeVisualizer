<template>
  <div class="dashboard">
    <Toast />
    <ConfirmDialog />

    <Dialog 
        v-model:visible="matcherState.showModal" 
        modal 
        header="Confirmar Pago Yape" 
        :style="{ width: '400px' }"
        :closable="false"
    >
        <div class="yape-confirm-modal">
            <div class="confirm-icon-section">
                <i class="pi pi-check-circle"></i>
                <h3>¡Pago Detectado!</h3>
                <p v-if="matcherState.matchType === 'AUTO'">Coincidencia automática</p>
                <p v-else>Selección manual</p>
            </div>

            <div class="confirm-details">
                <div class="detail-row">
                    <span class="detail-label">Cliente:</span>
                    <span class="detail-value">{{ matcherState.candidateYape?.senderName }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Monto:</span>
                    <span class="detail-amount">S/ {{ Number(matcherState.candidateYape?.amount).toFixed(2) }}</span>
                </div>
                 <div class="detail-row">
                    <span class="detail-label">Hora:</span>
                    <span class="detail-time">{{ formatearHora(matcherState.candidateYape?.timestamp) }}</span>
                </div>
            </div>

            <div class="confirm-actions">
                <Button label="Cancelar" severity="secondary" text class="cancel-btn" @click="cancelarVinculo" />
                <Button label="CONFIRMAR VENTA" severity="help" class="confirm-btn" @click="confirmarVinculo" icon="pi pi-check" autofocus />
            </div>
        </div>
    </Dialog>

    <div v-if="globalLoading" class="caja-loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Sincronizando...</p>
    </div>

    <div v-else-if="!sucursalActual">
      <SucursalSelector />
    </div>

    <div v-else class="dashboard-layout">
      
      <ShiftOpen v-if="!isShiftOpen" />

      <div v-else class="dashboard-container-inner"> 
        <header class="dashboard-header">
           <div class="dashboard-header-content">
             <div class="dashboard-title-section">
               <h1>Monitor de Caja</h1>
               <p class="dashboard-subtitle">
                 Tienda: <strong>{{ nombreSucursalActual }}</strong> | 
                 Cajero: <strong>{{ currentShift?.cajero }}</strong>
               </p>
             </div>
             <div class="dashboard-actions">
               <Button label="Simular" icon="pi pi-play" @click="handleSimulacion" outlined size="small" />
               <div class="divider-vertical"></div>
               <Button label="Cambiar Sede" icon="pi pi-refresh" @click="cambiarSucursal" text size="small" />
               <Button label="Cerrar Turno" icon="pi pi-lock" @click="handleCierreClick" severity="danger" text size="small" />
             </div>
           </div>
        </header>

        <main class="dashboard-content">
          <section class="grid-col-pending">
            <YapeFeed :yapes="yapesPendientes" @pescar="handlePesca" />
          </section>

          <section class="grid-col-history">
             <SalesHistory :ventas="movimientosTurno" />
          </section>

          <section class="grid-col-pos">
            <POSPanel ref="posPanelRef" @transaction-completed="handleTransaccionCompletada" />
          </section>
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
/* MODAL DE CONFIRMACIÓN YAPE */
.yape-confirm-modal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.confirm-icon-section {
  text-align: center;
}

.confirm-icon-section i {
  font-size: 3.5rem;
  color: #9333ea;
  margin-bottom: 0.75rem;
  display: block;
}

.confirm-icon-section h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--chinese-black);
  margin-bottom: 0.5rem;
}

.confirm-icon-section p {
  font-size: 0.875rem;
  color: #6b7280;
}

.confirm-details {
  background: #faf5ff;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e9d5ff;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #6b7280;
  font-size: 0.9375rem;
}

.detail-value {
  font-weight: 700;
  color: var(--chinese-black);
  font-size: 0.9375rem;
}

.detail-amount {
  font-weight: 700;
  color: #9333ea;
  font-size: 1.125rem;
}

.detail-time {
  font-family: 'Courier New', monospace;
  color: var(--jet);
  font-size: 0.875rem;
}

.confirm-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  flex: 1;
}

.confirm-btn {
  flex: 1;
}
</style>