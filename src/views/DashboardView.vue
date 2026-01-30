<template>
  <div class="dashboard">
    <Toast />
    <ConfirmDialog />
    <div v-if="!sucursalActual">
      <SucursalSelector />
    </div>

    <div v-else class="dashboard-layout">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="dashboard-header-content">
          <div class="dashboard-title-section">
            <h1>Monitor Yape</h1>
            <p class="dashboard-subtitle">
              Tienda: <strong>{{ nombreSucursalVisual }}</strong>
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

      <!-- Content -->
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
  </div>
</template>

<script setup>
import { onMounted, watch, computed } from 'vue';
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
import { simularDatos } from '@/utils/devSimulator';

/**
 * Composables y variables reactivas
 */
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const { user, logOut } = useAuth();
const { sucursalActual, sucursales, limpiarSucursal } = useSucursal();
const { 
  escucharPendientes, 
  escucharMisVentas, 
  reclamarYape, 
  detenerTodo,
  yapesPendientes, 
  misVentas 
} = useYape();

const unaSucursal = computed(() => sucursales.value.length === 1);

/**
 * Manejo de pesca de Yape
 * @param {Object} yape - Objeto Yape pendiente
 * TODO: Mover a useYape.js
 */
const handlePesca = async (yape) => {
  const sucObj = sucursales.value.find(s => s.id === sucursalActual.value);
  const nombreSucursal = sucObj ? sucObj.nombre : 'Sucursal Desconocida';

  confirm.require({
    message: `¿Confirmas que recibiste S/. ${yape.amount} de ${yape.senderName}?`,
    header: 'Confirmar venta',
    icon: 'pi pi-check-triangle',
    rejectPropts: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptPropts: { label: 'Confirmar', severity: 'success' },
    accept: async () => {
      try {
        await reclamarYape(yape.id, sucursalActual.value, nombreSucursal);
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
    toast.add({ severity: 'info', summary: 'Simulación', detail: 'Se están generando datos de prueba', life: 3000 });
  } else {
    console.error("No hay usuario logueado para simular");
  }
}

/**
 * Cálculo del nombre de la sucursal actual
 * @return {string} Nombre de la sucursal o 'Administrador'
 * TODO: Mover a useSucursal.js
 */
const nombreSucursalVisual = computed(() => {
    if (!sucursalActual.value) return '';
    if (sucursalActual.value === 'ADMIN') return 'Administrador';
    
    const suc = sucursales.value.find(s => s.id === sucursalActual.value);
    return suc ? suc.nombre : 'Cargando...';
});

/**
 * Iniciar listeners de Yape
 */
const iniciarListeners = () => {
  if (user.value && sucursalActual.value) {
    escucharPendientes(user.value.email);
    escucharMisVentas(user.value.email, sucursalActual.value);
  }
}

/**
 * Cambio de sucursal y cierre de sesión
 */
const cambiarSucursal = () => { 
    detenerTodo(); 
    limpiarSucursal(); 
};

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
 * Watchers y hooks
 */
watch(sucursalActual, (nuevo) => {
  if (nuevo) iniciarListeners();
});

watch(user, (nuevo) => {
  if (nuevo && sucursalActual.value) iniciarListeners();
});

onMounted(() => {
  if (sucursalActual.value && user.value) iniciarListeners();
});
</script>