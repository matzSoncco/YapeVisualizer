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
              @click="handleSearch"
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
import { useAdmin } from '@/composables/useAdmin';
import { useToast } from 'primevue/usetoast';

import Card from 'primevue/card';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import AdminTable from '@/components/admin/AdminTable.vue'; 
import '@/assets/admin.css';

const router = useRouter();
const toast = useToast();
const { user, logOut } = useAuth();
const { sucursales, limpiarSucursal } = useSucursal();
const { reportes, loadingReportes, buscarCuadres, kpis, salesChartData, branchChartData } = useAdmin();

const userMenu = ref();
const filters = ref({
  startDate: new Date(),
  endDate: new Date(),
  branchId: ''
});

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

const handleSearch = () => {
    buscarCuadres(filters.value);
};

/**
 * Función para mostrar el detalle de cierre
 * TODO: Implementar la vista de detalle con información completa del cierre seleccionado
 */
const verDetalle = () => {
  toast.add({ severity: 'info', summary: 'Detalle', detail: 'Próximamente' });
};
</script>