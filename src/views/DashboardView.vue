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
        <div class="flex flex-col items-center gap-4 pt-2">
            <div class="text-center">
                <i class="pi pi-check-circle text-5xl text-purple-600 mb-2"></i>
                <h3 class="font-bold text-xl text-slate-800">¡Pago Detectado!</h3>
                <p class="text-slate-500 text-sm" v-if="matcherState.matchType === 'AUTO'">Coincidencia automática</p>
                <p class="text-slate-500 text-sm" v-else>Selección manual</p>
            </div>

            <div class="w-full bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div class="flex justify-between mb-2">
                    <span class="text-slate-500">Cliente:</span>
                    <span class="font-bold text-slate-800">{{ matcherState.candidateYape?.senderName }}</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="text-slate-500">Monto:</span>
                    <span class="font-bold text-purple-700 text-lg">S/ {{ Number(matcherState.candidateYape?.amount).toFixed(2) }}</span>
                </div>
                 <div class="flex justify-between">
                    <span class="text-slate-500">Hora:</span>
                    <span class="font-mono text-slate-600">{{ formatearHora(matcherState.candidateYape?.timestamp) }}</span>
                </div>
            </div>

            <div class="flex gap-2 w-full mt-2">
                <Button label="Cancelar" severity="secondary" text class="flex-1" @click="cancelarVinculo" />
                <Button label="CONFIRMAR VENTA" severity="help" class="flex-1" @click="confirmarVinculo" icon="pi pi-check" autofocus />
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
import { formatearHora } from '@/utils/dates';

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
    confirm.require({
        message: '¿Seguro que deseas cerrar el turno actual?',
        header: 'Cerrar Caja',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
             try {
                await cerrarTurno(0, nombreSucursalActual.value);
                detenerTodo();
                toast.add({ severity: 'success', summary: 'Turno Cerrado' });
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
};

/**
 * Utilitario para simular datos de transacciones
 */
const handleSimulacion = () => {
    if (user.value?.email) simularDatos(user.value.email);
};
</script>