<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': !isSidebarExpanded }">
    
    <aside class="admin-sidebar">
      <button class="sidebar-toggle" @click="toggleSidebar">
        <i :class="isSidebarExpanded ? 'pi pi-chevron-left' : 'pi pi-chevron-right'"></i>
      </button>

      <div class="sidebar-brand">
        <i class="pi pi-shield"></i>
        <span v-if="isSidebarExpanded">ADMIN</span>
      </div>
      
      <nav class="sidebar-nav">
        <button v-for="tab in tabs" :key="tab.id" 
                :class="['nav-item', { active: activeTab === tab.id }]"
                @click="activeTab = tab.id"
                :title="!isSidebarExpanded ? tab.label : ''">
          <i :class="tab.icon"></i>
          <span v-if="isSidebarExpanded">{{ tab.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <Transition name="menu-pop">
          <div v-if="isUserMenuOpen" class="custom-user-menu">
            <button @click="router.push('/profile')">
              <i class="pi pi-user"></i> <span>Perfil</span>
            </button>
            <button @click="router.push('/dashboard')">
              <i class="pi pi-arrow-left"></i> <span>Monitor</span>
            </button>
            <div class="menu-sep"></div>
            <button class="logout-btn" @click="handleLogout">
              <i class="pi pi-sign-out"></i> <span>Salir</span>
            </button>
          </div>
        </Transition>

        <Avatar 
          :label="userInitial" 
          shape="circle" 
          @click="toggleUserMenu" 
          class="admin-avatar bg-slate-700 text-white" 
        />
      </div>
    </aside>

    <main class="admin-main">
      
      <header class="admin-toolbar">
        <div class="toolbar-left">
          <h1>{{ currentTabLabel }}</h1>
        </div>
        
        <div class="toolbar-right">
          <div class="toolbar-filters">
            <DatePicker v-model="filters.startDate" dateFormat="dd/mm" placeholder="Ini" class="compact-date" />
            <span class="sep">-</span>
            <DatePicker v-model="filters.endDate" dateFormat="dd/mm" placeholder="Fin" class="compact-date" />
            <Select v-model="filters.branchId" :options="sedeOptions" optionLabel="label" optionValue="value" placeholder="Sede" class="compact-select" />
            <Button icon="pi pi-refresh" @click="handleSearch" :loading="loadingReportes" text rounded />
          </div>
        </div>
      </header>

      <section class="admin-viewport custom-scrollbar">
        <Transition name="fade-slide" mode="out-in">
          <div :key="activeTab" class="view-wrapper">
            
            <div v-if="activeTab === 'overview'" class="overview-section">
              <AdminStats :kpis="kpis" />
              <div class="charts-preview-container">
                <AdminCharts :salesData="salesChartData" :branchData="branchChartData" />
              </div>
            </div>

            <div v-else-if="activeTab === 'charts'">
              <AdminCharts :salesData="salesChartData" :branchData="branchChartData" />
            </div>

            <div v-else-if="activeTab === 'table'">
              <AdminTable 
                :data="reportes" 
                :loading="loadingReportes" 
                @ver-detalle="verDetalle" 
              />
            </div>

            <div v-else-if="activeTab === 'inventory'">
              <AdminInventory />
            </div>

          </div>
        </Transition>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import { useAdmin } from '@/composables/useAdmin';
import { useToast } from 'primevue/usetoast';
import { store } from '@/store';

import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import Avatar from 'primevue/avatar';

import AdminTable from '@/components/admin/AdminTable.vue';
import AdminStats from '@/components/admin/AdminStats.vue';
import AdminCharts from '@/components/admin/AdminCharts.vue';
import AdminInventory from '@/components/admin/AdminInventory.vue';

import '@/assets/admin.css';

const activeTab = ref('overview');
const isSidebarExpanded = ref(false);
const isUserMenuOpen = ref(false);

const tabs = [
  { id: 'overview', label: 'Resumen', icon: 'pi pi-th-large' },
  { id: 'charts', label: 'Análisis', icon: 'pi pi-chart-line' },
  { id: 'table', label: 'Cierres', icon: 'pi pi-history' },
  { id: 'inventory', label: 'Inventario', icon: 'pi pi-box' },
];

const router = useRouter();
const toast = useToast();
const { user, logOut } = useAuth();
const { sucursales, limpiarSucursal } = useSucursal();
const { reportes, loadingReportes, buscarCuadres, kpis, salesChartData, branchChartData } = useAdmin();

const filters = ref({
  startDate: new Date(),
  endDate: new Date(),
  branchId: ''
});

const currentTabLabel = computed(() => 
  tabs.find(t => t.id === activeTab.value)?.label
);

const userName = computed(() => user.value?.displayName || 'Admin');
const userInitial = computed(() => (userName.value || 'A').charAt(0).toUpperCase());

const sedeOptions = computed(() => [
  { label: 'Todas las sedes', value: '' },
  ...sucursales.value.map(s => ({ label: s.nombre, value: s.id }))
]);

const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value;
};

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

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
  toast.add({ severity: 'info', summary: 'Detalle', detail: 'Próximamente', life: 3000});
};

// Carga inicial
onMounted(() => {
  if (store.userProfile?.adminPin === '1234') {
  toast.add({ 
    severity: 'warn', 
    summary: 'Acción Requerida', 
    detail: 'Por seguridad, debes cambiar tu PIN antes de administrar.', 
    life: 6000 
  });
  
  router.push('/profile');
  return;
  }
  handleSearch();
});
</script>