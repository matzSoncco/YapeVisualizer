<template>
  <div class="dashboard">
    <div class="dashboard-container">
      
      <SucursalSelector v-if="!sucursalActual" />

      <div v-else class="main-dashboard">
        
        <header class="header">
          <div class="header-content">
            <div class="title-section">
              <h1>Monitor Yape</h1>
              <p class="subtitle">Tienda: <strong>{{ sucursalActual }}</strong></p>
            </div>
            <div class="user-section">
              <Button label="Simular Yape" @click="handleSimulacion" />
              <div class="divider"></div>
              <Button @click="cambiarSucursal" class="btn-change">Cambiar</Button>
              <Button @click="handleLogout" class="btn-logout">Salir</Button>
            </div>
          </div>
        </header>

        <PendingList 
          :yapes="yapesPendientes" 
          @pescar="handlePesca" 
        />

        <SalesHistory 
          :ventas="misVentas" 
        />

      </div>
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

const handlePesca = async (yape) => {
  confirm.require({
    message: `¿Confirmas que recibiste S/. ${yape.monto} de ${yape.nombre}?`,
    header: 'Confirmar venta',
    icon: 'pi pi-check-triangle',
    rejectPropts: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptPropts: { label: 'Confirmar', severity: 'success' },
    accept: async () => {
      try {
        await reclamarYape(yape.id, user.value.email, sucursalActual.value);
        toast.add({ severity: 'success', summary: 'Venta confirmada', detail: 'El monto se agregó a tu caja', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar la venta', life: 3000 });
      }
    }
  })
}

const handleSimulacion = () => {
  if (user.value?.email) {
    simularDatos(user.value.email);
    toast.add({ severity: 'info', summary: 'Simulación', detail: 'Se están generando datos de prueba', life: 3000 });
  } else {
    console.error("No hay usuario logueado para simular");
  }
}

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

<style scoped>
.btn-simular {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 10px;
  transition: transform 0.1s;
}
.btn-simular:active { transform: scale(0.95); }

.status-badge {
  background: #d1fae5;
  color: #065f46;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>