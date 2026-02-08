<template>
  <div class="dashboard">
    <Toast />
    <ConfirmDialog />

    <div v-if="globalLoading" class="caja-loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Sincronizando...</p>
    </div>

    <div v-else-if="!sucursalActual">
      <SucursalSelector />
    </div>

    <div v-else class="dashboard-layout">
      
      <ShiftOpen v-if="!isShiftOpen" />

      <div v-else class="dashboard-container-inner"> <header class="dashboard-header">
          <div class="dashboard-header-content">
            <div class="dashboard-title-section">
              <h1>Monitor de Caja</h1>
              <p class="dashboard-subtitle">
                Tienda: <strong>{{ nombreSucursalActual }}</strong> | 
                Cajero: <strong>{{ currentShift?.cajero }}</strong>
              </p>
            </div>
            
            <div class="dashboard-actions">
              <Button 
                label="Simular" 
                icon="pi pi-play"
                @click="handleSimulacion"
                outlined
                size="small"
              />
              <div class="divider-vertical"></div>
              <Button 
                label="Cambiar Sede" 
                icon="pi pi-refresh"
                @click="cambiarSucursal"
                text
                size="small"
              />
              <Button
                label="Cerrar Turno"
                icon="pi pi-lock"
                @click="handleCierreClick"
                severity="danger"
                text
                size="small"
              />
            </div>
          </div>
        </header>

        <main class="dashboard-content">
          
          <section class="grid-col-pending">
            <YapeFeed 
              :yapes="yapesPendientes" 
              @pescar="handlePesca" 
            />
          </section>

          <section class="grid-col-history">
             <SalesHistory :ventas="misVentas" />
          </section>

          <section class="grid-col-pos">
             <div class="pos-panel-placeholder" style="background: white; height: 100%; padding: 1rem; border-radius: 8px;">
                <h3>POS Panel</h3>
                <p>Aquí irá el formulario de cobro.</p>
             </div>
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
import Button from 'primevue/button';

import { useAuth } from '@/composables/useAuth';
import { useSucursal } from '@/composables/useSucursal';
import { useShift } from '@/composables/useShift'; 
import { useYape } from '@/composables/useYape';
import { simularDatos } from '@/utils/devSimulator';

import '@/assets/dashboard.css';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const { user } = useAuth();
const { sucursalActual, nombreSucursalActual, limpiarSucursal } = useSucursal();
const { verificarTurnoActivo, cerrarTurno, isShiftOpen, currentShift } = useShift();
const { escucharPendientes, escucharMisVentas, yapesPendientes, misVentas, reclamarYape, detenerTodo } = useYape();

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
            await Promise.all([
                escucharPendientes(user.value.email),
                escucharMisVentas(user.value.email, sucursalActual.value)
            ]);
        }
    } catch (error) {
        console.error("Error dashboard:", error);
    } finally {
        globalLoading.value = false;
    }
};

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
        escucharMisVentas(user.value.email, sucursalActual.value);
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
 * @param yape - 
 */
const handlePesca = async (yape) => {
    confirm.require({
        message: `Confirmar S/ ${yape.amount} de ${yape.senderName}?`,
        header: 'Confirmar Ingreso',
        accept: async () => {
            await reclamarYape(yape.id, sucursalActual.value, nombreSucursalActual.value);
            toast.add({ severity: 'success', summary: 'Venta Registrada' });
        }
    });
};

/**
 * Utilitario para simular datos de transacciones
 */
const handleSimulacion = () => {
    if (user.value?.email) simularDatos(user.value.email);
};
</script>