<template>
  <div class="admin-container">
    <Toast />
    
    <!-- Header -->
    <header class="admin-topbar">
      <div class="brand-section">
        <Button 
          label="Volver al Dashboard"
          icon="pi pi-arrow-left"
          @click="volverAlDashboard"
          outlined
        />
        
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
          style="background-color: var(--dark-jungle-green); color: white; cursor: pointer;"
          @click="toggleUserMenu"
        />
        
        <Menu
          ref="userMenu"
          :model="userMenuItems"
          popup
        />
      </div>
    </header>

    <!-- Filters -->
    <Card class="filters-card">
      <template #content>
        <div class="filters-grid">
          <div class="filter-item">
            <label>Desde:</label>
            <Calendar 
              v-model="filters.startDate" 
              dateFormat="dd/mm/yy"
              showIcon
              iconDisplay="input"
            />
          </div>

          <div class="filter-item">
            <label>Hasta:</label>
            <Calendar 
              v-model="filters.endDate" 
              dateFormat="dd/mm/yy"
              showIcon
              iconDisplay="input"
            />
          </div>

          <div class="filter-item">
            <label>Sede:</label>
            <Select
              v-model="filters.branchId"
              :options="sedeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas las sedes"
              showClear
            />
          </div>

          <div class="filter-item" style="align-self: flex-end;">
            <Button
              label="Buscar Reportes"
              icon="pi pi-search"
              @click="buscarCuadres"
              :loading="loadingReportes"
              style="width: 100%;"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Data Table -->
    <Card class="data-card">
      <template #content>
        <DataTable
          :value="reportes"
          :loading="loadingReportes"
          stripedRows
          :paginator="reportes.length > 10"
          :rows="10"
          responsiveLayout="scroll"
        >
          <Column field="fecha" header="Fecha">
            <template #body="slotProps">
              {{ formatearFecha(slotProps.data.fecha) }}
            </template>
          </Column>

          <Column field="sedeNombre" header="Sede">
            <template #body="slotProps">
              <strong>{{ slotProps.data.sedeNombre }}</strong>
            </template>
          </Column>

          <Column field="montoYape" header="Total Yape">
            <template #body="slotProps">
              <span class="text-success">
                S/ {{ slotProps.data.montoYape }}
              </span>
            </template>
          </Column>

          <Column field="montoEfectivo" header="Total Efectivo">
            <template #body="slotProps">
              S/ {{ slotProps.data.montoEfectivo }}
            </template>
          </Column>

          <Column field="diferencia" header="Diferencia">
            <template #body="slotProps">
              <span :class="slotProps.data.diferencia < 0 ? 'text-danger' : 'text-success'">
                S/ {{ slotProps.data.diferencia }}
              </span>
            </template>
          </Column>

          <Column field="estado" header="Estado">
            <template #body="slotProps">
              <Tag 
                :value="slotProps.data.estado"
                :severity="slotProps.data.estado === 'Cuadrado' ? 'success' : 'warning'"
              />
            </template>
          </Column>

          <Column header="Acciones">
            <template #body>
              <Button
                icon="pi pi-eye"
                text
                rounded
                severity="secondary"
                @click="verDetalle"
              />
            </template>
          </Column>

          <template #empty>
            <div class="empty-table">
              <i class="pi pi-inbox" style="font-size: 3rem; color: var(--jet); opacity: 0.3;"></i>
              <p>No se encontraron reportes con los filtros seleccionados.</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import { useToast } from 'primevue/usetoast';
import { formatearFecha } from '@/utils/dates';

import '@/assets/admin.css';

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

// Opciones para el Select de sedes
const sedeOptions = computed(() => [
  { label: 'Todas las sedes', value: '' },
  ...sucursales.value.map(s => ({ label: s.nombre, value: s.id }))
]);

// Menu items para el dropdown de usuario
const userMenuItems = computed(() => [
  {
    label: 'Mi Perfil',
    icon: 'pi pi-user',
    command: () => router.push('/profile')
  },
  {
    separator: true
  },
  {
    label: 'Cerrar Sesión',
    icon: 'pi pi-sign-out',
    command: handleLogout
  }
]);

const toggleUserMenu = (event) => {
  userMenu.value.toggle(event);
};

const volverAlDashboard = () => {
  limpiarSucursal();
  router.push('/dashboard');
};

const handleLogout = async () => {
  await logOut();
  limpiarSucursal();
  router.push('/');
};

const buscarCuadres = async () => {
  loadingReportes.value = true;
  console.log("Buscando con filtros:", filters.value);
  
  try {
    // Simulación de carga
    setTimeout(() => {
      loadingReportes.value = false;
      toast.add({ 
        severity: 'info', 
        summary: 'Búsqueda completa', 
        detail: 'No se encontraron reportes', 
        life: 3000 
      });
    }, 1000);
  } catch (error) {
    loadingReportes.value = false;
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo buscar reportes', 
      life: 3000 
    });
  }
};

const verDetalle = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Detalle', 
    detail: 'Función en desarrollo', 
    life: 3000 
  });
};
</script>