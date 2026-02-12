<template>
  <div class="admin-container">
    
    <header class="admin-topbar">
      <div class="brand-section">
        <div class="titles">
          <h1>PANEL DE ADMINISTRADOR</h1>
          <p class="greeting">👋 Hola, {{ userName }}</p>
        </div>
      </div>

      <div class="user-section">
        <Avatar
          :label="userInitial"
          shape="circle"
          size="large"
          class="cursor-pointer bg-slate-800 text-white"
          @click="toggleUserMenu"
        />
        <Menu ref="userMenu" :model="userMenuItems" popup />
      </div>
    </header>

    <Card class="filters-card mb-4">
      <template #content>
        <div class="filters-grid flex gap-4 items-end flex-wrap">
          <div class="filter-item flex flex-col gap-1">
            <label class="font-bold text-sm">Desde:</label>
            <DatePicker v-model="filters.startDate" dateFormat="dd/mm/yy" showIcon iconDisplay="input" />
          </div>
          <div class="filter-item flex flex-col gap-1">
            <label class="font-bold text-sm">Hasta:</label>
            <DatePicker v-model="filters.endDate" dateFormat="dd/mm/yy" showIcon iconDisplay="input" />
          </div>
          <div class="filter-item flex flex-col gap-1 min-w-[200px]">
            <label class="font-bold text-sm">Sede:</label>
            <Select
              v-model="filters.branchId"
              :options="sedeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas las sedes"
              showClear
              class="w-full"
            />
          </div>
          <div class="filter-item flex-grow">
            <Button
              label="Actualizar Datos"
              icon="pi pi-refresh"
              @click="buscarCuadres"
              :loading="loadingReportes"
              class="w-full md:w-auto"
            />
          </div>
        </div>
      </template>
    </Card>

    <div class="admin-content">
      <Tabs value="stats">
        
        <TabList>
            <Tab value="stats">Resumen General</Tab>
            <Tab value="charts">Análisis Gráfico</Tab>
            <Tab value="table">Historial de Cierres</Tab>
        </TabList>

        <TabPanels>
            
            <TabPanel value="stats">
                <div class="p-4 text-center text-gray-500 border border-dashed rounded">
                    Aquí irán las KPI Cards (AdminStats.vue)
                </div>
            </TabPanel>

            <TabPanel value="charts">
                <div class="p-4 text-center text-gray-500 border border-dashed rounded">
                    Aquí irán los Gráficos (AdminCharts.vue)
                </div>
            </TabPanel>

            <TabPanel value="table">
                <AdminTable 
                    :data="reportes" 
                    :loading="loadingReportes"
                    @ver-detalle="verDetalle" 
                />
            </TabPanel>

        </TabPanels>
      </Tabs>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import { useToast } from 'primevue/usetoast';

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import AdminTable from '@/components/admin/AdminTable.vue'; 
import '@/assets/admin.css';
import { 
  collectionGroup,
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { db } from '@/firebaseConfig.js';

const router = useRouter();
const toast = useToast();
const { user, logOut } = useAuth();
const { sucursales, limpiarSucursal } = useSucursal();

const userMenu = ref();
const reportes = ref([]);
const filters = ref({
  startDate: new Date(),
  endDate: new Date(),
  branchId: ''
});
const loadingReportes = ref(false);

const userName = computed(() => user.value?.displayName || 'Admin');
const userInitial = computed(() => (userName.value || 'A').charAt(0).toUpperCase());

const sedeOptions = computed(() => [
  { label: 'Todas las sedes', value: '' },
  ...sucursales.value.map(s => ({ label: s.nombre, value: s.id }))
]);

/**
 * Menú de usuario con opciones para perfil y cierre de sesión
 */
const userMenuItems = computed(() => [
  { label: 'Mi Perfil', icon: 'pi pi-user', command: () => router.push('/profile') },
  { separator: true },
  { label: 'Volver al Selector de Sede', icon: 'pi pi-arrow-left', command: () => router.push('/dashboard') },
  { separator: true },
  { label: 'Cerrar Sesión', icon: 'pi pi-sign-out', command: handleLogout }
]);

const toggleUserMenu = (event) => userMenu.value.toggle(event);

/**
 * Función para cerrar sesión, limpiar datos relacionados con la sucursal y redirigir al login
 */
const handleLogout = async () => {
  await logOut();
  limpiarSucursal();
  router.push('/');
};

/**
 * Función para buscar los cuadres en Firestore según los filtros seleccionados
 * Manejo de errores y notificaciones con PrimeVue Toast
 */
const buscarCuadres = async () => {
  loadingReportes.value = true;
  reportes.value = [];

  try {
    const start = new Date(filters.value.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(filters.value.endDate);
    end.setHours(23, 59, 59, 999);

    const cuadresRef = collectionGroup(db, 'shifts');
    
    const constraints = [
      where('status', '==', 'CLOSED'),
      where('timestampCierre', '>=', Timestamp.fromDate(start)),
      where('timestampCierre', '<=', Timestamp.fromDate(end)),
      orderBy('timestampCierre', 'desc')
    ];

    if (filters.value.branchId) {
       constraints.push(where('sucursalId', '==', filters.value.branchId));
    }

    const q = query(cuadresRef, ...constraints);

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      toast.add({ severity: 'info', summary: 'Sin resultados', detail: 'No hay cierres en este rango.' });
    }

    /**
     * Mapea documentos obtenidos para extraer la información relevante y formatearla
     * - Calculo de diferencia entre transacción y efectivo
     * - Determinación del estado (Cuadrado/Descuadrado)
     */
    reportes.value = snapshot.docs.map(doc => {
      const data = doc.data();
      const mYape = Number(data.totalYape || 0);
      const mEfectivo = Number(data.audit?.declaredCash || 0);
      const diff = Number(data.audit?.difference || 0);
      const estaCuadrado = data.audit?.isBalanced;

      return {
        id: doc.id,
        fecha: data.timestampCierre?.toDate() || new Date(),
        sedeNombre: data.sedeNombre || 'Desconocida',
        cajero: data.cajero || 'Desconocido',
        montoYape: mYape,
        montoEfectivo: mEfectivo,
        totalIngresosDia: Number(data.totalIngresosDia || 0),
        diferencia: diff,
        estado: estaCuadrado ? 'Cuadrado' : 'Descuadrado'
      };
    });
    
    if (!snapshot.empty) {
       toast.add({ severity: 'success', summary: 'Datos actualizados', detail: `${snapshot.size} reportes encontrados`, life: 3000});
    }

  } catch (error) {
    console.error("Error buscando cuadres:", error);
    
    if (error.message.includes('requires an index')) {
      toast.add({ severity: 'warn', summary: 'Falta Índice', detail: 'Revisa la consola (F12) y haz clic en el enlace de Firebase.', life: 10000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los reportes' });
    }
  } finally {
    loadingReportes.value = false;
  }
};

/**
 * Función para mostrar el detalle de cierre
 * TODO: Implementar la vista de detalle con información completa del cierre seleccionado
 */
const verDetalle = () => {
  toast.add({ severity: 'info', summary: 'Detalle', detail: 'Próximamente' });
};
</script>