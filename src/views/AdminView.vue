<template>
  <div class="admin-container">
    
    <header class="admin-topbar">
      <div class="brand-section">
        <button @click="volverAlDashboard" class="btn-back-dash">
          ← Volver al Dashboard
        </button>
        
        <div class="titles">
          <h1>PANEL DE ADMINISTRADOR</h1>
          <p class="greeting">👋 Hola, {{ userName }}</p>
        </div>
      </div>

      <div class="user-profile-container" ref="dropdownRef">
        <div class="avatar-circle" @click="toggleMenu">
          <span>{{ userInitial }}</span>
        </div>

        <div v-if="showMenu" class="profile-dropdown">
          <div class="dropdown-header">
            <p class="dd-name">{{ userName }}</p>
            <p class="dd-email">{{ user?.email }}</p>
          </div>
          <hr>
          <button @click="irAPerfil" class="dd-item">
            👤 Mi Perfil
          </button>
          <button @click="handleLogout" class="dd-item text-danger">
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </header>

    <section class="filters-bar card">
      <div class="filter-group">
        <label>Desde:</label>
        <input type="date" v-model="filters.startDate" class="input-control" />
      </div>

      <div class="filter-group">
        <label>Hasta:</label>
        <input type="date" v-model="filters.endDate" class="input-control" />
      </div>

      <div class="filter-group">
        <label>Sede:</label>
        <select v-model="filters.branchId" class="input-control select-control">
          <option value="">Todas las sedes</option>
          <option v-for="sucursal in sucursales" :key="sucursal.id" :value="sucursal.id">
            {{ sucursal.nombre }}
          </option>
        </select>
      </div>

      <button @click="buscarCuadres" class="btn-primary" :disabled="loadingReportes">
        {{ loadingReportes ? 'Buscando...' : '🔍 Buscar Reportes' }}
      </button>
    </section>

    <main class="data-section card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Sede</th>
              <th>Total Yape</th>
              <th>Total Efectivo</th>
              <th>Diferencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reporte in reportes" :key="reporte.id">
              <td>{{ formatDate(reporte.fecha) }}</td>
              <td><strong>{{ reporte.sedeNombre }}</strong></td>
              <td class="text-success">S/ {{ reporte.montoYape }}</td>
              <td>S/ {{ reporte.montoEfectivo }}</td>
              <td :class="reporte.diferencia < 0 ? 'text-danger' : 'text-success'">
                S/ {{ reporte.diferencia }}
              </td>
              <td>
                <span :class="['status-pill', reporte.estado === 'Cuadrado' ? 'bg-success' : 'bg-warning']">
                  {{ reporte.estado }}
                </span>
              </td>
              <td>
                <button class="btn-icon" title="Ver detalle">👁️</button>
              </td>
            </tr>

            <tr v-if="reportes.length === 0 && !loadingReportes">
              <td colspan="7" class="text-center py-10 text-gray">
                No se encontraron reportes con los filtros seleccionados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import '@/assets/admin.css';

const router = useRouter();
const { user, logOut } = useAuth();
const { sucursales, limpiarSucursal } = useSucursal();

const showMenu = ref(false);
const dropdownRef = ref(null);
const reportes = ref([]);
const filters = ref({
  startDate: new Date().toISOString().split('T')[0], // Fecha actual
  endDate: new Date().toISOString().split('T')[0],
  branchId: ''
});

const loadingReportes = ref(false);

const userName = computed(() => user.value?.displayName || 'Admin');
const userInitial = computed(() => (userName.value || 'A').charAt(0).toUpperCase());

/**
 * Cerrar el menú al hacer clic afuera
 */
onUnmounted(() => {
  document.removeEventListener('click', closeMenuOutside);
});

/**
 * Alternar el menú de perfil
 * @param e - Evento de clic
 */
const toggleMenu = (e) => { e.stopPropagation(); showMenu.value = !showMenu.value; };
const closeMenuOutside = (e) => { if (dropdownRef.value && !dropdownRef.value.contains(e.target)) showMenu.value = false; };

/**
 * Navegación al dashboard
 */
const volverAlDashboard = () => {
  limpiarSucursal();
  router.push('/dashboard');
};

/**
 * Navegación al perfil
 */
const irAPerfil = () => {
  router.push('/profile');
};

/**
 * Cerrar sesión
 */
const handleLogout = async () => {
  await logOut();
  limpiarSucursal();
  router.push('/');
};

/**
 * Busca los cuadres de caja en Firestore según los filtros.
 */
const buscarCuadres = async () => {
  loadingReportes.value = true;
  console.log("Buscando con filtros:", filters.value);
  
  try {
    // Simulación de carga
    setTimeout(() => {
      loadingReportes.value = false;
      console.log("Busqueda finalizada");
    }, 1000);
  } catch (error) {
    loadingReportes.value = false;
  }
};

/**
 * Formatea fechas para la tabla
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// Manejo de eventos para el menú
onMounted(() => {
  document.addEventListener('click', closeMenuOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOutside);
});
</script>