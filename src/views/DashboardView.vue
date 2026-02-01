<template>
  <div class="dashboard">
    <Toast />
    <ConfirmDialog />
    <div v-if="!sucursalActual">
      <SucursalSelector />
    </div>

    <div v-else class="dashboard-layout">

      <div v-if="loadingCaja" class="flex flex-col items-center justify-center h-screen bg-surface-50 dark:bg-surface-900">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400 font-medium">Verificando turno...</p>
      </div>

      <template v-else>
        <Dialog 
          v-model:visible="showAperturaModal" 
          modal 
          header="👋 Iniciar Turno" 
          :style="{ width: '25rem' }"
          :closable="false"
          :closeOnEscape="false"
          :draggable="false"
        >
          <div class="flex flex-col gap-4 pt-2">
            <p class="text-surface-600 dark:text-surface-400 mb-4">
              Para comenzar a recibir pagos, registra quién será el responsable de la caja.
            </p>

            <div class="flex flex-col gap-2 mb-2">
              <label for="cajero" class="font-bold">Nombre del Cajero</label>
              <InputText 
                id="cajero" 
                v-model="nombreCajero" 
                placeholder="Ej. Juan Pérez" 
                class="w-full"
                autofocus
              />
            </div>

            <div class="flex justify-end mt-4">
              <Button 
                label="Abrir Caja" 
                icon="pi pi-check" 
                @click="handleAbrirCaja" 
                :loading="loadingApertura"
                :disabled="!nombreCajero.trim()"
              />
            </div>
          </div>
        </Dialog>

        <div v-if="isSessionOpened">
          <header class="dashboard-header">
            <div class="dashboard-header-content">
              <div class="dashboard-title-section">
                <h1>Monitor Yape</h1>
                <p class="dashboard-subtitle">
                  Tienda: <strong>{{ nombreSucursalActual }}</strong>
                </p>
              </div>
              
              <div class="dashboard-actions">
                <Button 
                  label="Simular Yape" 
                  icon="pi pi-play"
                  @click="handleSimulacion"
                  outlined
                />
                <div class="divider-vertical"></div>
                <Button 
                  label="Cambiar" 
                  icon="pi pi-refresh"
                  @click="cambiarSucursal"
                  text
                />
                <Button 
                  label="Salir" 
                  icon="pi pi-sign-out"
                  @click="handleLogout"
                  severity="danger"
                  text
                />
              </div>
            </div>
          </header>

          <main class="dashboard-content">
            <section v-if="!unaSucursal" class="grid-col-pending">
              <PendingList 
                :yapes="yapesPendientes" 
                @pescar="handlePesca" 
              />
            </section>

            <section class="grid-col-history" :class="{ 'full-width': unaSucursal }">
              <SalesHistory 
                :ventas="misVentas" 
              />
            </section>
          </main>
        </div>

        <div v-else class="flex flex-col items-center justify-center h-full p-8 text-center">
          <i class="pi pi-lock text-6xl text-surface-400 mb-4"></i>
          <h2 class="text-xl font-bold mb-2">Caja Cerrada</h2>
          <p class="mb-4 text-surface-600">Debes iniciar turno para ver el panel.</p>
          <Button label="Abrir Turno" @click="showAperturaModal = true" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';

import SucursalSelector from '../components/SucursalSelector.vue';
import PendingList from '../components/PendingList.vue';
import SalesHistory from '../components/SalesHistory.vue';
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm';
import '../assets/dashboard.css';

import { useAuth } from '../composables/useAuth';
import { useYape } from '../composables/useYape';
import { useSucursal } from '../composables/useSucursal';
import { useCaja } from '@/composables/useCaja';
import { simularDatos } from '@/utils/devSimulator';

/**
 * Composables y variables reactivas
 */
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const { user, logOut } = useAuth();
const { sucursalActual, sucursales, limpiarSucursal, nombreSucursalActual } = useSucursal();
const { 
  escucharPendientes, 
  escucharMisVentas, 
  reclamarYape, 
  detenerTodo,
  yapesPendientes, 
  misVentas 
} = useYape();
const { verificarCajaAbierta, abrirCaja, isSessionOpened } = useCaja();

const showAperturaModal = ref(false);
const nombreCajero = ref('');
const loadingApertura = ref(false);
const loadingCaja = ref(true);

const unaSucursal = computed(() => sucursales.value.length === 1);

/**
 * Método encargado de la apertura de modal en la vista
 */
const handleAbrirCaja = async () => {
  if (!nombreCajero.value.trim()) return;

  loadingApertura.value = true;
  try {
    await abrirCaja(nombreCajero.value);
    showAperturaModal.value = false;
    toast.add({ severity: 'success', summary: 'Turno Iniciado', detail: `Caja abierta por ${nombreCajero.value}`, life: 3000 });
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir la caja' });
  } finally {
    loadingApertura.value = false;
  }
};

/**
 * Manejo de pesca de Yape
 * @param {Object} yape - Objeto Yape pendiente
 * TODO: Mover a useYape.js
 */
const handlePesca = async (yape) => {
  confirm.require({
    message: `¿Confirmas que recibiste S/. ${yape.amount} de ${yape.senderName}?`,
    header: 'Confirmar venta',
    icon: 'pi pi-check-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Confirmar', severity: 'success' },
    accept: async () => {
      try {
        await reclamarYape(yape.id, sucursalActual.value, nombreSucursalActual.value);
        toast.add({ severity: 'success', summary: 'Venta confirmada', detail: 'El monto se agregó a tu caja', life: 3000 });
      } catch (error) {
        console.error("Error al confirmar la venta:", error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar la venta', life: 3000 });
      }
    }
  })
}

/**
 * Manejo de simulación de datos
 * TODO: Mover al utilitario de simulación
 */
const handleSimulacion = () => {
  if (user.value?.email) {
    simularDatos(user.value.email);
    toast.add({ severity: 'info', detail: 'Simulando...', life: 3000 });
  } else {
    console.error("No hay usuario logueado para simular");
  }
}

/**
 * Cierre de sesión
 */
const handleLogout = async () => { 
    detenerTodo(); 
    limpiarSucursal(); 
    await logOut(); 
    router.push('/');
};

/**
 * Cambio de sucursal y cierre de sesión
 */
const cambiarSucursal = () => { 
    detenerTodo(); 
    limpiarSucursal(); 
};

/**
 * Iniciar listeners de Yape
 */
const iniciarLogicaSucursal = async () => {
  if(!user.value || !sucursalActual.value) return;

  loadingCaja.value = true;

  try {
    if (sucursalActual.value !== 'ADMIN') {
      await verificarCajaAbierta();
      
      if (!isSessionOpened.value) {
        showAperturaModal.value = true;
      } else {
        showAperturaModal.value = false;
        await Promise.all([
          escucharPendientes(user.value.email),
          escucharMisVentas(user.value.email, sucursalActual.value)
        ]);
      }
    }
  } finally {
    loadingCaja.value = false;
  }
}

/**
 * Watchers y hooks
 */
watch([user, sucursalActual], () => {
    iniciarLogicaSucursal();
});

onMounted(() => {
    iniciarLogicaSucursal();
});
</script>